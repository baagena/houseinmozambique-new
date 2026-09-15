'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import Pill from '@/components/dashboard/Pill';
import type { ListingDraft } from '@/lib/listing-draft';

const MIN_CHARS = 40;

/** Field label + the draft key it reads, in the order an agent scans them. */
const FIELDS: Array<{ key: keyof ListingDraft; label: string; unit?: string }> = [
  { key: 'type', label: 'Type' },
  { key: 'listingType', label: 'Listing type' },
  { key: 'bedrooms', label: 'Bedrooms' },
  { key: 'bathrooms', label: 'Bathrooms' },
  { key: 'area', label: 'Area', unit: 'm²' },
  { key: 'price', label: 'Price', unit: 'MT' },
  { key: 'neighborhood', label: 'Neighbourhood' },
  { key: 'city', label: 'City' },
  { key: 'address', label: 'Street address' },
];

const card: React.CSSProperties = {
  background: 'var(--d-card)',
  border: '1px solid var(--d-border)',
  borderRadius: 'var(--d-radius-card)',
  boxShadow: 'var(--d-shadow)',
};

const control: React.CSSProperties = {
  border: '1px solid var(--d-border-ctl)',
  borderRadius: 'var(--d-radius-sm)',
  background: 'var(--d-card)',
  color: 'var(--d-text-1)',
  fontSize: 'var(--d-fs-base)',
};

function CardHead({ title, sub, right }: { title: string; sub: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4" style={{ padding: '18px 20px 14px' }}>
      <div>
        <h3 style={{ fontSize: 'var(--d-fs-md)', fontWeight: 600, color: 'var(--d-text-1)', margin: 0 }}>{title}</h3>
        <p style={{ fontSize: 'var(--d-fs-sm)', color: 'var(--d-text-3)', margin: '3px 0 0' }}>{sub}</p>
      </div>
      {right}
    </div>
  );
}

