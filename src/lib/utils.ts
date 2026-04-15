import { Property } from '@/types';

export function formatPrice(price: number, unit: string): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);

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
