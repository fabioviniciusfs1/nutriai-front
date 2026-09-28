// Cliente HTTP do backend. A URL vem de NEXT_PUBLIC_API_URL, embutida no bundle no `next build`.
import { useSyncExternalStore } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const TOKEN_KEY = "nutriai:token";

export class ApiError extends Error {
  constructor(
    message: string,
    /** 0 = sem resposta (rede, CORS, backend fora do ar). */
    readonly status: number
  ) {
    super(message);
  }
}

const tokenListeners = new Set<() => void>();

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token === null) window.localStorage.removeItem(TOKEN_KEY);
    else window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Armazenamento indisponível (ex.: navegação privada bloqueada): a sessão só dura até recarregar.
  }
  tokenListeners.forEach((listener) => listener());
}

/** Avisa quando o token muda (login, logout ou sessão expirada). */
export function onTokenChange(listener: () => void) {
  tokenListeners.add(listener);
  return () => {
    tokenListeners.delete(listener);
  };
}

// Login/logout em outra aba muda o token no localStorage.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === TOKEN_KEY || event.key === null) tokenListeners.forEach((listener) => listener());
  });
}

/** Token atual; `undefined` no servidor e antes da hidratação. */
export function useToken() {
  return useSyncExternalStore(onTokenChange, getToken, () => undefined);
}

/** Fuso do usuário: o backend usa para saber qual é o "hoje" dele. */
function timeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/**
 * Chama o backend com o token da sessão. Erros viram `ApiError` com a mensagem do corpo
 * (`{ "error": "..." }`) quando houver. Um 401 encerra a sessão.
 */
export async function apiFetch<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: init.method ?? "GET",
      headers: {
        Accept: "application/json",
        "X-Timezone": timeZone(),
        ...(init.body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError("Não foi possível conectar ao servidor. Verifique sua conexão.", 0);
  }

  if (!response.ok) {
    if (response.status === 401 && token) setToken(null);
    const body = await response.json().catch(() => null);
    const message = typeof body?.error === "string" ? body.error : `Erro ${response.status} ao falar com o servidor.`;
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
