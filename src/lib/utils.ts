import { Property } from '@/types';

/** Prices across the platform are quoted in Meticais and rendered as "MT 1,250,000". */
export const CURRENCY_LABEL = 'MT';

export function formatPrice(price: number, unit: string): string {
  const formatted = `${CURRENCY_LABEL} ${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(price)}`;

  switch (unit) {
    case 'monthly': return `${formatted}`;
    case 'nightly': return `${formatted}`;
    case 'sale': return formatted;
    default: return formatted;
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}
