"use client";

/**
 * VoteButton — client island for the "Support this proposal" action.
 *
 * Uses optimistic UI: the button switches to "Supported" immediately on click
 * without waiting for the server round-trip. The server action runs in a
 * transition so isPending disables the button during the request.
 *
 * Per DESIGN_SYSTEM.md § Vote UI: vote counts are never shown raw — the
 * threshold display (hidden below 10, "10+", "100+", etc.) lives server-side
 * in the PolicyDraft type and does not update here. The user sees confirmation
 * that their voice was counted without seeing a number tick up.
 */

import { useState, useTransition } from "react";
import { ThumbsUp } from "lucide-react";
import { NaraButton } from "@/components/nara";
import { voteOnDraft } from "@/server/policy/actions";

interface VoteButtonProps {
  draftId: string;
}

export function VoteButton({ draftId }: VoteButtonProps) {
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleVote() {
    setError(null);
    startTransition(async () => {
      try {
        await voteOnDraft(draftId, 1);
        setSupported(true);
      } catch (err) {
        const msg =
          err instanceof Error && err.message === "Not authenticated"
            ? "Sign in to support this proposal."
            : "Something went wrong. Please try again.";
        setError(msg);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <NaraButton
        variant={supported ? "primary" : "secondary"}
        className="shrink-0 flex items-center gap-2"
        onClick={handleVote}
        disabled={isPending || supported}
        aria-label={
          supported
            ? "You've supported this proposal"
            : "Support this policy proposal"
        }
      >
        <ThumbsUp size={16} strokeWidth={1.75} aria-hidden />
        {isPending ? "Submitting…" : supported ? "Supported" : "Support"}
      </NaraButton>
      {error && (
        <p className="text-[0.8125rem] text-[var(--sentiment-neg-strong)]">
          {error}
        </p>
      )}
    </div>
  );
}
