'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { useChartTheme, type ChartTheme } from '@/components/dashboard/useChartTheme';

/**
 * The admin analytics strip.
 *
 * Three decisions worth keeping:
 *
 *  · BARS, NOT LINES. These are discrete daily counts, mostly 0–3. A line
 *    interpolates between days that have no relationship and turns a handful of
 *    events into a zigzag that reads as volatility. Bars show what happened on
 *    each day and let an empty day be empty.
 *
 *  · NO DUAL AXIS. Revenue (metical) and counts (units) never share a y-scale.
 *    Listings and new agents DO share one — both are small daily counts — so
 *    those two are grouped in a single chart, and revenue and inquiries each
 *    get their own.
 *
 *  · EVERY CARD LEADS WITH ITS TOTAL. With sparse data a plot alone can look
 *    broken; the period total is the number the reader actually wants, and the
 *    plot shows its shape.
 */

interface ChartDataPoint {
  date: string;
  properties: number;
  agents: number;
  inquiries: number;
  revenue: number;
}

interface AnalyticsChartProps {
  data: ChartDataPoint[];
}

/** "2026-08-22" / "Aug 22" → "22 Aug", stable and short. */
function shortDate(raw: string): string {
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  return raw;
}

/** 1_842_500 → "1.8M". The old axis printed raw floats and clipped them. */
function compactMT(value: number): string {
  const n = Math.abs(value);
  if (n >= 1_000_000) return `${(value / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(value / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(Math.round(value));
}

function fullMT(value: number): string {
  return `${Math.round(value).toLocaleString('en-US')} MT`;
}

function ChartTooltip({
  active, payload, label, theme, format,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string | number }>;
  label?: string;
  theme: ChartTheme;
  format?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: 8,
        padding: '9px 11px',
        boxShadow: '0 8px 24px -12px rgba(10,37,64,.35)',
        fontSize: 12.5,
      }}
    >
      <p style={{ margin: 0, fontWeight: 600, color: theme.text1 }}>{shortDate(String(label))}</p>
      {payload.map((entry) => (
        <p
          key={String(entry.dataKey)}
          style={{ margin: '5px 0 0', display: 'flex', alignItems: 'center', gap: 7, color: theme.text2 }}
        >
          <span
            style={{ width: 9, height: 9, borderRadius: 2, background: entry.color, flex: 'none' }}
          />
          <span style={{ flex: 1 }}>{entry.name}</span>
          <span
            style={{
              fontFamily: 'var(--d-font-mono)',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 600,
              color: theme.text1,
              marginLeft: 12,
            }}
          >
            {format ? format(entry.value ?? 0) : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

function CardShell({
  title, sub, total, unit, children, empty,
}: {
  title: string;
  sub: string;
  total: string;
  unit?: string;
  children: React.ReactNode;
  empty: boolean;
}) {
  return (
    <section
      style={{
        background: 'var(--d-card)',
        border: '1px solid var(--d-border)',
        borderRadius: 'var(--d-radius-card)',
        boxShadow: 'var(--d-shadow)',
        padding: '18px 20px 14px',
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 'var(--d-fs-md)', fontWeight: 600, color: 'var(--d-text-1)', margin: 0 }}>
          {title}
        </h3>
        <p style={{ fontSize: 'var(--d-fs-sm)', color: 'var(--d-text-3)', margin: '3px 0 0' }}>{sub}</p>
        <p
          className="tabular"
          style={{
            fontFamily: 'var(--d-font-mono)',
            fontSize: 'var(--d-fs-figure)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: 'var(--d-text-1)',
            margin: '10px 0 0',
          }}
        >
          {total}
          {unit && (
            <span
              style={{
                fontSize: 'var(--d-fs-base)',
                fontWeight: 500,
                color: 'var(--d-text-3)',
                marginLeft: 7,
                letterSpacing: 0,
              }}
            >
              {unit}
            </span>
          )}
        </p>
      </div>

      {empty ? (
        <div
          style={{
            height: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px dashed var(--d-border)',
            borderRadius: 'var(--d-radius-sm)',
            color: 'var(--d-text-3)',
            fontSize: 'var(--d-fs-sm)',
          }}
        >
          Nothing recorded in this period
        </div>
      ) : (
        children
      )}
    </section>
  );
}

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  const theme = useChartTheme();

  const totals = useMemo(
    () =>
      data.reduce(
        (acc, d) => ({
          properties: acc.properties + (d.properties || 0),
          agents: acc.agents + (d.agents || 0),
          inquiries: acc.inquiries + (d.inquiries || 0),
          revenue: acc.revenue + (d.revenue || 0),
        }),
        { properties: 0, agents: 0, inquiries: 0, revenue: 0 },
      ),
    [data],
  );

  // With ~30 points, every label collides. Show roughly six.
  const tickInterval = Math.max(0, Math.floor(data.length / 6) - 1);

  const axisProps = {
    stroke: theme.axis,
    tick: { fill: theme.text3, fontSize: 11.5 },
    tickLine: false,
    axisLine: { stroke: theme.border },
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CardShell
          title="Revenue"
          sub="Settled payments per day"
          total={totals.revenue > 0 ? Math.round(totals.revenue).toLocaleString('en-US') : '0'}
          unit="MT"
          empty={totals.revenue === 0}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid stroke={theme.grid} vertical={false} />
              <XAxis dataKey="date" interval={tickInterval} tickFormatter={shortDate} {...axisProps} />
              <YAxis width={44} tickFormatter={compactMT} {...axisProps} />
              <Tooltip
                cursor={{ fill: theme.grid }}
                content={<ChartTooltip theme={theme} format={fullMT} />}
              />
              <Bar dataKey="revenue" name="Revenue" fill={theme.solo} radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </CardShell>

        <CardShell
          title="Inquiries"
          sub="From listing pages and the contact form"
          total={totals.inquiries.toLocaleString('en-US')}
          empty={totals.inquiries === 0}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid stroke={theme.grid} vertical={false} />
              <XAxis dataKey="date" interval={tickInterval} tickFormatter={shortDate} {...axisProps} />
              <YAxis width={30} allowDecimals={false} {...axisProps} />
              <Tooltip cursor={{ fill: theme.grid }} content={<ChartTooltip theme={theme} />} />
              <Bar dataKey="inquiries" name="Inquiries" radius={[4, 4, 0, 0]} maxBarSize={22}>
                {data.map((d, i) => (
                  <Cell key={i} fill={theme.slots[1]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardShell>
      </div>

      <CardShell
        title="Listings and agents added"
        sub="Both are small daily counts, so they share one scale"
        total={`${totals.properties} / ${totals.agents}`}
        unit="listings / agents"
        empty={totals.properties === 0 && totals.agents === 0}
      >
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 0 }} barGap={2}>
            <CartesianGrid stroke={theme.grid} vertical={false} />
            <XAxis dataKey="date" interval={tickInterval} tickFormatter={shortDate} {...axisProps} />
            <YAxis width={30} allowDecimals={false} {...axisProps} />
            <Tooltip cursor={{ fill: theme.grid }} content={<ChartTooltip theme={theme} />} />
            <Legend
              verticalAlign="bottom"
              height={28}
              iconType="square"
              iconSize={9}
              wrapperStyle={{ fontSize: 12.5, color: theme.text2, paddingTop: 6 }}
            />
            <Bar dataKey="properties" name="Listings" fill={theme.slots[0]} radius={[4, 4, 0, 0]} maxBarSize={16} />
            <Bar dataKey="agents" name="New agents" fill={theme.slots[2]} radius={[4, 4, 0, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </CardShell>
    </div>
  );
}
