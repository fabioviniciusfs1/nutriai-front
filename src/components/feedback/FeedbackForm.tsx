"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useApiQuery } from "@/lib/api/query";
import { FEEDBACK_PATH, sendFeedback } from "@/lib/api/actions";
import type { Feedback, FeedbackAnswer, FeedbackQuestion } from "@/lib/api/types";
import { QueryStatus } from "@/components/api/QueryStatus";

const TITLE = "Feedback";
const OTHER = "Outro:";

/** O que o usuário preencheu de uma pergunta; `otherChecked` marca o "Outro" (o texto vai em `other`). */
type Draft = { choices: string[]; otherChecked: boolean; other: string; text: string; comment: string };

const EMPTY: Draft = { choices: [], otherChecked: false, other: "", text: "", comment: "" };

const orNull = (text: string) => (text.trim() ? text.trim() : null);

function toAnswer(question: FeedbackQuestion, draft: Draft): FeedbackAnswer {
  return {
    questionId: question.id,
    choices: draft.choices,
    other: draft.otherChecked ? orNull(draft.other) : null,
    text: question.kind === "text" ? orNull(draft.text) : null,
    comment: question.comment ? orNull(draft.comment) : null,
  };
}

/** A obrigatória tem resposta (o "Outro" só conta com texto). */
function answered(question: FeedbackQuestion, draft: Draft) {
  if (question.kind === "text") return draft.text.trim() !== "";
  return draft.choices.length > 0 || (draft.otherChecked && draft.other.trim() !== "");
}

const inputClass =
  "w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent";

/**
 * O "Formulário de validação do Alere.ai", com as perguntas que o backend manda (as mesmas do Google Forms).
 * Depois de enviar, mostra a confirmação e as respostas só para leitura.
 */
export function FeedbackForm() {
  const { data, error, reload } = useApiQuery<Feedback>(FEEDBACK_PATH);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState(false);

  if (!data) return <QueryStatus title={TITLE} error={error} onRetry={reload} />;

  const { form, response } = data;
  const draftOf = (id: string) => drafts[id] ?? EMPTY;
  const update = (id: string, change: Partial<Draft>) =>
    setDrafts((current) => ({ ...current, [id]: { ...(current[id] ?? EMPTY), ...change } }));
  const ready = form.questions.every((q) => !q.required || answered(q, draftOf(q.id)));

  async function submit() {
    if (!data) return;
    setBusy(true);
    await sendFeedback(data.form.questions.map((q) => toAnswer(q, draftOf(q.id))));
    setBusy(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <header className="rounded-2xl border-t-8 border-accent bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-neutral-900">{form.title}</h2>
        <p className="mt-1 text-sm text-neutral-500">{form.description}</p>
        {response && (
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-accent">
            <CheckCircle2 size={18} />
            {form.confirmation}
          </p>
        )}
      </header>

      {form.questions.map((question) =>
        response ? (
          <AnswerView
            key={question.id}
            question={question}
            answer={response.answers.find((a) => a.questionId === question.id)}
          />
        ) : (
          <QuestionField
            key={question.id}
            question={question}
            draft={draftOf(question.id)}
            onChange={(change) => update(question.id, change)}
          />
        )
      )}

      {!response && (
        <div className="flex items-center justify-end gap-3">
          {!ready && <span className="text-xs text-neutral-400">Responda as perguntas obrigatórias (*).</span>}
          <button
            type="button"
            disabled={!ready || busy}
            onClick={() => void submit()}
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
          >
            {busy ? "Enviando…" : "Enviar"}
          </button>
        </div>
      )}
    </div>
  );
}

function QuestionTitle({ question }: { question: FeedbackQuestion }) {
  return (
    <div>
      <h3 className="font-medium text-neutral-900">
        {question.title}
        {question.required && <span className="text-red-500"> *</span>}
      </h3>
      {question.help && <p className="text-xs text-neutral-500">{question.help}</p>}
    </div>
  );
}

function QuestionField({
  question,
  draft,
  onChange,
}: {
  question: FeedbackQuestion;
  draft: Draft;
  onChange: (change: Partial<Draft>) => void;
}) {
  const multiple = question.kind === "multiple";

  function toggle(option: string) {
    if (!multiple) return onChange({ choices: [option], otherChecked: false });
    const choices = draft.choices.includes(option)
      ? draft.choices.filter((choice) => choice !== option)
      : question.options.filter((o) => o === option || draft.choices.includes(o));
    onChange({ choices });
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm">
      <QuestionTitle question={question} />

      {question.kind === "text" ? (
        <textarea
          rows={4}
          maxLength={2000}
          value={draft.text}
          onChange={(event) => onChange({ text: event.target.value })}
          placeholder="Sua resposta"
          className={inputClass}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {question.options.map((option) => (
            <Option
              key={option}
              type={multiple ? "checkbox" : "radio"}
              name={question.id}
              label={option}
              checked={draft.choices.includes(option)}
              onChange={() => toggle(option)}
            />
          ))}
          {question.other && (
            <>
              <Option
                type={multiple ? "checkbox" : "radio"}
                name={question.id}
                label={OTHER}
                checked={draft.otherChecked}
                onChange={() =>
                  onChange(
                    multiple ? { otherChecked: !draft.otherChecked } : { otherChecked: true, choices: [] }
                  )
                }
              />
              {draft.otherChecked && (
                <input
                  autoFocus
                  maxLength={2000}
                  value={draft.other}
                  onChange={(event) => onChange({ other: event.target.value })}
                  placeholder="Qual?"
                  className={inputClass}
                />
              )}
            </>
          )}
        </div>
      )}

      {question.comment && (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">{question.comment}</span>
          <textarea
            rows={4}
            maxLength={2000}
            value={draft.comment}
            onChange={(event) => onChange({ comment: event.target.value })}
            className={`${inputClass} resize-none`}
          />
        </label>
      )}
    </section>
  );
}

/** A pergunta com a resposta enviada, só leitura. */
function AnswerView({ question, answer }: { question: FeedbackQuestion; answer: FeedbackAnswer | undefined }) {
  const values = [
    ...(answer?.choices ?? []),
    ...(answer?.other ? [`${OTHER} ${answer.other}`] : []),
    ...(answer?.text ? [answer.text] : []),
  ];
  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-white p-5 shadow-sm">
      <QuestionTitle question={question} />
      {values.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {values.map((value) => (
            <li key={value} className="whitespace-pre-line text-sm text-neutral-900">
              {value}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-400">Sem resposta.</p>
      )}
      {answer?.comment && (
        <p className="whitespace-pre-line border-l-2 border-neutral-200 pl-3 text-sm text-neutral-500">
          {answer.comment}
        </p>
      )}
    </section>
  );
}

/** Opção de resposta (caixa ou rádio), sem borda. */
function Option({
  type,
  name,
  checked,
  label,
  onChange,
}: {
  type: "radio" | "checkbox";
  name: string;
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-1">
      <input type={type} name={name} checked={checked} onChange={onChange} className="mt-0.5 accent-accent" />
      <span className="text-sm text-neutral-900">{label}</span>
    </label>
  );
}
