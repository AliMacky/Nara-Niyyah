"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowser();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (authError) {
      setError("Invalid email or password.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  const inputClass = cn(
    "w-full bg-[var(--paper-50)]",
    "text-[1rem] leading-[1.5rem] text-[var(--ink-900)]",
    "placeholder:text-[var(--ink-300)]",
    "border border-[var(--paper-300)] rounded-md",
    "py-3 px-4",
    "outline-none",
    "focus:ring-2 focus:ring-[var(--clay-500)] focus:border-transparent",
    "transition-all duration-150",
  );

  const labelClass = cn(
    "block text-[0.75rem] leading-[1rem] font-medium",
    "uppercase tracking-wider text-[var(--ink-700)] mb-2",
  );

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--paper-50)] px-6">
      <div className="w-full max-w-sm">
        <h1
          className={cn(
            "font-serif text-[2.5rem] leading-[2.75rem] font-medium tracking-tight",
            "text-[var(--ink-900)] mb-2",
          )}
        >
          Nara
        </h1>
        <p className="text-[0.875rem] leading-[1.25rem] text-[var(--ink-500)] mb-10">
          Civic sentiment, from the ground up.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="login-email" className={labelClass}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="login-password" className={labelClass}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 text-[0.875rem] leading-[1.25rem] text-[var(--sentiment-neg-strong)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "mt-6 w-full",
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
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
