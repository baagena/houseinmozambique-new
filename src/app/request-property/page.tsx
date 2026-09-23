import type { Metadata } from 'next';
import PropertyRequestForm from '@/components/properties/PropertyRequestForm';
import PropertyRequestHead from '@/components/properties/PropertyRequestHead';

export const metadata: Metadata = {
  title: 'Tell us what you are looking for | House in Mozambique',
  description:
    'Post what you need — city, budget, bedrooms — and agents with matching properties come to you. Free, no obligation.',
  alternates: { canonical: '/request-property' },
};

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
