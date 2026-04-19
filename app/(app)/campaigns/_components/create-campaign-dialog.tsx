"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NaraButton } from "@/components/nara";
import { createCampaign } from "@/server/campaigns/actions";

interface CreateCampaignDialogProps {
  onClose: () => void;
}

const LOCATIONS = [
  { label: "Everywhere", value: "" },
  { label: "Washington", value: "Washington" },
  { label: "California", value: "California" },
  { label: "Oregon", value: "Oregon" },
  { label: "Texas", value: "Texas" },
  { label: "New York", value: "New York" },
  { label: "Florida", value: "Florida" },
  { label: "Illinois", value: "Illinois" },
  { label: "Colorado", value: "Colorado" },
];

const SCHEDULES = [
  { label: "Daily", value: "daily" as const },
  { label: "Every 3 days", value: "every_3_days" as const },
  { label: "Weekly", value: "weekly" as const },
  { label: "Biweekly", value: "biweekly" as const },
];

export default function CreateCampaignDialog({
  onClose,
}: CreateCampaignDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [termsInput, setTermsInput] = useState("");
  const [terms, setTerms] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [schedule, setSchedule] = useState<
    "daily" | "every_3_days" | "weekly" | "biweekly"
  >("weekly");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && terms.length > 0;

  function handleAddTerm(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = termsInput.trim().replace(/,$/,"");
      if (value && !terms.includes(value) && terms.length < 10) {
        setTerms([...terms, value]);
        setTermsInput("");
      }
    }
  }

  function handleRemoveTerm(termToRemove: string) {
    setTerms(terms.filter((t) => t !== termToRemove));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalTerms = [...terms];
    const trailing = termsInput.trim();
    if (trailing && !finalTerms.includes(trailing)) {
      finalTerms.push(trailing);
    }
    if (finalTerms.length === 0 || !name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const { campaignId } = await createCampaign({
        name: name.trim(),
        terms: finalTerms,
        locationScope: location || undefined,
        scheduleInterval: schedule,
      });
      router.push(`/campaigns/${campaignId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[var(--ink-900)]/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-lg mx-4 bg-[var(--paper-50)] border border-[var(--paper-300)] rounded-lg p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--ink-300)] hover:text-[var(--ink-900)] transition-colors"
          aria-label="Close"
        >
          <X size={20} strokeWidth={1.75} />
        </button>

        <h2 className="font-serif text-[1.75rem] leading-[2rem] font-medium text-[var(--ink-900)] mb-6">
          New campaign
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="campaign-name"
              className="block text-[0.75rem] leading-[1rem] font-medium uppercase tracking-wider text-[var(--ink-700)] mb-2"
            >
              Campaign name
            </label>
            <input
              id="campaign-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Housing Policy Tracker"
              disabled={submitting}
              className={cn(
                "w-full bg-[var(--paper-50)] border border-[var(--paper-300)] rounded-md",
                "py-3 px-4 text-[1rem] text-[var(--ink-900)]",
                "placeholder:text-[var(--ink-300)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--clay-500)]",
                "disabled:opacity-50",
              )}
            />
          </div>

          <div>
            <label
              htmlFor="campaign-terms"
              className="block text-[0.75rem] leading-[1rem] font-medium uppercase tracking-wider text-[var(--ink-700)] mb-2"
            >
              Search terms
            </label>
            {terms.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {terms.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 bg-[var(--paper-200)] text-[var(--ink-700)] text-[0.8125rem] px-2.5 py-1 rounded-md"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(t)}
                      className="text-[var(--ink-300)] hover:text-[var(--ink-900)] ml-0.5"
                      aria-label={`Remove ${t}`}
                    >
                      <X size={12} strokeWidth={2} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              id="campaign-terms"
              type="text"
              value={termsInput}
              onChange={(e) => setTermsInput(e.target.value)}
              onKeyDown={handleAddTerm}
              placeholder={terms.length === 0 ? "e.g. housing policy, rent control" : "Add another term…"}
              disabled={submitting || terms.length >= 10}
              className={cn(
                "w-full bg-[var(--paper-50)] border border-[var(--paper-300)] rounded-md",
                "py-3 px-4 text-[1rem] text-[var(--ink-900)]",
                "placeholder:text-[var(--ink-300)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--clay-500)]",
                "disabled:opacity-50",
              )}
            />
            <p className="mt-1.5 text-[0.875rem] text-[var(--ink-500)]">
              Press Enter or comma to add. Up to 10 terms per campaign.
            </p>
          </div>

          <div>
            <label
              htmlFor="campaign-location"
              className="block text-[0.75rem] leading-[1rem] font-medium uppercase tracking-wider text-[var(--ink-700)] mb-2"
            >
              Location scope
            </label>
            <select
              id="campaign-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={submitting}
              className={cn(
                "w-full bg-[var(--paper-50)] border border-[var(--paper-300)] rounded-md",
                "py-3 px-4 text-[1rem] text-[var(--ink-900)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--clay-500)]",
                "disabled:opacity-50",
              )}
            >
              {LOCATIONS.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-[0.75rem] leading-[1rem] font-medium uppercase tracking-wider text-[var(--ink-700)] mb-2">
              Frequency
            </span>
            <div className="flex flex-wrap gap-2">
              {SCHEDULES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSchedule(s.value)}
                  disabled={submitting}
                  className={cn(
                    "text-[0.8125rem] font-medium px-3 py-1.5 rounded-md",
                    "border transition-colors duration-[120ms]",
                    "outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-500)]",
                    schedule === s.value
                      ? "bg-[var(--clay-600)] text-[var(--paper-50)] border-[var(--clay-600)]"
                      : "border-[var(--paper-300)] text-[var(--ink-500)] hover:border-[var(--ink-700)] hover:text-[var(--ink-900)]",
                    "disabled:opacity-50",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-[0.875rem] text-[var(--sentiment-neg-strong)]">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <NaraButton
              type="submit"
              variant="primary"
              disabled={!canSubmit || submitting}
            >
              {submitting ? "Creating…" : "Create campaign"}
            </NaraButton>
            <NaraButton
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </NaraButton>
          </div>
        </form>
      </div>
    </div>
  );
}
