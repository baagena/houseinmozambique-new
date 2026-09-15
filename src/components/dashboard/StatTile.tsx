'use client';

/**
 * The single stat tile every dashboard figure composes from.
 *
 * Figures use the display face and tabular numerals so a column of numbers
 * lines up and does not jitter as values change.
 */

interface StatTileProps {
  label: string;
  value: string | number;
  icon?: string;
  /** Optional supporting line under the figure — units, comparison, context. */
  hint?: string;
  trend?: { value: number; isUp: boolean };
  /** Renders the figure in the status colour, for tiles that carry a verdict. */
  tone?: 'default' | 'good' | 'warn' | 'crit';
}

const TONE_FG: Record<string, string> = {
  default: 'var(--d-text-1)',
  good: 'var(--d-good)',
  warn: 'var(--d-warn)',
  crit: 'var(--d-crit)',
};

export default function StatTile({
  label,
  value,
  icon,
  hint,
  trend,
  tone = 'default',
}: StatTileProps) {
  return (
    <div
      className="p-5 transition-colors"
      style={{
        background: 'var(--d-card)',
        border: '1px solid var(--d-border)',
        borderRadius: 'var(--d-radius-card)',
        boxShadow: 'var(--d-shadow)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        {icon && (
          <div
            className="flex items-center justify-center"
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--d-radius-sm)',
              background: 'var(--d-border-soft)',
              color: 'var(--d-ink)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 19 }} aria-hidden="true">
              {icon}
            </span>
          </div>
        )}

        {trend && (
          <span
            className="inline-flex items-center gap-0.5 font-semibold"
            style={{
              fontSize: 'var(--d-fs-sm)',
              color: trend.isUp ? 'var(--d-good)' : 'var(--d-crit)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden="true">
              {trend.isUp ? 'trending_up' : 'trending_down'}
            </span>
            {trend.value}%
            <span className="sr-only">{trend.isUp ? 'increase' : 'decrease'}</span>
          </span>
        )}
      </div>

      <p
        className="display tabular"
        style={{ fontSize: 'var(--d-fs-xl)', fontWeight: 600, color: TONE_FG[tone], margin: 0 }}
      >
        {value}
      </p>

      <p style={{ fontSize: 'var(--d-fs-base)', color: 'var(--d-text-2)', margin: '2px 0 0' }}>
        {label}
      </p>

      {hint && (
        <p style={{ fontSize: 'var(--d-fs-sm)', color: 'var(--d-text-3)', margin: '6px 0 0' }}>
          {hint}
        </p>
      )}
    </div>
  );
}
