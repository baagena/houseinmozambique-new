'use client';

import StatTile from '@/components/dashboard/StatTile';

/**
 * Kept as a thin wrapper over StatTile so the eight existing call sites across
 * the admin and agent dashboards pick up the design-token styling without
 * needing to change. Prefer StatTile directly in new code — it also supports
 * `hint` and `tone`.
 */

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isUp: boolean;
  };
  icon: string;
}

export default function StatCard({ title, value, trend, icon }: StatCardProps) {
  return <StatTile label={title} value={value} icon={icon} trend={trend} />;
}
