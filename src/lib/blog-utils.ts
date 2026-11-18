/**
 * Article address from its title. Accents are converted, not dropped:
 * "Formação Imobiliária" → "formacao-imobiliaria" (it used to give
 * "forma-o-imobili-ria", which reads badly in search results). Existing
 * slugs pass through unchanged, so published addresses never move.
 */
export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `post-${Date.now()}`;
}

export function estimateReadTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function formatPostDate(date: Date | string | null | undefined) {
  if (!date) return 'Draft';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}
