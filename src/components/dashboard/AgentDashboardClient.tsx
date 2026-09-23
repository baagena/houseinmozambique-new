'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';
import Icon from '@/components/ui/Icon';
import StatTile from '@/components/dashboard/StatTile';

/**
 * The agent overview, following #view-ag-overview in the design package's
 * ops-console-preview.html.
 *
 * The preview has no quick-actions card. Urgency is stated once, at the top, as
 * an alert that only exists when there is something to answer — then the leads
 * themselves are the next thing on the page. A shortcut grid that looks the
 * same whether or not there is work in it is what that replaces.
 *
 * Every figure is computed from the database in page.tsx. Where the data does
 * not exist yet the tile shows an em dash and says so, rather than showing the
 * preview's sample number.
 */

export interface AgentLead {
  id: string;
  name: string;
  contact: string;
  subject: string;
  message: string;
  listing: string | null;
  answered: boolean;
  waitedHours: number;
  createdAt: string;
}

export interface AttentionListing {
  id: string;
  title: string;
  status: string;
  image: string | null;
  score: number;
  band: 'good' | 'warn' | 'crit';
  missing: string[];
}

interface Props {
  agentName: string;
  stats: {
    liveListings: number;
    pendingListings: number;
    views: number;
    contactClicks: number;
    leadsThisMonth: number;
  };
  leads: AgentLead[];
  overdueLeads: number;
  attention: AttentionListing[];
  /** Presses of the listing contact buttons in the last 30 days, by channel. */
  channels: Array<{ channel: string; count: number }>;
  compare: {
    myQuality: number | null;
    marketQuality: number | null;
    myLeadsPerListing: number | null;
    marketLeadsPerListing: number | null;
  };
}

/** The preview's thresholds: a day is critical, four hours is a warning. */
function waitBand(hours: number): 'good' | 'warn' | 'crit' {
  return hours >= 24 ? 'crit' : hours >= 4 ? 'warn' : 'good';
}

type AgentCopy = ReturnType<typeof useLanguage>['t']['dashboard']['agent'];

