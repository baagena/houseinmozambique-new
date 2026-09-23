'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';
import Icon from '@/components/ui/Icon';

/** Where both branches land once the visitor has a session. */
const AFTER_AUTH = '/dashboard/agent/new';

const SIGN_IN = `/auth?redirect=${encodeURIComponent(AFTER_AUTH)}`;
const REGISTER = `/auth?tab=signup&redirect=${encodeURIComponent(AFTER_AUTH)}`;

/**
 * The account question, asked once, before the form.
 *
 * A listing belongs to an agent — it needs somewhere to send the enquiries and
 * someone to hold the contact buttons — so there is no version of this flow
 * that skips the account. Asking up front is kinder than letting someone fill
 * in six steps and a photo upload before discovering that.
 *
 * The three steps under the buttons exist for the same reason: they say what
 * the whole job is before it starts, so nobody is surprised by the email
 * verification in the middle of it.
 */
export default function PostListingGate() {
  const { t } = useLanguage();
  const c = t.postListing;

  return (
    <div className="section">
      <div className="wrap" style={{ maxWidth: 940 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="eyebrow">{c.eyebrow}</span>
          <h1 style={{ margin: '.4rem 0 .6rem' }}>{c.title}</h1>
          <p style={{ maxWidth: '52ch', margin: '0 auto', color: 'var(--hm-muted, #5b616b)' }}>
            {c.subtitle}
          </p>
        </div>

        <div className="gate-grid">
          <div className="gate-card">
            <div className="gate-ico" aria-hidden="true">
              <Icon name="login" size={22} />
            </div>
            <h2>{c.haveAccountTitle}</h2>
            <p>{c.haveAccountDesc}</p>
            <Link href={SIGN_IN} className="btn btn--gold btn--full">
              {c.signIn}
            </Link>
          </div>

          <div className="gate-card">
            <div className="gate-ico" aria-hidden="true">
              <Icon name="person_add" size={22} />
            </div>
            <h2>{c.newHereTitle}</h2>
            <p>{c.newHereDesc}</p>
            <Link href={REGISTER} className="btn btn--ghost btn--full">
              {c.createAccount}
            </Link>
          </div>
        </div>

        <ol className="gate-steps">
          <li>
            <span className="gate-step-n">1</span>
            <div>
              <strong>{c.step1Title}</strong>
              <span>{c.step1Desc}</span>
            </div>
          </li>
          <li>
            <span className="gate-step-n">2</span>
            <div>
              <strong>{c.step2Title}</strong>
              <span>{c.step2Desc}</span>
            </div>
          </li>
          <li>
            <span className="gate-step-n">3</span>
            <div>
              <strong>{c.step3Title}</strong>
              <span>{c.step3Desc}</span>
            </div>
          </li>
        </ol>

        <p className="gate-foot">
          {c.pricingNote}{' '}
          <Link href="/pricing">{c.pricingLink}</Link>
        </p>
      </div>
    </div>
  );
}
