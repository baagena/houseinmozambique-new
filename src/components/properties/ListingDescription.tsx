/**
 * Renders a generated listing description.
 *
 * Property.description is a plain string — it has to be, because it is also
 * what the mobile API sends, what search engines read and what an agent edits
 * by hand. So the structure lives in the text itself: blank lines separate
 * blocks, and a block whose later lines start with "• " is a heading followed
 * by a list.
 *
 * This parses that shape back out so headings render as headings and bullets
 * as a list, which is the difference between the reference listings on the
 * competing portals and a wall of text. A description written by hand, with no
 * bullets in it, falls through as ordinary paragraphs and looks exactly as it
 * did before.
 */

const BULLET = '• ';

/**
 * Legacy descriptions were pasted out of WhatsApp.
 *
 * Every listing posted before the guided wizard came through a free-text box,
 * and what went into that box was a WhatsApp broadcast: *asterisk bold*,
 * _underscore italics_, "---" rules between sections, emoji. The design
 * package names this exact mess as the reason the box should not exist.
 *
 * The box is gone for new listings, but the ~19 already published still render
 * their markup raw. This is a DISPLAY-layer normalisation only — the stored
 * text is untouched, so nothing is lost and an agent editing the listing still
 * sees what they wrote. A line wrapped entirely in asterisks was a heading in
 * the author's mind, so it becomes one.
 */
function normalise(line: string): { text: string; heading: boolean } {
  let t = line.trim();
  // a rule between sections, not content
  if (/^[-–—_*]{3,}$/.test(t)) return { text: '', heading: false };

  const wrapped = /^\*(.+)\*$/.test(t) && !t.slice(1, -1).includes('*');
  t = t
    .replace(/\*(.+?)\*/g, '$1')   // *bold*
    .replace(/_(.+?)_/g, '$1')     // _italic_
    .trim();

  return { text: t, heading: wrapped && t.length > 0 && t.length < 90 };
}

interface Block {
  heading: string | null;
  bullets: string[];
  paragraph: string | null;
}

export function parseDescription(text: string): Block[] {
  return text
    .split(/\n{2,}/)
    .map((raw) => raw.split('\n').map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0)
    .map<Block | null>((lines) => {
      const bullets = lines.filter((l) => l.startsWith(BULLET)).map((l) => l.slice(BULLET.length));
      const plain = lines.filter((l) => !l.startsWith(BULLET));

      // Legacy WhatsApp block: no bullets, but an asterisk-wrapped opening
      // line the author meant as a heading.
      if (bullets.length === 0 && plain.length > 0) {
        const cleaned = plain.map(normalise).filter((l) => l.text);
        if (cleaned.length === 0) return null;
        const [first, ...rest] = cleaned;
        if (first.heading) {
          return {
            heading: first.text,
            bullets: [],
            paragraph: rest.map((l) => l.text).join(' ') || null,
          };
        }
        return { heading: null, bullets: [], paragraph: cleaned.map((l) => l.text).join(' ') };
      }

      // The first plain line is the heading; any others introduce the list
      // ("…including:"), so they stay as a lead-in paragraph.
      const [heading, ...lead] = plain;
      return {
        heading: heading ?? null,
        bullets,
        paragraph: lead.length ? lead.join(' ') : null,
      };
    })
    .filter((b): b is Block => b !== null);
}

export default function ListingDescription({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const blocks = parseDescription(text);

  return (
    <div className={className ? `listing-desc ${className}` : 'listing-desc'}>
      {blocks.map((b, i) => (
        <div key={i} className="ld-block">
          {b.heading && <h3 className="ld-h">{b.heading}</h3>}
          {b.paragraph && <p className="ld-p">{b.paragraph}</p>}
          {b.bullets.length > 0 && (
            <ul className="ld-list">
              {b.bullets.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
