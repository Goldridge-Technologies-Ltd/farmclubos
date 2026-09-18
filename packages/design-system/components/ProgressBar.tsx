/*
  Progress through a pathway, a module or a cohort.

  The figure is always shown as text beside the bar, not only as a filled
  width: docs/design-system.md §12 requires a text equivalent for anything
  carried by visuals alone.

  Content guardrail (AGENTS.md): only ever fed a real figure, such as
  Enrolment.progressPercent. Never an illustrative one.
*/

type ProgressBarProps = {
  /** 0–100. Values outside the range are clamped, fractions rounded. */
  value: number;
  /** Names what is progressing, for screen readers: "Greenhouse Enterprise". */
  label: string;
  /** Hides the percentage text. Only for a row that states it elsewhere. */
  hideValue?: boolean;
  className?: string;
};

export function ProgressBar({ value, label, hideValue = false, className = "" }: ProgressBarProps) {
  const percent = Math.round(Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0)));

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <div
        aria-label={label}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percent}
        className="h-2 w-full overflow-hidden rounded-full bg-farm-cream-100"
        role="progressbar"
      >
        <span
          className="block h-full rounded-full bg-farm-green-700"
          style={{ width: `${percent}%` }}
        />
      </div>
      {hideValue ? null : (
        <span className="shrink-0 text-sm font-semibold text-farm-green-950">{percent}%</span>
      )}
    </div>
  );
}
