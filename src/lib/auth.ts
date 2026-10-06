// Sessão: o token fica no localStorage e os dados do usuário vêm de `GET /me`.
import { ApiError, apiFetch, apiUrl, setToken, useToken } from "@/lib/api/client";
import { invalidate, mutate, useApiQuery } from "@/lib/api/query";
import type { AuthResponse, GoogleLinkResponse, Me, Targets } from "@/lib/api/types";
import type { Profile } from "@/lib/profile";

export type AuthState = {
  user: { name: string; username: string } | null;
  profile: Profile | null;
  targets: Targets | null;
  weighInDue: boolean;
  google: Me["google"];
};

type Result = { ok: true } | { ok: false; error: string };

const SIGNED_OUT: AuthState = { user: null, profile: null, targets: null, weighInDue: false, google: null };

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

// Google: o backend conduz o OAuth e guarda o acesso à Google Health API; o front nunca vê os tokens do
// Google. Dois fluxos: entrar com Google (volta em /login/google) e conectar a conta já logada (volta
// em /perfil/google).
const GOOGLE_STATE_KEY = "nutriai:google-state";
const GOOGLE_INVALID_RETURN = "Não foi possível confirmar a volta do Google. Tente novamente.";

/** Página do front para onde o backend devolve o navegador depois do Google. */
function googleRedirectUri(page: "/login/google" | "/perfil/google") {
  return `${window.location.origin}${page}`;
}

/**
 * `state` aleatório guardado na aba: na volta, confirma que o fluxo foi iniciado aqui (evita CSRF).
 * Sem sessionStorage a volta falha na verificação e o usuário vê o erro.
 */
function newGoogleState() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const state = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  try {
    window.sessionStorage.setItem(GOOGLE_STATE_KEY, state);
  } catch {
    // Ver acima.
  }
  return state;
}

/** Confere o `state` da volta (só vale uma vez). */
function checkGoogleState(params: URLSearchParams) {
  let expected: string | null = null;
  try {
    expected = window.sessionStorage.getItem(GOOGLE_STATE_KEY);
    window.sessionStorage.removeItem(GOOGLE_STATE_KEY);
  } catch {
    // Tratado como estado inválido.
  }
  return expected !== null && params.get("state") === expected;
}

/** Sai do app e vai para a tela de consentimento do Google (via backend) para entrar ou criar conta. */
export function signInWithGoogle() {
  const params = new URLSearchParams({ redirect_uri: googleRedirectUri("/login/google"), state: newGoogleState() });
  window.location.assign(apiUrl(`/auth/google/start?${params}`));
}

/** Volta do login: `?code=...&state=...` em caso de sucesso, `?error=...` se falhou ou foi cancelado. */
export async function completeGoogleSignIn(params: URLSearchParams): Promise<Result> {
  const validState = checkGoogleState(params);
  const error = params.get("error");
  if (error) return { ok: false, error };
  const code = params.get("code");
  if (!code || !validState) return { ok: false, error: GOOGLE_INVALID_RETURN };
  return authenticate("/auth/google/exchange", { code, redirectUri: googleRedirectUri("/login/google") });
}

/**
 * Conecta o Google à conta já logada (necessário para os dados da Google Health API). O backend
 * devolve a URL de consentimento, porque a navegação do navegador não leva o token da sessão.
 */
export async function connectGoogle(): Promise<Result> {
  try {
    const { url } = await apiFetch<GoogleLinkResponse>("/me/google/link", {
      method: "POST",
      body: { redirectUri: googleRedirectUri("/perfil/google"), state: newGoogleState() },
    });
    window.location.assign(url);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof ApiError ? error.message : "Erro inesperado." };
  }
}

/** Volta da conexão: `?connected=1&state=...` em caso de sucesso, `?error=...` se falhou ou foi cancelado. */
export function completeGoogleConnect(params: URLSearchParams): Result {
  const validState = checkGoogleState(params);
  const error = params.get("error");
  if (error) return { ok: false, error };
  if (params.get("connected") !== "1" || !validState) return { ok: false, error: GOOGLE_INVALID_RETURN };
  // /me passa a ter `google`, e atividade e calorias gastas passam a vir da Google Health API.
  invalidate(ME_PATH, "/history", "/nutrition", "/activity-sources");
  return { ok: true };
}

/** Desconecta o Google: o backend apaga os tokens e para de importar os dados. `false` se falhou. */
export async function disconnectGoogle() {
  const me = await mutate<Me>("/me/google", "DELETE", undefined, {
    update: ME_PATH,
    invalidate: ["/history", "/nutrition", "/activity-sources"],
  });
  return me !== null;
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
