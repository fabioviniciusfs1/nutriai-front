"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { getInitials, useAuth } from "@/lib/auth";
import { ApiError, apiFetch } from "@/lib/api/client";
import { useApiQuery } from "@/lib/api/query";
import type { ChatMessage } from "@/lib/api/types";
import { Spinner } from "@/components/api/QueryStatus";

export function ChatPanel() {
  const history = useApiQuery<ChatMessage[]>("/chat/messages");
  const suggestions = useApiQuery<string[]>("/chat/suggestions").data ?? [];
  // Mensagens desta visita, depois do histórico carregado do backend.
  const [sent, setSent] = useState<ChatMessage[]>([]);
  const [waiting, setWaiting] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const userName = useAuth()?.user?.name ?? "";
  const messages = [...(history.data ?? []), ...sent];

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || waiting) return;

    setSent((prev) => [...prev, { id: `local-${Date.now()}`, role: "user", text: trimmed }]);
    setInput("");
    setSendError(null);
    setWaiting(true);
    try {
      const reply = await apiFetch<ChatMessage>("/chat/messages", { method: "POST", body: { text: trimmed } });
      setSent((prev) => [...prev, reply]);
    } catch (error) {
      setSendError(error instanceof ApiError ? error.message : "Erro inesperado.");
    } finally {
      setWaiting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex h-[70vh] flex-col rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="font-semibold text-neutral-900">Assistente Nutricional</p>
            <p className="text-xs text-neutral-500">Online agora</p>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {message.role === "assistant" ? (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Sparkles size={14} />
                </div>
              ) : (
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white"
                >
                  {getInitials(userName)}
                </span>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  message.role === "user"
                    ? "bg-accent text-white"
                    : "bg-neutral-100 text-neutral-700"
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          {history.loading && (
            <div className="flex justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          )}
          {history.error && (
            <p className="text-center text-sm text-neutral-500">
              Não foi possível carregar as conversas anteriores: {history.error.message}{" "}
              <button type="button" onClick={history.reload} className="font-medium text-accent hover:underline">
                Tentar novamente
              </button>
            </p>
          )}
          {waiting && (
            <div className="flex items-end gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Sparkles size={14} />
              </div>
              <div className="rounded-2xl bg-neutral-100 px-4 py-2.5 text-sm text-neutral-500">Digitando…</div>
            </div>
          )}
          {sendError && <p className="text-center text-sm text-red-600">Mensagem não enviada: {sendError}</p>}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage(input);
          }}
          className="flex items-center gap-2 border-t border-neutral-100 pt-4"
        >
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Escreva sua pergunta..."
            className="flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-sm text-neutral-700 outline-none placeholder:text-neutral-400"
          />
          <button
            type="submit"
            aria-label="Enviar mensagem"
            disabled={waiting}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white hover:bg-accent/90 disabled:opacity-60"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-neutral-900">Sugestões</h3>
        <div className="mt-4 flex flex-col gap-2">
          {suggestions.length === 0 && <p className="text-sm text-neutral-400">Nenhuma sugestão no momento.</p>}
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void sendMessage(suggestion)}
              className="rounded-xl bg-neutral-100 px-4 py-3 text-left text-sm text-neutral-600 transition-colors hover:bg-neutral-200"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
