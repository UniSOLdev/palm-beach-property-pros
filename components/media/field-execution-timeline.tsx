import type { FieldStep } from "@/lib/media/types";

export function FieldExecutionTimeline({ steps }: { steps: readonly FieldStep[] }) {
  return (
    <ol className="field-timeline">
      {steps.map((step, index) => (
        <li key={step.id} className="field-timeline-step">
          <div className="field-timeline-marker" aria-hidden>
            <span>{index + 1}</span>
          </div>
          <div className="field-timeline-content">
            <h3 className="text-sm font-semibold text-navy">{step.label}</h3>
            <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
