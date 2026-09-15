'use client';

import Icon from '@/components/ui/Icon';

/**
 * Status pill.
 *
 * Status is never colour-alone — every pill pairs an icon with a text label, so
 * it still reads for colour-blind users and in greyscale print. That is a
 * non-negotiable from the design package, not a preference.
 */

export type PillTone = 'good' | 'warn' | 'crit' | 'neutral' | 'info';

const TONES: Record<PillTone, { fg: string; bg: string; icon: string }> = {
  good: { fg: 'var(--d-good)', bg: 'var(--d-good-bg)', icon: 'check_circle' },
  warn: { fg: 'var(--d-warn)', bg: 'var(--d-warn-bg)', icon: 'schedule' },
  crit: { fg: 'var(--d-crit)', bg: 'var(--d-crit-bg)', icon: 'error' },
  info: { fg: 'var(--d-slot-1)', bg: 'var(--d-border-soft)', icon: 'info' },
  neutral: { fg: 'var(--d-text-2)', bg: 'var(--d-border-soft)', icon: 'radio_button_unchecked' },
};

/** Maps the status strings already used across the app onto a tone + label. */
export function statusToPill(status: string): { tone: PillTone; label: string; icon?: string } {
  switch (String(status).toUpperCase()) {
    case 'PUBLISHED':
    case 'COMPLETED':
    case 'ACTIVE':
      return { tone: 'good', label: titleCase(status) };
    case 'PENDING':
      return { tone: 'warn', label: 'Pending' };
    case 'REJECTED':
    case 'FAILED':
    case 'REVOKED':
      return { tone: 'crit', label: titleCase(status) };
    default:
      return { tone: 'neutral', label: titleCase(status) };
  }
}

function titleCase(s: string) {
  const lower = String(s).toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

interface PillProps {
  tone?: PillTone;
  /** Overrides the tone's default Material Symbols icon name. */
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Pill({ tone = 'neutral', icon, children, className = '' }: PillProps) {
  const t = TONES[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold whitespace-nowrap ${className}`}
      style={{
        color: t.fg,
        background: t.bg,
        fontSize: 'var(--d-fs-sm)',
        border: '1px solid color-mix(in srgb, currentColor 22%, transparent)',
      }}
    >
      <Icon name={icon || t.icon} size={14} />
      {children}
    </span>
  );
}
