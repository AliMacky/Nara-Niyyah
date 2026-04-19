"use client";

/**
 * PolicyDraftForm — react-hook-form + zod form for submitting a new policy draft.
 *
 * Layout: two-column on lg+ screens.
 *   Left  — the form fields (max-w-2xl track)
 *   Right — sticky writing assistant panel (format guide + AI feedback)
 *
 * The assistant reads the live form values via getValues() when the user
 * requests feedback. It never modifies the draft — it only surfaces suggestions.
 * When feedback is fetched, aiAssisted is auto-checked per CLAUDE.md spec.
 *
 * Design spec: DESIGN_SYSTEM.md § Forms
 */

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Wand2, BookOpen, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { NaraButton } from "@/components/nara";
import { submitPolicyDraft } from "@/server/policy/actions";
import { getDraftFeedback } from "@/server/policy/ai-assistant";

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { value: "housing", label: "Housing" },
  { value: "transit", label: "Transit" },
  { value: "environment", label: "Environment" },
  { value: "education", label: "Education" },
  { value: "public-safety", label: "Public Safety" },
  { value: "healthcare", label: "Healthcare" },
  { value: "economic-development", label: "Economic Development" },
  { value: "civil-rights", label: "Civil Rights" },
] as const;

const REGIONS = [
  "King County, WA",
  "Multnomah County, OR",
  "Los Angeles County, CA",
  "Maricopa County, AZ",
  "Cook County, IL",
  "Travis County, TX",
  "Denver County, CO",
  "Hennepin County, MN",
] as const;

const formSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  summary: z
    .string()
    .min(1, "Summary is required")
    .max(500, "Summary must be 500 characters or fewer"),
  category: z.enum([
    "housing", "transit", "environment", "education",
    "public-safety", "healthcare", "economic-development", "civil-rights",
  ]),
  regionLabel: z.string().min(1, "Please select your region"),
  body: z.string().min(10, "Please write at least a brief policy text"),
  aiAssisted: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const labelClass =
  "block text-[0.75rem] font-medium uppercase tracking-wider text-[var(--ink-700)] mb-1.5";

const inputClass = cn(
  "w-full bg-[var(--paper-50)] text-[var(--ink-900)]",
  "border border-[var(--paper-300)] rounded-md",
  "px-4 py-3 text-[0.9375rem] leading-[1.5rem]",
  "placeholder:text-[var(--ink-300)]",
  "focus:outline-none focus:ring-2 focus:ring-[var(--clay-500)] focus:border-transparent",
  "transition-colors duration-[120ms]",
);

const errorClass = "mt-1.5 text-[0.875rem] text-[var(--sentiment-neg-strong)]";

// ---------------------------------------------------------------------------
// Format guide — static reference, no AI required
// ---------------------------------------------------------------------------

const FORMAT_SECTIONS = [
  {
    name: "Purpose",
    description: "What problem does this address and why does it matter to your community?",
  },
  {
    name: "Definitions",
    description: "Define key terms so the policy can't be misinterpreted.",
  },
  {
    name: "Requirements",
    description: "What the policy actually does. Be specific — vague language gets ignored.",
  },
  {
    name: "Funding",
    description: "How is this paid for? Realistic cost estimates strengthen proposals.",
  },
  {
    name: "Enforcement",
    description: "Who ensures compliance? What are the consequences for violations?",
  },
  {
    name: "Timeline",
    description: "When does this take effect? Include a sunset clause if appropriate.",
  },
];

