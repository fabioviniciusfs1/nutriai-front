// Leituras do backend com cache em memória por rota: componentes que pedem a mesma rota
// compartilham uma única requisição. O cache é descartado quando a sessão muda.
import { useEffect, useSyncExternalStore } from "react";
import { ApiError, apiFetch, onTokenChange } from "@/lib/api/client";

type Entry = { data?: unknown; error?: ApiError; loading: boolean };

const EMPTY: Entry = { loading: false };
const cache = new Map<string, Entry>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function set(path: string, entry: Entry) {
  cache.set(path, entry);
  notify();
}

function toApiError(error: unknown) {
  return error instanceof ApiError ? error : new ApiError("Erro inesperado.", 0);
}

function load(path: string) {
  const entry = cache.get(path) ?? EMPTY;
  if (entry.loading) return;
  set(path, { ...entry, loading: true, error: undefined });
  apiFetch(path).then(
    (data) => set(path, { data, loading: false }),
    (error: unknown) => set(path, { ...cache.get(path), loading: false, error: toApiError(error) })
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

onTokenChange(() => {
  cache.clear();
  notify();
});

export type Query<T> = {
  data: T | undefined;
  error: ApiError | undefined;
  /** Sem dados e sem erro ainda (primeira carga). */
  loading: boolean;
  reload: () => void;
};

/** `GET path`. Com `path` `null` não busca nada (ex.: esperando outro dado). */
export function useApiQuery<T>(path: string | null): Query<T> {
  const entry = useSyncExternalStore(
    subscribe,
    () => (path ? (cache.get(path) ?? EMPTY) : EMPTY),
    () => EMPTY
  );

  useEffect(() => {
    if (!path) return;
    const current = cache.get(path);
    if (!current || (current.data === undefined && !current.loading && !current.error)) load(path);
  }, [path, entry]);

  return {
    data: entry.data as T | undefined,
    error: entry.error,
    loading: entry.data === undefined && !entry.error,
    reload: () => {
      if (path) load(path);
    },
  };
}

/** Busca de novo as rotas que começam com algum dos prefixos (as que estão na tela recarregam). */
export function invalidate(...prefixes: string[]) {
  for (const path of cache.keys()) {
    if (prefixes.some((prefix) => path.startsWith(prefix))) load(path);
  }
}

// ---------------------------------------------------------------------------------------------
// Alterações

/** Falha na última alteração; `AuthGuard` mostra como aviso até ser dispensada. */
let mutationError: string | null = null;

/**
 * Envia uma alteração. A resposta substitui o cache de `update` (a rota que ela representa) e as
 * rotas com os prefixos de `invalidate` são buscadas de novo. Em caso de erro mostra o aviso e
 * devolve `null`.
 */
export async function mutate<T>(
  path: string,
  method: string,
  body?: unknown,
  options: { update?: string; invalidate?: string[] } = {}
): Promise<T | null> {
  try {
    const data = await apiFetch<T>(path, { method, body });
    mutationError = null;
    if (options.update) cache.set(options.update, { data, loading: false });
    notify();
    if (options.invalidate) invalidate(...options.invalidate);
    return data;
  } catch (error) {
    mutationError = toApiError(error).message;
    notify();
    return null;
  }
}

export function useMutationError() {
  return useSyncExternalStore(
    subscribe,
    () => mutationError,
    () => null
  );
}

export function dismissMutationError() {
  mutationError = null;
  notify();
}
