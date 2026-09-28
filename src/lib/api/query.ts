// Leituras do backend com cache em memória por rota: componentes que pedem a mesma rota
// compartilham uma única requisição. O cache é descartado quando a sessão muda.
import { useEffect, useSyncExternalStore } from "react";
import { ApiError, apiFetch, onTokenChange } from "@/lib/api/client";

type Entry = { data?: unknown; error?: ApiError; loading: boolean };

const EMPTY: Entry = { loading: false };
const cache = new Map<string, Entry>();
const listeners = new Set<() => void>();

function set(path: string, entry: Entry) {
  cache.set(path, entry);
  listeners.forEach((listener) => listener());
}

function load(path: string) {
  const entry = cache.get(path) ?? EMPTY;
  if (entry.loading) return;
  set(path, { ...entry, loading: true, error: undefined });
  apiFetch(path).then(
    (data) => set(path, { data, loading: false }),
    (error: unknown) =>
      set(path, {
        ...cache.get(path),
        loading: false,
        error: error instanceof ApiError ? error : new ApiError("Erro inesperado.", 0),
      })
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
  listeners.forEach((listener) => listener());
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
