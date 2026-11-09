import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import AssessmentServiceClient from '@/components/services/AssessmentServiceClient';

export const metadata: Metadata = buildMetadata({
  title: 'Property Assessment & Photography',
  description:
    'On-site property assessment and professional photography for advertising in Mozambique — edited image sets, a written condition and market assessment, and guidance on asking price.',
  path: '/services/property-assessment',
  keywords: [
    'real estate photography Mozambique',
    'property valuation Mozambique',
    'property photos Maputo',
  ],
});

export default function PropertyAssessmentPage() {
  return <AssessmentServiceClient />;
}
