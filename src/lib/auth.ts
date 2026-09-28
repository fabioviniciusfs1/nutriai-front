// Sessão: o token fica no localStorage e os dados do usuário vêm de `GET /me`.
import { ApiError, apiFetch, apiUrl, setToken, useToken } from "@/lib/api/client";
import { mutate, useApiQuery } from "@/lib/api/query";
import type { AuthResponse, Me, Targets } from "@/lib/api/types";
import type { Profile } from "@/lib/profile";

export type AuthState = {
  user: { name: string; username: string } | null;
  profile: Profile | null;
  targets: Targets | null;
  weighInDue: boolean;
};

type Result = { ok: true } | { ok: false; error: string };

const SIGNED_OUT: AuthState = { user: null, profile: null, targets: null, weighInDue: false };

export const ME_PATH = "/me";

/**
 * `undefined` enquanto a sessão não foi carregada (render no servidor, hidratação e `GET /me`).
 * `error` preenchido se `GET /me` falhou (ex.: backend fora do ar); `retry` tenta de novo.
 */
export function useSession(): { auth: AuthState | undefined; error: ApiError | undefined; retry: () => void } {
  const token = useToken();
  const me = useApiQuery<Me>(token ? ME_PATH : null);
  if (token === undefined) return { auth: undefined, error: undefined, retry: me.reload };
  if (token === null) return { auth: SIGNED_OUT, error: undefined, retry: me.reload };
  return { auth: me.data, error: me.error, retry: me.reload };
}

export function useAuth(): AuthState | undefined {
  return useSession().auth;
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export async function signUp(name: string, rawUsername: string, password: string): Promise<Result> {
  const username = normalizeUsername(rawUsername);
  if (name.trim().length < 2) return { ok: false, error: "Informe seu nome." };
  if (!/^[a-z0-9._]{3,20}$/.test(username)) {
    return { ok: false, error: "O usuário deve ter de 3 a 20 caracteres: letras, números, ponto ou sublinhado." };
  }
  if (password.length < 6) return { ok: false, error: "A senha deve ter pelo menos 6 caracteres." };

  return authenticate("/auth/signup", { name: name.trim(), username, password });
}

export async function signIn(rawUsername: string, password: string): Promise<Result> {
  return authenticate("/auth/login", { username: normalizeUsername(rawUsername), password });
}

async function authenticate(path: string, body: unknown): Promise<Result> {
  try {
    const { token } = await apiFetch<AuthResponse>(path, { method: "POST", body });
    setToken(token);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof ApiError ? error.message : "Erro inesperado." };
  }
}

// Login com Google: o backend conduz o OAuth (e guarda o acesso à Google Health API). O front só
// manda o navegador para o backend e, na volta em /login/google, troca o código de uso único pelo token.
const GOOGLE_STATE_KEY = "nutriai:google-state";

/** Página para onde o backend devolve o navegador depois do Google. */
function googleRedirectUri() {
  return `${window.location.origin}/login/google`;
}

/** Sai do app e vai para a tela de consentimento do Google (via backend). */
export function signInWithGoogle() {
  // `state` aleatório: na volta, confirma que o login foi iniciado por esta aba (evita CSRF de login).
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const state = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  try {
    window.sessionStorage.setItem(GOOGLE_STATE_KEY, state);
  } catch {
    // Sem sessionStorage a volta falha na verificação e o usuário vê o erro.
  }
  const params = new URLSearchParams({ redirect_uri: googleRedirectUri(), state });
  window.location.assign(apiUrl(`/auth/google/start?${params}`));
}

/** Volta do Google: `?code=...&state=...` em caso de sucesso, `?error=...` se falhou ou foi cancelado. */
export async function completeGoogleSignIn(params: URLSearchParams): Promise<Result> {
  let expectedState: string | null = null;
  try {
    expectedState = window.sessionStorage.getItem(GOOGLE_STATE_KEY);
    window.sessionStorage.removeItem(GOOGLE_STATE_KEY);
  } catch {
    // Tratado abaixo como estado inválido.
  }

  const error = params.get("error");
  if (error) return { ok: false, error };
  const code = params.get("code");
  if (!code || !expectedState || params.get("state") !== expectedState) {
    return { ok: false, error: "Não foi possível confirmar o login com o Google. Tente novamente." };
  }
  return authenticate("/auth/google/exchange", { code, redirectUri: googleRedirectUri() });
}

export function signOut() {
  setToken(null);
}

/** Salva o perfil; o backend recalcula as metas e o plano. `false` se falhou. */
export async function saveProfile(profile: Profile) {
  const me = await mutate<Me>("/me/profile", "PUT", profile, {
    update: ME_PATH,
    invalidate: ["/plan", "/nutrition", "/history"],
  });
  return me !== null;
}
