import type { ApiError } from "@/lib/api/client";

export function Spinner({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span role="status" className="inline-flex">
      <span className={`animate-spin rounded-full border-2 border-accent/20 border-t-accent ${className}`} />
      <span className="sr-only">Carregando…</span>
    </span>
  );
}

type QueryStatusProps = {
  /** Título do card enquanto os dados não chegam. */
  title?: string;
  error: ApiError | undefined;
  onRetry: () => void;
};

/** Card no lugar do conteúdo enquanto carrega ou quando a busca falhou. */
export function QueryStatus({ title, error, onRetry }: QueryStatusProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      {title && <h3 className="font-semibold text-neutral-900">{title}</h3>}
      <div className="flex min-h-32 flex-col items-center justify-center gap-3 text-center">
        {error ? (
          <>
            <p className="text-sm text-neutral-600">{error.message}</p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-full bg-neutral-100 px-4 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
            >
              Tentar novamente
            </button>
          </>
        ) : (
          <Spinner />
        )}
      </div>
    </div>
  );
}