function waitText(hours: number, t: AgentCopy): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} ${t.unitMin}`;
  if (hours < 48) return `${Math.round(hours)} ${t.unitHours}`;
  return `${Math.round(hours / 24)} ${t.unitDays}`;
}

/** Fills {name}, {count} and {wait} the way the rest of the dictionary does. */
function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (out, [k, v]) => out.replace(`{${k}}`, String(v)),
    template,
  );
}

/** One slot colour per channel, so the bars stay stable as counts reorder. */
const CHANNEL_COLOR: Record<string, string> = {
  WHATSAPP: 'var(--d-good)',
  CALL: 'var(--d-slot-2)',
  EMAIL: 'var(--d-slot-3)',
  FORM: 'var(--d-slot-4)',
  VIEWING: 'var(--d-slot-5)',
};

function channelLabel(channel: string, t: AgentCopy): string {
  switch (channel) {
    case 'WHATSAPP': return t.channelWhatsapp;
    case 'CALL': return t.channelCall;
    case 'EMAIL': return t.channelEmail;
    case 'FORM': return t.channelForm;
    case 'VIEWING': return t.channelViewing;
    default: return channel;
  }
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function AgentDashboardClient({
  agentName, stats, leads, overdueLeads, attention, channels, compare,
}: Props) {
  const t = useLanguage().t.dashboard.agent;
  const waiting = leads.filter((l) => !l.answered);
  const longestWait = waiting.reduce((max, l) => Math.max(max, l.waitedHours), 0);
  const channelTotal = channels.reduce((sum, c) => sum + c.count, 0);

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{fill(t.greeting, { name: agentName.split(' ')[0] })}</h1>
          <p>{t.welcome}</p>
        </div>
        <Link href="/dashboard/agent/new" className="btn primary" style={{ textDecoration: 'none' }}>
          {t.newListing}
        </Link>
      </div>

      {waiting.length > 0 && (
        <div className={`alert ${overdueLeads > 0 ? 'crit' : 'warn'}`}>
          <Icon name="chat_bubble" size={18} />
          <div>
            <div className="a-title">
              {waiting.length === 1
                ? t.waitingOne
                : fill(t.waitingMany, { count: waiting.length })}
            </div>
            <div className="a-sub">
              {longestWait >= 1
                ? fill(t.waitingLongest, { wait: waitText(longestWait, t) })
                : t.waitingGeneric}
            </div>
          </div>
          <Link
            href="/dashboard/agent/leads"
            className={`btn ${overdueLeads > 0 ? 'ghost-crit' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            {t.openLeads}
          </Link>
        </div>
      )}

      <div className="stat-row">
        <StatTile label={t.liveListings} value={stats.liveListings} icon="home_work"
          hint={stats.pendingListings > 0 ? fill(t.notPublished, { count: stats.pendingListings }) : t.allPublished} />
        <StatTile label={t.views} value={stats.views.toLocaleString('en-US')} icon="visibility"
          hint={t.viewsHint} />
        <StatTile label={t.leadsThisMonth} value={stats.leadsThisMonth} icon="mail"
          hint={fill(t.leadsTotal, { count: leads.length })} />
        <StatTile
          label={t.waitingOnYou}
          value={waiting.length}
          icon="schedule"
          tone={overdueLeads > 0 ? 'crit' : waiting.length > 0 ? 'warn' : 'default'}
          hint={overdueLeads > 0 ? fill(t.overdueHint, { count: overdueLeads }) : t.nothingOverdue}
        />
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1.15fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <div className="card-head">
            <h3>{t.leadsWaitingTitle}</h3>
            <Link className="link" href="/dashboard/agent/leads">{t.allLeads}</Link>
          </div>
          {waiting.length === 0 ? (
            <div className="empty">
              <Icon name="mark_email_read" size={34} />
              <p>{t.leadsEmpty}</p>
            </div>
          ) : (
            <div style={{ padding: 4 }}>
              {waiting.slice(0, 5).map((lead) => (
                <LeadRow key={lead.id} lead={lead} t={t} />
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h3>{t.compareTitle}</h3>
            <span className="hint">{t.marketAverage}</span>
          </div>
          <div className="bar-list">
            <CompareRow
              name={t.compareQuality}
              you={compare.myQuality}
              avg={compare.marketQuality}
              higherIsBetter
            />
            <CompareRow
              name={t.compareLeads}
              you={compare.myLeadsPerListing}
              avg={compare.marketLeadsPerListing}
              decimals={1}
              higherIsBetter
            />
          </div>
          <div className="vfoot">
            <span className="hint">{t.replyTimeNote}</span>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1.15fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <div className="card-head">
            <h3>{t.channelsTitle}</h3>
            <span className="hint">{t.channelsWindow}</span>
          </div>
          {channelTotal === 0 ? (
            <div className="empty">
              <Icon name="ads_click" size={34} />
              <p>{t.channelsEmpty}</p>
            </div>
          ) : (
            <div className="bar-list">
              {channels.map((c) => (
                <div key={c.channel} className="bar-row" style={{ gridTemplateColumns: '120px 1fr 84px' }}>
                  <span className="name">{channelLabel(c.channel, t)}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${Math.max(4, (c.count / channelTotal) * 100).toFixed(0)}%`,
                        background: CHANNEL_COLOR[c.channel] ?? 'var(--d-slot-5)',
                      }}
                    />
                  </div>
                  <span className="count">
                    {c.count}{' '}
                    <span style={{ color: 'var(--d-text-3)', fontWeight: 500 }}>
                      {Math.round((c.count / channelTotal) * 100)}%
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="vfoot">
            <span className="hint">{t.channelsNote}</span>
          </div>
        </div>
        <div />
      </div>

      <div className="card">
        <div className="card-head">
          <h3>{t.attentionTitle}</h3>
          <Link className="link" href="/dashboard/agent/listings">{t.allListings}</Link>
        </div>
        {attention.length === 0 ? (
          <div className="empty">
            <Icon name="task_alt" size={34} />
            <p>{t.attentionEmpty}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t.listing}</th>
                <th>{t.whatsMissing}</th>
                <th>{t.quality}</th>
                <th>{t.status}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {attention.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="cell-primary">
                      <div className="thumb" style={{ background: 'var(--d-paper)', position: 'relative', overflow: 'hidden' }}>
                        {p.image ? (
                          <Image src={p.image} alt="" fill sizes="42px" style={{ objectFit: 'cover' }} />
                        ) : (
                          <Icon name="image" size={18} style={{ color: 'var(--d-text-3)' }} />
                        )}
                      </div>
                      <div>
                        <div className="name-strong">{p.title}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="name-sub">
                      {p.missing.length ? p.missing.join(', ') : t.nothingMissing}
                    </span>
                  </td>
                  <td>
                    <span className={`pill ${p.band}`}>{p.score}</span>
                  </td>
                  <td>
                    <span className={`pill ${p.status === 'PUBLISHED' ? 'good' : p.status === 'REJECTED' ? 'crit' : 'muted'}`}>
                      {p.status === 'PUBLISHED' ? t.statusLive : p.status === 'REJECTED' ? t.statusNeedsFixing : t.statusReview}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/post-property?edit=${p.id}`} className="btn" style={{ textDecoration: 'none' }}>
                      {t.fix}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/** The preview's compact lead card (`leadCard(l, true)`). */
function LeadRow({ lead, t }: { lead: AgentLead; t: AgentCopy }) {
  const band = waitBand(lead.waitedHours);
  return (
    <Link
      href="/dashboard/agent/leads"
      className="doc-row"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="avatar-sm">{initials(lead.name)}</div>
      <div className="body" style={{ flex: 1, minWidth: 0 }}>
        <div className="meta" style={{ marginBottom: 2 }}>
          <span className="tag">{t.sourceForm}</span>
          <span className={`pill ${band}`}>
            {band !== 'good' && <Icon name="error" size={10} />}
            {fill(t.waitingFor, { wait: waitText(lead.waitedHours, t) })}
          </span>
        </div>
        {/* One line: agent listing titles run to 90 characters of shouty caps,
            and letting them wrap makes every row a different height. */}
        <div
          className="name-strong"
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          title={lead.listing ?? undefined}
        >
          {lead.name}
          {lead.listing && (
            <> · <span style={{ fontWeight: 500, color: 'var(--d-text-2)' }}>{lead.listing}</span></>
          )}
        </div>
        <div className="name-sub mono" style={{ fontSize: 12, marginTop: 1 }}>{lead.contact}</div>
      </div>
    </Link>
  );
}

function CompareRow({
  name, you, avg, decimals = 0, higherIsBetter,
}: {
  name: string;
  you: number | null;
  avg: number | null;
  decimals?: number;
  higherIsBetter: boolean;
}) {
  if (you === null || avg === null) {
    return (
      <div className="bar-row" style={{ gridTemplateColumns: '120px 1fr 84px' }}>
        <span className="name">{name}</span>
        <div className="bar-track" />
        <span className="count" style={{ color: 'var(--d-text-3)' }}>—</span>
      </div>
    );
  }

  const better = higherIsBetter ? you > avg : you < avg;
  const pct = Math.max(4, Math.min(100, (you / Math.max(avg, 0.1)) * 50));

  return (
    <div className="bar-row" style={{ gridTemplateColumns: '120px 1fr 84px' }}>
      <span className="name">{name}</span>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{ width: `${pct.toFixed(0)}%`, background: `var(--d-${better ? 'good' : 'warn'})` }}
        />
      </div>
      <span className="count" style={{ color: `var(--d-${better ? 'good' : 'warn'})` }}>
        {you.toFixed(decimals)}{' '}
        <span style={{ color: 'var(--d-text-3)', fontWeight: 500 }}>vs {avg.toFixed(decimals)}</span>
      </span>
    </div>
  );
}
