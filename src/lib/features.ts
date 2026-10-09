// Recursos que podem ser desligados no build (NEXT_PUBLIC_* é embutido no bundle no `next build`).

/** Chat com IA (padrão: ligado). `NEXT_PUBLIC_CHAT_ENABLED=false` tira o item do menu e a página `/chat`. */
export const CHAT_ENABLED = process.env.NEXT_PUBLIC_CHAT_ENABLED?.trim().toLowerCase() !== "false";
