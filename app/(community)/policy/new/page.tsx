import { PolicyDraftForm } from "./_components/policy-draft-form";

export default function NewPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-8 lg:px-12 py-12 md:py-16">
      <div className="mb-10">
        <h1 className="font-serif text-[2.5rem] leading-[2.75rem] font-medium tracking-tight text-[var(--ink-900)] mb-3">
          Propose a policy
        </h1>
        <p className="text-[1rem] leading-[1.625rem] text-[var(--ink-500)] max-w-prose">
          Write a policy draft for your local representatives. Your submission is
          published anonymously — your name and identity are never stored
          alongside your draft.
        </p>
      </div>

      <PolicyDraftForm />
    </div>
  );
}
