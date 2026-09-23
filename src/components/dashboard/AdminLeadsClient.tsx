'use client';

import { useMemo, useState } from 'react';
import Icon from '@/components/ui/Icon';
import StatTile from '@/components/dashboard/StatTile';

export interface AdminLead {
  id: string;
  name: string;
  contact: string;
  subject: string;
  listing: string | null;
  agent: string | null;
  /** Only FORM is captured today; WhatsApp and CALL need the Phase 2 Lead model. */
  source: 'FORM' | 'WHATSAPP' | 'CALL';
  createdAt: string;
  repliedAt: string | null;
  isRead: boolean;
}

interface Stats {
  last30: number;
  medianMinutes: number | null;
  unansweredPastDay: number;
  contactRate: number | null;
}

const SOURCES = [
  { key: 'ALL', label: 'All sources' },
  { key: 'WHATSAPP', label: 'WhatsApp' },
  { key: 'CALL', label: 'Call reveal' },
  { key: 'FORM', label: 'Enquiry form' },
] as const;

type SourceKey = (typeof SOURCES)[number]['key'];

const SOURCE_LABEL: Record<AdminLead['source'], string> = {
  FORM: 'Form',
  WHATSAPP: 'WhatsApp',
  CALL: 'Call',
};

function ago(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

function duration(mins: number): string {
  if (mins < 60) return `${Math.round(mins)} min`;
  const hours = mins / 60;
  if (hours < 48) return `${hours.toFixed(hours < 10 ? 1 : 0)} h`;
  return `${Math.round(hours / 24)} d`;
}

/**
 * First response is the number that matters most on this page: a buyer who
 * waits over an hour rarely comes back. An unanswered lead is shown as a
 * growing wait, not as a blank.
 */
function responseCell(lead: AdminLead) {
  if (lead.repliedAt) {
    const mins = (new Date(lead.repliedAt).getTime() - new Date(lead.createdAt).getTime()) / 60000;
    const tone = mins <= 60 ? 'good' : mins <= 60 * 24 ? 'warn' : 'crit';
    return <span className={`pill ${tone}`}>{duration(mins)}</span>;
  }
  const waiting = (Date.now() - new Date(lead.createdAt).getTime()) / 60000;
  const tone = waiting <= 60 ? 'warn' : 'crit';
  return (
    <span className={`pill ${tone}`}>
      <Icon name="schedule" size={11} />
      Waiting {duration(waiting)}
    </span>
  );
}

function statusPill(lead: AdminLead) {
  if (lead.repliedAt) {
    return (
      <span className="pill good">
        <Icon name="check_circle" size={11} />
        Answered
      </span>
    );
  }
  if (lead.isRead) {
    return (
      <span className="pill muted">
        <Icon name="visibility" size={11} />
        Seen
      </span>
    );
  }
  return (
    <span className="pill warn">
      <Icon name="error" size={11} />
      New
    </span>
  );
}

export default function AdminLeadsClient({ leads, stats }: { leads: AdminLead[]; stats: Stats }) {
  const [source, setSource] = useState<SourceKey>('ALL');
  const [unansweredOnly, setUnansweredOnly] = useState(false);

  const counts = useMemo(
    () =>
      SOURCES.reduce<Record<string, number>>((acc, s) => {
        acc[s.key] = s.key === 'ALL' ? leads.length : leads.filter((l) => l.source === s.key).length;
        return acc;
      }, {}),
    [leads],
  );

  const visible = useMemo(
    () =>
      leads.filter(
        (l) => (source === 'ALL' || l.source === source) && (!unansweredOnly || !l.repliedAt),
      ),
    [leads, source, unansweredOnly],
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Demand</p>
          <h1>Leads</h1>
          <p>Every enquiry that reached an agent — who it went to, and how fast they answered.</p>
        </div>
      </div>

      <div className="stat-row">
        <StatTile
          label="Leads in the last 30 days"
          value={stats.last30}
          icon="mail"
          hint="From the enquiry form"
        />
        <StatTile
          label="Median first response"
          value={stats.medianMinutes === null ? '—' : duration(stats.medianMinutes)}
          icon="schedule"
          hint={stats.medianMinutes === null ? 'Nothing answered yet' : 'Half are faster than this'}
        />
        <StatTile
          label="Unanswered past 24h"
          value={stats.unansweredPastDay}
          icon="error"
          tone={stats.unansweredPastDay > 0 ? 'crit' : 'default'}
          hint={stats.unansweredPastDay > 0 ? 'Buyers rarely come back' : 'Nothing overdue'}
        />
        <StatTile
          label="View → contact rate"
          value={stats.contactRate === null ? '—' : `${stats.contactRate.toFixed(1)}%`}
          icon="trending_up"
          hint="Contact clicks over listing views"
        />
      </div>

      <div className="card">
        <div className="toolbar">
          {SOURCES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSource(s.key)}
              className={`chip${source === s.key ? ' on' : ''}`}
            >
              {s.label} · {counts[s.key]}
            </button>
          ))}
          <span className="spacer" />
          <button
            type="button"
            onClick={() => setUnansweredOnly((v) => !v)}
            className={`chip${unansweredOnly ? ' on' : ''}`}
          >
            Unanswered only
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Lead</th>
                <th>Listing</th>
                <th>Agent</th>
                <th>Source</th>
                <th>Received</th>
                <th>First response</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div className="name-strong">{lead.name}</div>
                    <div className="name-sub mono">{lead.contact}</div>
                  </td>
                  <td>{lead.listing ?? <span style={{ color: 'var(--d-text-3)' }}>{lead.subject}</span>}</td>
                  <td>{lead.agent ?? <span style={{ color: 'var(--d-text-3)' }}>Unassigned</span>}</td>
                  <td><span className="tag">{SOURCE_LABEL[lead.source]}</span></td>
                  <td style={{ color: 'var(--d-text-2)' }}>{ago(lead.createdAt)}</td>
                  <td>{responseCell(lead)}</td>
                  <td>{statusPill(lead)}</td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <Icon name="mail" size={22} />
                      <p style={{ margin: '8px 0 0', fontWeight: 600, color: 'var(--d-text-1)' }}>
                        {leads.length === 0 ? 'No leads yet' : 'Nothing matches this filter'}
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: 'var(--d-fs-sm)', color: 'var(--d-text-3)' }}>
                        {leads.length === 0
                          ? 'Enquiries from listing and contact forms appear here.'
                          : 'Try another source, or clear "Unanswered only".'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="foot-note" style={{ marginTop: 14 }}>
        <Icon name="info" size={13} />
        WhatsApp clicks and call reveals are not tracked yet — those need the tracked links and the
        Lead model from Phase 2, so their counts read zero rather than estimating.
      </p>
    </div>
  );
}
