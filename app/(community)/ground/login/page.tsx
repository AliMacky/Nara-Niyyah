"use client";

/**
 * Ground portal login page.
 *
 * Temporary: email-only entry (no magic link) while n8n auth is being set up.
 * Volunteer enters their email and goes straight to the dashboard.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function GroundLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass = cn(
    "w-full bg-[var(--paper-50)]",
    "text-[1rem] leading-[1.5rem] text-[var(--ink-900)]",
    "placeholder:text-[var(--ink-300)]",
    "border border-[var(--paper-300)] rounded-md",
    "py-3 px-4",
    "outline-none",
    "focus:ring-2 focus:ring-[var(--clay-500)] focus:border-transparent",
    "transition-all duration-150",
    "disabled:opacity-50",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ground/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        router.push("/ground");
      } else {
        setError("Something went wrong. Try again.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--paper-50)] px-6">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-10">
          <h1 className="font-serif text-[2.5rem] leading-[2.75rem] font-medium tracking-tight text-[var(--ink-900)] mb-1">
            Nara Ground
          </h1>
          <p className="text-[0.875rem] leading-[1.25rem] text-[var(--ink-500)]">
            Melissa for CD9 · Volunteer portal
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="ground-email"
            className="block text-[0.75rem] leading-[1rem] font-medium uppercase tracking-wider text-[var(--ink-700)] mb-2"
          >
            Email address
          </label>
          <input
            id="ground-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
            disabled={loading}
            autoFocus
            autoComplete="email"
          />

          {error && (
            <p className="mt-3 text-[0.875rem] text-[var(--sentiment-neg-strong)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className={cn(
              "mt-5 w-full",
              "bg-[var(--clay-600)] text-[var(--paper-50)]",
              "border border-[var(--clay-600)]",
              "text-[0.875rem] leading-[1.25rem] font-medium",
              "rounded-md px-5 py-2.5",
              "hover:bg-[var(--clay-500)]",
              "outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper-50)]",
              "transition-colors duration-120",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {loading ? "Entering…" : "Enter the portal"}
          </button>

          <p className="mt-6 text-[0.8125rem] leading-[1.375rem] text-[var(--ink-300)]">
            Demo access:{" "}
            <button
              type="button"
              onClick={() => setEmail("demo@melissa2026.com")}
              className="font-medium text-[var(--ink-500)] underline underline-offset-2 hover:text-[var(--ink-700)] transition-colors duration-120"
            >
              demo@melissa2026.com
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

