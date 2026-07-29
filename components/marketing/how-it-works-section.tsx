import { HOW_IT_WORKS_STEPS } from "@/lib/homepage-services";

export function HowItWorksSection() {
  return (
    <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {HOW_IT_WORKS_STEPS.map((step) => (
        <li key={step.step} className="rounded-2xl border border-navy/[0.08] bg-white p-5 shadow-sm">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ocean/10 text-sm font-bold text-ocean">
            {step.step}
          </span>
          <h3 className="mt-4 text-base font-semibold text-navy">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-charcoal/75">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
