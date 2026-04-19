"use client";

/**
 * CommentForm — client island for submitting an anonymous response
 * on a policy draft.
 *
 * After a successful submit, calls router.refresh() so the server component
 * above re-renders and the new comment appears in the list without a full
 * page reload.
 *
 * Per DESIGN_SYSTEM.md § Forms:
 * - Label above field, body-xs uppercase, ink-700
 * - Input: paper-50 background, 1px paper-300 border, py-3 px-4
 * - Focus ring: 2px clay-500
 * - Error text: body-sm, --sentiment-neg-strong
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { NaraButton } from "@/components/nara";
import { submitComment } from "@/server/policy/actions";

const REGIONS = [
  "King County, WA",
  "Multnomah County, OR",
  "Los Angeles County, CA",
  "Maricopa County, AZ",
  "Cook County, IL",
  "Travis County, TX",
  "Denver County, CO",
  "Hennepin County, MN",
];

const fieldBase = cn(
  "w-full bg-[var(--paper-50)] text-[var(--ink-900)]",
  "border border-[var(--paper-300)] rounded-md",
  "px-4 py-3 text-[0.9375rem] leading-[1.5rem]",
  "placeholder:text-[var(--ink-300)]",
  "focus:outline-none focus:ring-2 focus:ring-[var(--clay-500)] focus:border-transparent",
  "transition-colors duration-[120ms]",
);

interface CommentFormProps {
  draftId: string;
}

export function CommentForm({ draftId }: CommentFormProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [regionLabel, setRegionLabel] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!text.trim()) {
      setError("Response text is required.");
      return;
    }
    if (!regionLabel) {
      setError("Please select your region.");
      return;
    }

    startTransition(async () => {
      try {
        await submitComment(draftId, { text: text.trim(), regionLabel });
        setSubmitted(true);
        setText("");
        // Refresh the server component tree so the new comment appears.
        router.refresh();
      } catch (err) {
        const msg =
          err instanceof Error && err.message === "Not authenticated"
            ? "Sign in to leave a response."
            : "Something went wrong. Please try again.";
        setError(msg);
      }
    });
  }

  if (submitted) {
    return (
      <p className="text-[0.875rem] text-[var(--ink-500)] py-4 border-t border-[var(--paper-200)]">
        Your response has been submitted anonymously. It will appear above.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="pt-8 border-t border-[var(--paper-200)]"
      aria-label="Leave a response"
      noValidate
    >
      <p className="text-[0.75rem] font-medium uppercase tracking-wider text-[var(--ink-700)] mb-5">
        Add a response
      </p>

      {/* Region */}
      <div className="mb-4">
        <label
          htmlFor="comment-region"
          className="block text-[0.75rem] font-medium uppercase tracking-wider text-[var(--ink-700)] mb-1.5"
        >
          Your region
        </label>
        <select
          id="comment-region"
          value={regionLabel}
          onChange={(e) => setRegionLabel(e.target.value)}
          className={cn(fieldBase, "appearance-none cursor-pointer")}
          required
        >
          <option value="" disabled>
            Select region…
          </option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Response text */}
      <div className="mb-5">
        <label
          htmlFor="comment-text"
          className="block text-[0.75rem] font-medium uppercase tracking-wider text-[var(--ink-700)] mb-1.5"
        >
          Response
        </label>
        <textarea
          id="comment-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your thoughts on this proposal…"
          rows={4}
          maxLength={2000}
          className={cn(fieldBase, "resize-y min-h-[100px]")}
          required
        />
        <p className="text-[0.75rem] text-[var(--ink-300)] mt-1 text-right">
          {text.length} / 2000
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="text-[0.875rem] text-[var(--sentiment-neg-strong)] mb-4"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-[0.8125rem] text-[var(--ink-300)]">
          Submitted anonymously. Your identity is not revealed.
        </p>
        <NaraButton
          type="submit"
          variant="secondary"
          disabled={isPending || !text.trim() || !regionLabel}
          className="shrink-0"
        >
          {isPending ? "Submitting…" : "Submit response"}
        </NaraButton>
      </div>
    </form>
  );
}
