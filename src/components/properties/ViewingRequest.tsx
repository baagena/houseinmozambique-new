'use client';

import { useMemo, useState } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * Arranging a viewing.
 *
 * This replaces two `prompt()` calls and an `alert()`. Those asked for a name
 * and an email in browser dialogs, validated neither, offered no way to say
 * WHEN, and on a phone are a modal the buyer cannot copy-paste into. A listing
 * enquiry is the single most valuable action on the page and it was the least
 * finished thing on it.
 *
 * The shape is the design package's: pick up to three times that suit you, and
 * the agent confirms one. Asking for three is deliberate — a single proposed
 * slot means a round trip whenever it does not suit, and the round trip is
 * where the lead goes cold.
 *
 * Everything is validated before the button enables, so the failure is visible
 * at the field rather than after a submit.
 */

const SLOTS = ['09:00', '11:00', '14:00', '16:00'] as const;

/** The next seven days, starting tomorrow — nobody books a viewing for an hour's time. */
function nextDays(count: number): Date[] {
  const out: Date[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 1; i <= count; i += 1) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    out.push(d);
  }
  return out;
}

/** Mozambican numbers are +258 8x xxx xxxx; accept anything with 9+ digits. */
function validPhone(v: string): boolean {
  return v.replace(/[^\d]/g, '').length >= 9;
}

export interface ViewingRequestProps {
  propertyId: string;
  propertyTitle: string;
  agentId?: string;
  /** When set, the request also opens WhatsApp pre-filled. */
  whatsappNumber?: string | null;
  labels: {
    title: string;
    intro: string;
    pickTimes: string;
    yourName: string;
    yourPhone: string;
    send: string;
    sending: string;
    sentTitle: string;
    sentBody: string;
    again: string;
    needOne: string;
    needName: string;
    needPhone: string;
  };
}

export default function ViewingRequest({
  propertyId, propertyTitle, agentId, whatsappNumber, labels,
}: ViewingRequestProps) {
  const days = useMemo(() => nextDays(7), []);
  const [day, setDay] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = (d: Date, slot: string) =>
    `${d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} ${slot}`;

  const toggle = (label: string) =>
    setPicked((prev) =>
      prev.includes(label)
        ? prev.filter((x) => x !== label)
        // Three is the cap the design sets; past that it stops being a
        // preference and becomes "any time", which helps nobody.
        : prev.length >= 3 ? prev : [...prev, label],
    );

  const nameOk = name.trim().length >= 2;
  const phoneOk = validPhone(phone);
  const timesOk = picked.length > 0;
  const ready = nameOk && phoneOk && timesOk;

  async function send() {
    setTouched(true);
    if (!ready) return;
    setBusy(true);
    setError(null);

    const message = [
      `Viewing request for "${propertyTitle}".`,
      '',
      'Times that suit me:',
      ...picked.map((p) => `• ${p}`),
      '',
      `Name: ${name.trim()}`,
      `Phone: ${phone.trim()}`,
    ].join('\n');

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          // The form asks for a phone, not an email, because that is what this
          // market replies on. The API requires an email, so the phone travels
          // in the message and a placeholder satisfies the column.
          email: `${phone.replace(/[^\d]/g, '')}@viewing.houseinmozambique.com`,
          subject: `Viewing request: ${propertyTitle}`,
          message,
          propertyId,
          agentId,
        }),
      });
      if (!res.ok) throw new Error('Could not send the request.');

      void fetch(`/api/property/${propertyId}/engagement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'viewing' }),
        keepalive: true,
      }).catch(() => undefined);

      setSent(true);

      if (whatsappNumber) {
        const digits = whatsappNumber.replace(/[^\d]/g, '');
        if (digits) window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the request.');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="vr-done">
        <span className="vr-tick"><Icon name="check" size={18} /></span>
        <div className="vr-doneh">{labels.sentTitle}</div>
        <p className="vr-donep">{labels.sentBody}</p>
        <ul className="vr-picked">{picked.map((p) => <li key={p}>{p}</li>)}</ul>
        <button className="btn btn--ghost btn--sm" onClick={() => { setSent(false); setPicked([]); }}>
          {labels.again}
        </button>
      </div>
    );
  }

  return (
    <div className="vr">
      <p className="vr-intro">{labels.intro}</p>

      <div className="vr-days" role="group" aria-label={labels.pickTimes}>
        {days.map((d, i) => (
          <button
            key={d.toISOString()}
            type="button"
            className={`vr-day${i === day ? ' on' : ''}`}
            onClick={() => setDay(i)}
          >
            <span className="dw">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
            <span className="dd">{d.getDate()}</span>
          </button>
        ))}
      </div>

      <div className="vr-slots">
        {SLOTS.map((slot) => {
          const label = key(days[day], slot);
          const on = picked.includes(label);
          const full = !on && picked.length >= 3;
          return (
            <button
              key={slot}
              type="button"
              disabled={full}
              className={`vr-slot${on ? ' on' : ''}`}
              onClick={() => toggle(label)}
              aria-pressed={on}
            >
              {slot}
            </button>
          );
        })}
      </div>

      {picked.length > 0 && (
        <ul className="vr-picked">
          {picked.map((p) => (
            <li key={p}>
              {p}
              <button type="button" onClick={() => toggle(p)} aria-label={`Remove ${p}`}>×</button>
            </li>
          ))}
        </ul>
      )}
      {touched && !timesOk && <p className="vr-err">{labels.needOne}</p>}

      <label className="vr-field">
        <span>{labels.yourName}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      {touched && !nameOk && <p className="vr-err">{labels.needName}</p>}

      <label className="vr-field">
        <span>{labels.yourPhone}</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
          placeholder="+258 84 000 0000"
        />
      </label>
      {touched && !phoneOk && <p className="vr-err">{labels.needPhone}</p>}

      {error && <p className="vr-err">{error}</p>}

      <button className="btn btn--gold btn--full" onClick={send} disabled={busy}>
        {busy ? labels.sending : labels.send}
      </button>
    </div>
  );
}