function FormatGuide() {
  return (
    <div>
      <p className="text-[0.8125rem] leading-[1.375rem] text-[var(--ink-500)] mb-5">
        Most effective policy proposals cover these sections. You don&apos;t need all
        of them — but the more you include, the more seriously it&apos;s taken.
      </p>
      <ol className="space-y-4">
        {FORMAT_SECTIONS.map((s, i) => (
          <li key={s.name} className="flex gap-3">
            <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[var(--paper-200)] flex items-center justify-center text-[0.6875rem] font-medium text-[var(--ink-500)]">
              {i + 1}
            </span>
            <div>
              <p className="text-[0.8125rem] font-medium text-[var(--ink-900)] mb-0.5">
                {s.name}
              </p>
              <p className="text-[0.8125rem] leading-[1.375rem] text-[var(--ink-500)]">
                {s.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feedback display
// ---------------------------------------------------------------------------

function FeedbackDisplay({ feedback }: { feedback: string }) {
  // Split on double-newlines to get readable paragraphs
  const paragraphs = feedback.split("\n\n").filter(Boolean);

  return (
    <div className="space-y-3">
      {paragraphs.map((p, i) => {
        // Section headings: short lines that don't end in punctuation
        const isHeading = p.length < 60 && !p.endsWith(".") && !p.endsWith(",");
        return (
          <p
            key={i}
            className={
              isHeading
                ? "text-[0.75rem] font-medium uppercase tracking-wider text-[var(--ink-700)] mt-4 first:mt-0"
                : "text-[0.8125rem] leading-[1.4375rem] text-[var(--ink-700)]"
            }
          >
            {p}
          </p>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PolicyDraftForm
// ---------------------------------------------------------------------------

export function PolicyDraftForm() {
  const router = useRouter();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isFetchingFeedback, startFeedbackTransition] = useTransition();

  // Assistant panel state
  const [assistantTab, setAssistantTab] = useState<"guide" | "feedback">("guide");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Character counts — tracked via onChange to avoid react-hook-form watch()
  // incompatibility with React Compiler.
  const [summaryLength, setSummaryLength] = useState(0);
  const [bodyLength, setBodyLength] = useState(0);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { aiAssisted: false },
  });

  function onSubmit(data: FormValues) {
    startSubmitTransition(async () => {
      try {
        const { draftId } = await submitPolicyDraft(data);
        router.push(`/policy/${draftId}`);
      } catch (err) {
        if (err instanceof Error && err.message === "Not authenticated") {
          alert("Please sign in to submit a policy draft.");
        } else {
          throw err;
        }
      }
    });
  }

  function handleGetFeedback() {
    setFeedbackError(null);
    const { title, category, body } = getValues();
    startFeedbackTransition(async () => {
      try {
        const result = await getDraftFeedback({ title, category, body });
        setFeedback(result.feedback);
        setAssistantTab("feedback");
        // Auto-mark as AI-assisted now that the assistant has been used
        setValue("aiAssisted", true);
      } catch {
        setFeedbackError("Couldn't reach the assistant. Try again in a moment.");
      }
    });
  }

  return (
    <div className="flex flex-col lg:flex-row lg:gap-12 lg:items-start">

      {/* ------------------------------------------------------------------ */}
      {/* Left — form fields                                                  */}
      {/* ------------------------------------------------------------------ */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex-1 min-w-0 max-w-2xl space-y-6"
      >
        {/* Title */}
        <div>
          <label htmlFor="title" className={labelClass}>Title</label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Zero-Fare Transit Pilot Program"
            className={cn(inputClass, errors.title && "border-[var(--sentiment-neg-strong)]")}
            {...register("title")}
          />
          {errors.title && (
            <p className={errorClass} role="alert">{errors.title.message}</p>
          )}
        </div>

        {/* Category + Region */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className={labelClass}>Category</label>
            <select
              id="category"
              className={cn(inputClass, "appearance-none cursor-pointer", errors.category && "border-[var(--sentiment-neg-strong)]")}
              {...register("category")}
            >
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.category && (
              <p className={errorClass} role="alert">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="region" className={labelClass}>Your region</label>
            <select
              id="region"
              className={cn(inputClass, "appearance-none cursor-pointer", errors.regionLabel && "border-[var(--sentiment-neg-strong)]")}
              {...register("regionLabel")}
            >
              <option value="">Select region…</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {errors.regionLabel && (
              <p className={errorClass} role="alert">{errors.regionLabel.message}</p>
            )}
          </div>
        </div>

        {/* Summary */}
        <div>
          <label htmlFor="summary" className={labelClass}>
            Summary
            <span className="ml-2 normal-case font-normal text-[var(--ink-300)]">
              (one sentence — shown in the feed)
            </span>
          </label>
          <textarea
            id="summary"
            rows={2}
            maxLength={500}
            placeholder="Briefly describe what this policy would do and why it matters."
            className={cn(inputClass, "resize-none", errors.summary && "border-[var(--sentiment-neg-strong)]")}
            {...register("summary", {
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setSummaryLength(e.target.value.length),
            })}
          />
          <div className="flex justify-between items-start mt-1">
            {errors.summary ? (
              <p className={errorClass} role="alert">{errors.summary.message}</p>
            ) : <span />}
            <p className="text-[0.75rem] text-[var(--ink-300)] ml-auto">
              {summaryLength} / 500
            </p>
          </div>
        </div>

        {/* Policy body */}
        <div>
          <label htmlFor="body" className={labelClass}>
            Policy text
            <span className="ml-2 normal-case font-normal text-[var(--ink-300)]">
              (full draft — use the format guide on the right if you need help)
            </span>
          </label>
          <textarea
            id="body"
            rows={14}
            placeholder={`Section 1. Purpose\n\nDescribe the goal of this policy…\n\nSection 2. Definitions\n\n…`}
            className={cn(
              inputClass,
              "resize-y min-h-[220px] font-mono text-[0.875rem]",
              errors.body && "border-[var(--sentiment-neg-strong)]",
            )}
            {...register("body", {
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setBodyLength(e.target.value.length),
            })}
          />
          <div className="flex justify-between items-start mt-1">
            {errors.body ? (
              <p className={errorClass} role="alert">{errors.body.message}</p>
            ) : <span />}
            <p className="text-[0.75rem] text-[var(--ink-300)] ml-auto">
              {bodyLength} chars
            </p>
          </div>
        </div>

        {/* AI-assisted disclosure */}
        <div className="flex items-start gap-3 pt-2">
          <input
            id="ai-assisted"
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-[var(--paper-300)] accent-[var(--clay-600)] cursor-pointer"
            {...register("aiAssisted")}
          />
          <div>
            <label
              htmlFor="ai-assisted"
              className="text-[0.9375rem] text-[var(--ink-700)] cursor-pointer select-none"
            >
              I used AI assistance while drafting this policy
            </label>
            <p className="text-[0.8125rem] text-[var(--ink-300)] mt-0.5">
              Auto-checked when you use the writing assistant. AI-assisted drafts
              are labeled in the feed so readers can weigh authorship accordingly.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-[var(--paper-200)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[0.8125rem] text-[var(--ink-300)] max-w-xs">
            Your draft is published anonymously. Your name and identity are not
            stored alongside it.
          </p>
          <NaraButton
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="shrink-0 sm:self-end"
          >
            {isSubmitting ? "Submitting…" : "Publish draft"}
          </NaraButton>
        </div>
      </form>

      {/* ------------------------------------------------------------------ */}
      {/* Right — writing assistant panel (sticky on desktop)                */}
      {/* ------------------------------------------------------------------ */}
      <aside className="w-full lg:w-[288px] lg:shrink-0 lg:sticky lg:top-8 mt-8 lg:mt-0">
        <div className="rounded-md border border-[var(--paper-300)] bg-[var(--paper-100)] overflow-hidden">

          {/* Panel header */}
          <div className="px-5 pt-5 pb-4 border-b border-[var(--paper-200)]">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 size={15} strokeWidth={1.75} className="text-[var(--clay-600)]" />
              <span className="text-[0.75rem] font-medium uppercase tracking-wider text-[var(--ink-700)]">
                Writing assistant
              </span>
            </div>

            {/* Tab row */}
            <div className="flex gap-4" role="tablist">
              {(["guide", "feedback"] as const).map((tab) => {
                const active = assistantTab === tab;
                const label = tab === "guide" ? "Format guide" : "Feedback";
                const Icon = tab === "guide" ? BookOpen : MessageSquare;
                return (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setAssistantTab(tab)}
                    className={cn(
                      "flex items-center gap-1.5 pb-1 text-[0.8125rem]",
                      "border-b-2 transition-colors duration-[120ms]",
                      "outline-none focus-visible:underline",
                      active
                        ? "border-[var(--clay-600)] text-[var(--ink-900)] font-medium"
                        : "border-transparent text-[var(--ink-500)] hover:text-[var(--ink-900)]",
                    )}
                  >
                    <Icon size={13} strokeWidth={1.75} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel body */}
          <div className="px-5 py-5">
            {assistantTab === "guide" && <FormatGuide />}

            {assistantTab === "feedback" && (
              <div>
                {feedback ? (
                  <FeedbackDisplay feedback={feedback} />
                ) : (
                  <p className="text-[0.8125rem] leading-[1.375rem] text-[var(--ink-500)]">
                    Write a title and some draft text, then click below to get
                    feedback on what&apos;s working and what&apos;s missing.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Get feedback button */}
          <div className="px-5 pb-5">
            <div className="w-full h-px bg-[var(--paper-200)] mb-4" />
            {feedbackError && (
              <p className="text-[0.8125rem] text-[var(--sentiment-neg-strong)] mb-3">
                {feedbackError}
              </p>
            )}
            <button
              type="button"
              onClick={handleGetFeedback}
              disabled={isFetchingFeedback}
              className={cn(
                "w-full flex items-center justify-center gap-2",
                "text-[0.8125rem] font-medium",
                "py-2.5 rounded-md border transition-colors duration-[120ms]",
                "outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-500)]",
                "disabled:opacity-50 disabled:pointer-events-none",
                "border-[var(--clay-600)] text-[var(--clay-600)]",
                "hover:bg-[var(--clay-100)]",
              )}
            >
              <Wand2 size={13} strokeWidth={1.75} />
              {isFetchingFeedback ? "Getting feedback…" : "Get feedback on your draft"}
            </button>
            <p className="text-[0.6875rem] text-[var(--ink-300)] text-center mt-2">
              Reads your current draft. Does not edit it.
            </p>
          </div>
        </div>
      </aside>

    </div>
  );
}
