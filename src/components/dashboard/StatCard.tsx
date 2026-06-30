'use client';

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
  return (
    <div className="bg-white p-5 rounded-xl border border-[#eceef1] hover:border-[#dde0e4] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-[#f5f6f8] flex items-center justify-center text-[#002045]">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[12px] font-semibold ${trend.isUp ? 'text-emerald-600' : 'text-red-500'}`}>
            <span className="material-symbols-outlined text-[14px]">
              {trend.isUp ? 'trending_up' : 'trending_down'}
            </span>
            {trend.value}%
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold text-[#002045] tracking-tight tabular-nums">{value}</p>
      <p className="mt-0.5 text-[13px] font-medium text-[#74777f]">{title}</p>
    </div>
  );
}