export default function ComposeListingClient({ draftingEnabled }: { draftingEnabled: boolean }) {
  const [source, setSource] = useState('');
  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [titleIndex, setTitleIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = source.trim().length < MIN_CHARS;

  async function handleDraft() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/property/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceText: source.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not draft the listing.');
        return;
      }
      setDraft(data.draft as ListingDraft);
      setTitleIndex(0);
    } catch {
      setError('Could not reach the server. Your text is still here.');
    } finally {
      setBusy(false);
    }
  }

  const missing = new Set(draft?.missing ?? []);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2
            className="display"
            style={{ fontSize: 'var(--d-fs-xl)', fontWeight: 600, color: 'var(--d-text-1)', margin: 0 }}
          >
            Compose a listing
          </h2>
          <p style={{ fontSize: 'var(--d-fs-base)', color: 'var(--d-text-2)', margin: '3px 0 0' }}>
            Describe the property the way you would to a buyer. Everything below is a draft you can change.
          </p>
        </div>
        {draft && (
          <div className="flex items-center gap-2.5">
            <button
              className="inline-flex items-center gap-2 px-4"
              style={{ ...control, height: 36, fontWeight: 500 }}
              onClick={() => { setDraft(null); setError(null); }}
            >
              Start over
            </button>
            <button
              className="inline-flex items-center gap-2 px-4"
              style={{
                height: 36,
                borderRadius: 'var(--d-radius-sm)',
                background: 'var(--d-ink)',
                color: '#ffffff',
                fontSize: 'var(--d-fs-base)',
                fontWeight: 600,
              }}
            >
              <Icon name="check" size={16} />
              Send for approval
            </button>
          </div>
        )}
      </div>

      {!draftingEnabled && (
        <div
          className="flex items-start gap-3 p-4"
          style={{ ...card, borderColor: 'var(--d-warn)', background: 'var(--d-warn-bg)' }}
        >
          <Icon name="error" size={18} style={{ color: 'var(--d-warn)', marginTop: 1 }} />
          <div>
            <p style={{ margin: 0, fontSize: 'var(--d-fs-base)', fontWeight: 600, color: 'var(--d-warn)' }}>
              Drafting is switched off on this environment
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 'var(--d-fs-sm)', color: 'var(--d-warn)' }}>
              ANTHROPIC_API_KEY is not set, so the draft step cannot run. You can still write your description below.
            </p>
          </div>
        </div>
      )}

      {/* 1 — the agent's own words */}
      <div style={card}>
        <CardHead
          title="Describe the property"
          sub="Portuguese or English, notes or a full description — whatever you already have"
        />
        <div style={{ padding: '0 20px 20px' }}>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            rows={7}
            placeholder="Moradia em Sommerschield, 4 quartos, 3 casas de banho, cerca de 320 m². Tem piscina, jardim grande, garagem para dois carros e gerador…"
            className="w-full resize-y p-3.5"
            style={{ ...control, lineHeight: 1.62 }}
          />
          <div className="flex items-center justify-between gap-4 mt-2.5">
            <p style={{ margin: 0, fontSize: 'var(--d-fs-sm)', color: 'var(--d-text-3)' }}>
              <span className="tabular">{source.trim().length}</span> characters
              {tooShort && source.length > 0 && ` · at least ${MIN_CHARS} to draft`}
            </p>
            <button
              onClick={handleDraft}
              disabled={busy || tooShort || !draftingEnabled}
              className="inline-flex items-center gap-2 px-4"
              style={{
                height: 36,
                borderRadius: 'var(--d-radius-sm)',
                background: busy || tooShort || !draftingEnabled ? 'var(--d-border-soft)' : 'var(--d-ink)',
                color: busy || tooShort || !draftingEnabled ? 'var(--d-text-3)' : '#ffffff',
                fontSize: 'var(--d-fs-base)',
                fontWeight: 600,
              }}
            >
              <Icon name={busy ? 'progress_activity' : 'edit_note'} size={16} className={busy ? 'animate-spin' : undefined} />
              {busy ? 'Drafting…' : draft ? 'Draft again' : 'Draft the listing'}
            </button>
          </div>

          {error && (
            <p
              className="flex items-center gap-2 mt-3"
              style={{ margin: '12px 0 0', fontSize: 'var(--d-fs-sm)', color: 'var(--d-crit)' }}
            >
              <Icon name="error" size={15} />
              {error}
            </p>
          )}
        </div>
      </div>

      {draft && (
        <>
          {/* 2 — titles */}
          <div style={card}>
            <CardHead
              title="Suggested titles"
              sub="Pick one or edit it — this is what buyers see first in search results"
            />
            <div style={{ padding: '0 20px 20px' }} className="space-y-2.5">
              {draft.titles.map((title, i) => {
                const selected = i === titleIndex;
                return (
                  <button
                    key={i}
                    onClick={() => setTitleIndex(i)}
                    className="w-full flex items-start gap-3 text-left p-3.5"
                    style={{
                      border: `1px solid ${selected ? 'var(--d-gold-line)' : 'var(--d-border)'}`,
                      borderRadius: 'var(--d-radius-sm)',
                      background: 'var(--d-card)',
                      boxShadow: selected ? '0 0 0 2px color-mix(in srgb, var(--d-gold) 26%, transparent)' : undefined,
                    }}
                  >
                    <span
                      className="flex-none flex items-center justify-center"
                      style={{
                        width: 17, height: 17, borderRadius: '50%', marginTop: 2,
                        border: `1.6px solid ${selected ? 'var(--d-gold-line)' : 'var(--d-border-ctl)'}`,
                      }}
                    >
                      {selected && (
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--d-gold-line)' }} />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block"
                        style={{ fontSize: 'var(--d-fs-md)', fontWeight: 600, color: 'var(--d-text-1)' }}
                      >
                        {title}
                      </span>
                      <span
                        className="block"
                        style={{ fontSize: 'var(--d-fs-sm)', color: 'var(--d-text-3)', marginTop: 4 }}
                      >
                        <span className="tabular">{title.length}</span> characters
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3 — extracted fields */}
          <div style={card}>
            <CardHead
              title="Details found in your description"
              sub="Amber means it was not in your text and still needs you — nothing here is guessed"
              right={
                missing.size > 0 ? (
                  <Pill tone="warn">{missing.size} to fill in</Pill>
                ) : (
                  <Pill tone="good">Nothing missing</Pill>
                )
              }
            />
            <div style={{ padding: '0 20px 20px' }}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {FIELDS.map(({ key, label, unit }) => {
                  const value = draft[key] as string | number | null;
                  const absent = value === null || value === '' || missing.has(key);
                  return (
                    <div
                      key={key}
                      className="p-3"
                      style={{
                        border: `1px solid ${absent ? 'color-mix(in srgb, var(--d-warn) 48%, transparent)' : 'var(--d-border)'}`,
                        borderRadius: 'var(--d-radius-sm)',
                        background: absent ? 'var(--d-warn-bg)' : 'var(--d-card)',
                      }}
                    >
                      <p
                        className="flex items-center justify-between gap-2"
                        style={{
                          margin: '0 0 5px',
                          fontSize: 'var(--d-fs-label)',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          color: absent ? 'var(--d-warn)' : 'var(--d-text-3)',
                        }}
                      >
                        {label}
                        {absent && <Icon name="error" size={14} />}
                      </p>
                      <p
                        className={typeof value === 'number' ? 'tabular' : undefined}
                        style={{
                          margin: 0,
                          fontSize: 'var(--d-fs-md)',
                          fontWeight: 600,
                          fontFamily: typeof value === 'number' ? 'var(--d-font-mono)' : undefined,
                          color: absent ? 'var(--d-warn)' : 'var(--d-text-1)',
                        }}
                      >
                        {absent ? 'Not in the text' : typeof value === 'number' ? value.toLocaleString('en-US') : value}
                        {!absent && unit && (
                          <span style={{ fontSize: 'var(--d-fs-sm)', fontWeight: 500, color: 'var(--d-text-3)', marginLeft: 6 }}>
                            {unit}
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>

              {draft.amenities.length > 0 && (
                <div style={{ borderTop: '1px solid var(--d-border-soft)', marginTop: 14, paddingTop: 13 }}>
                  <p className="eyebrow" style={{ margin: '0 0 8px' }}>Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {draft.amenities.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center px-2.5 py-0.5"
                        style={{
                          borderRadius: 999,
                          background: 'var(--d-border-soft)',
                          border: '1px solid var(--d-border)',
                          fontSize: 'var(--d-fs-sm)',
                          color: 'var(--d-text-1)',
                        }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--d-border-soft)', marginTop: 14, paddingTop: 13 }}>
                <p className="eyebrow" style={{ margin: '0 0 8px' }}>Description for the listing page</p>
                <textarea
                  defaultValue={draft.description}
                  rows={6}
                  className="w-full resize-y p-3.5"
                  style={{ ...control, borderColor: 'var(--d-border)', lineHeight: 1.62 }}
                />
                {draft.sourceLanguage && (
                  <p style={{ margin: '8px 0 0', fontSize: 'var(--d-fs-sm)', color: 'var(--d-text-3)' }}>
                    Written from your notes in English. You wrote in {draft.sourceLanguage}.
                  </p>
                )}
              </div>
            </div>
          </div>

          <p style={{ fontSize: 'var(--d-fs-sm)', color: 'var(--d-text-3)', margin: 0 }}>
            Nothing has been saved yet. An admin reviews every listing before it appears on the site.
          </p>
        </>
      )}
    </div>
  );
}
