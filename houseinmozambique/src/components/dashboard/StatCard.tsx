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
    <div className="bg-white p-6 rounded-3xl border border-[#f2f4f6] shadow-[0_8px_24px_rgba(0,32,69,0.04)] hover:shadow-[0_12px_32px_rgba(0,32,69,0.08)] transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-2xl bg-[#f7f9fb] flex items-center justify-center text-[#002045] group-hover:bg-[#002045] group-hover:text-white transition-all duration-300">
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${trend.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            <span className="material-symbols-outlined text-[10px]">
              {trend.isUp ? 'trending_up' : 'trending_down'}
            </span>
            {trend.value}%
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-[#74777f] uppercase tracking-[0.2em] mb-1">{title}</p>
        <p className="text-3xl font-black text-[#002045] tracking-tighter" style={{ fontFamily: 'var(--font-headline)' }}>{value}</p>
      </div>
    </div>
  );
}
