// Autenticação simulada no navegador: contas, sessão e perfil ficam no localStorage.
// NÃO é segura — serve só para prototipar o fluxo até existir um backend.
import { useSyncExternalStore } from "react";
import type { Profile } from "@/lib/calorie-target";

const USERS_KEY = "nutriai:users";
const SESSION_KEY = "nutriai:session";

/** Peso registrado pelo usuário. Só histórico: não altera `profile.weightKg` nem a meta calórica. */
export type WeightEntry = {
  id: string;
  /** Data/hora da pesagem em ISO 8601. */
  at: string;
  kg: number;
};

type StoredUser = {
  name: string;
  username: string;
  passwordHash: string;
  profile: Profile | null;
  /** Horário escolhido pelo usuário para cada refeição do plano (id da refeição → "HH:MM"). */
  mealTimes?: Record<number, string>;
  weights?: WeightEntry[];
};

export type AuthState = {
  user: { name: string; username: string } | null;
  profile: Profile | null;
  mealTimes: Record<number, string>;
  /** Ordenados do mais antigo para o mais recente. */
  weights: WeightEntry[];
};

type Result = { ok: true } | { ok: false; error: string };

const listeners = new Set<() => void>();

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readUsers(): Record<string, StoredUser> {
  try {
    return JSON.parse(readStorage(USERS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Armazenamento indisponível (ex.: navegação privada bloqueada): a sessão só dura até recarregar.
  }
  listeners.forEach((listener) => listener());
}

function writeUsers(users: Record<string, StoredUser>) {
  write(USERS_KEY, JSON.stringify(users));
}

async function hashPassword(username: string, password: string) {
  const data = new TextEncoder().encode(`nutriai:${username}:${password}`);
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  // crypto.subtle só existe em contexto seguro (https ou localhost); fallback para acesso via IP na rede local.
  let hash = 0x811c9dc5;
  for (const byte of data) hash = Math.imul(hash ^ byte, 0x01000193);
  return `fnv:${(hash >>> 0).toString(16)}`;
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

  const users = readUsers();
  if (users[username]) return { ok: false, error: "Esse usuário já está em uso." };

  users[username] = {
    name: name.trim(),
    username,
    passwordHash: await hashPassword(username, password),
    profile: null,
  };
  writeUsers(users);
  write(SESSION_KEY, username);
  return { ok: true };
}

export async function signIn(rawUsername: string, password: string): Promise<Result> {
  const username = normalizeUsername(rawUsername);
  const user = readUsers()[username];
  if (!user || user.passwordHash !== (await hashPassword(username, password))) {
    return { ok: false, error: "Usuário ou senha incorretos." };
  }
  write(SESSION_KEY, username);
  return { ok: true };
}

export function signOut() {
  write(SESSION_KEY, null);
}

export function saveProfile(profile: Profile) {
  const username = readStorage(SESSION_KEY);
  const users = readUsers();
  if (!username || !users[username]) return;
  users[username] = { ...users[username], profile };
  writeUsers(users);
}

export function saveMealTime(mealId: number, time: string) {
  const username = readStorage(SESSION_KEY);
  const users = readUsers();
  if (!username || !users[username]) return;
  users[username] = { ...users[username], mealTimes: { ...users[username].mealTimes, [mealId]: time } };
  writeUsers(users);
}

export function addWeightEntry(kg: number, at: Date) {
  const username = readStorage(SESSION_KEY);
  const users = readUsers();
  if (!username || !users[username]) return;
  const entry: WeightEntry = { id: `${at.getTime()}-${Math.random().toString(36).slice(2, 8)}`, at: at.toISOString(), kg };
  users[username] = { ...users[username], weights: [...(users[username].weights ?? []), entry] };
  writeUsers(users);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Mantém abas diferentes sincronizadas (login/logout em outra aba).
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

let cachedKey: string | undefined;
let cachedState: AuthState = { user: null, profile: null, mealTimes: {}, weights: [] };

function getSnapshot(): AuthState {
  const usersRaw = readStorage(USERS_KEY);
  const session = readStorage(SESSION_KEY);
  const key = `${session}|${usersRaw}`;
  if (key === cachedKey) return cachedState;

  const user = session ? readUsers()[session] : undefined;
  cachedKey = key;
  cachedState = user
    ? {
        user: { name: user.name, username: user.username },
        profile: user.profile,
        mealTimes: user.mealTimes ?? {},
        weights: [...(user.weights ?? [])].sort((a, b) => a.at.localeCompare(b.at)),
      }
    : { user: null, profile: null, mealTimes: {}, weights: [] };
  return cachedState;
}

/** `undefined` enquanto o estado do navegador ainda não foi lido (render no servidor e hidratação). */
export function useAuth(): AuthState | undefined {
  return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
}
