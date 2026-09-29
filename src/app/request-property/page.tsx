import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import PropertyRequestForm from '@/components/properties/PropertyRequestForm';
import PropertyRequestHead from '@/components/properties/PropertyRequestHead';

// buildMetadata, like every other public page, so the canonical and the
// Open Graph URL come from the same origin (lib/site.ts) and agree; with only
// `alternates` set, og:url fell back to the homepage.
export const metadata: Metadata = buildMetadata({
  title: 'Tell us what you are looking for',
  description:
    'Post what you need — city, budget, bedrooms — and agents with matching properties come to you. Free, no obligation.',
  path: '/request-property',
});

/**
 * The demand side, as a public page.
 *
 * Everything else on this site asks a buyer to search. This asks them what
 * they want and takes it to the agents instead — which is the half of the
 * market the platform has never served, and the half that makes an agent's
 * subscription worth renewing.
 */
export default function RequestPropertyPage() {
  return (
    <main className="site">
      <section className="wrap prq-wrap">
        <PropertyRequestHead />

        <PropertyRequestForm />
      </section>
    </main>
  );
}
