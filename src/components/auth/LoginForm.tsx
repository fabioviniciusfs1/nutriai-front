"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { signIn, signInWithGoogle, signUp, useAuth } from "@/lib/auth";
import { GoogleIcon } from "@/components/auth/GoogleIcon";

const MODES = [
  { id: "entrar", label: "Entrar" },
  { id: "cadastrar", label: "Criar conta" },
] as const;

type Mode = (typeof MODES)[number]["id"];

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/20";

export function LoginForm() {
  const auth = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("entrar");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Já autenticado (inclusive logo após entrar/cadastrar): segue para o perfil ou para o painel.
  useEffect(() => {
    if (auth?.user) router.replace(auth.profile ? "/" : "/perfil");
  }, [auth, router]);

  // Voltar do Google pelo botão "voltar" pode restaurar a página do cache com o botão travado.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setRedirecting(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  function changeMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Preencha usuário e senha.");
      return;
    }
    if (mode === "cadastrar" && password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    const result = mode === "entrar" ? await signIn(username, password) : await signUp(name, username, password);
    setSubmitting(false);
    if (!result.ok) setError(result.error);
  }

  const PasswordIcon = showPassword ? EyeOff : Eye;

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <span className="text-2xl">🌱</span>
        </div>
        <h1 className="mt-3 text-xl font-semibold text-neutral-900">NutriAI</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {mode === "entrar" ? "Entre para acessar seu plano alimentar" : "Crie sua conta para começar"}
        </p>
      </div>

      <div role="tablist" aria-label="Acesso" className="mt-6 grid grid-cols-2 rounded-full bg-neutral-100 p-1">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            onClick={() => changeMode(item.id)}
            className={`rounded-full py-2 text-sm font-medium transition-colors ${
              mode === item.id ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        {mode === "cadastrar" && (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700">
            Nome
            <input
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              placeholder="Como devemos te chamar?"
              required
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700">
          Usuário
          <input
            className={inputClass}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="seu.usuario"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700">
          Senha
          <span className="relative">
            <input
              className={`${inputClass} pr-10`}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "entrar" ? "current-password" : "new-password"}
              placeholder={mode === "cadastrar" ? "Mínimo de 6 caracteres" : undefined}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-neutral-400 hover:text-neutral-600"
            >
              <PasswordIcon size={16} />
            </button>
          </span>
        </label>

        {mode === "cadastrar" && (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700">
            Confirmar senha
            <input
              className={inputClass}
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
        )}

        <p role="alert" aria-live="polite" className="min-h-5 text-sm text-red-600">
          {error}
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
        >
          {submitting ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" />
        ou
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      {/* Com o Google, a conta é criada no primeiro acesso: serve para entrar e para cadastrar. */}
      <button
        type="button"
        disabled={redirecting}
        onClick={() => {
          setRedirecting(true);
          signInWithGoogle();
        }}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-neutral-300 bg-white py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-60"
      >
        <GoogleIcon />
        {redirecting ? "Abrindo o Google…" : "Continuar com o Google"}
      </button>
    </div>
  );
}
