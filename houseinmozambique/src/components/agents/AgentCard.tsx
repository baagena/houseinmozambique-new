import Image from 'next/image';

interface AgentCardProps {
  agent: any;
  size?: 'large' | 'small';
  className?: string;
}

export default function AgentCard({ agent, size = 'large', className = '' }: AgentCardProps) {
  const isLarge = size === 'large';
  
  return (
    <div className={`bg-white rounded-[2.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_60px_rgb(0,0,0,0.06)] transition-all duration-500 group flex flex-col sm:flex-row items-center sm:items-stretch gap-6 border border-[#c4c6cf]/10 hover:border-[#845326]/20 ${className}`}>
      
      {/* ── Left: Avatar Section ── */}
      <div className="relative flex-shrink-0">
        <div className={`relative ${isLarge ? 'w-32 h-32 md:w-40 md:h-40' : 'w-24 h-24 md:w-28 md:h-28'} overflow-hidden rounded-[2rem] shadow-2xl shadow-black/5`}>
          {agent.avatar ? (
            <Image
              src={agent.avatar}
              alt={agent.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-[#f2f4f6] flex items-center justify-center text-[#002045] font-bold text-3xl">
              {agent.initials}
            </div>
          )}
        </div>
        
        {agent.isVerified && (
          <div className="absolute -bottom-2 -right-2 bg-[#845326] text-white rounded-xl p-2 border-4 border-white shadow-xl z-10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
        )}
      </div>

      {/* ── Center: Info Section ── */}
      <div className="flex-grow flex flex-col justify-between py-1 text-center sm:text-left space-y-4 sm:space-y-0">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
            <h3 className={`font-black text-[#002045] ${isLarge ? 'text-2xl' : 'text-xl'} tracking-tight`} style={{ fontFamily: 'var(--font-headline)' }}>
              {agent.name}
            </h3>
            {agent.yearsExperience && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#845326]/5 text-[#845326] w-fit mx-auto sm:mx-0">
                {agent.yearsExperience} Years Exp.
              </span>
            )}
          </div>
          <p className="text-[#845326] font-black uppercase tracking-[0.2em] text-[11px] mb-3">
            {agent.title}
          </p>
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[#43474e]/60 font-medium text-xs">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              {agent.location}
            </div>
            <div className="flex items-center gap-1.5 bg-[#febc85]/10 px-2 py-0.5 rounded-lg">
              <span className="material-symbols-outlined text-[14px] text-[#845326]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-bold text-[#845326]">{agent.rating}</span>
              <span className="text-[#845326]/40 text-[10px]">({agent.reviewCount || 0})</span>
            </div>
          </div>
        </div>

        {/* Bio Snippet (Visible on Desktop Horizontal Cards) */}
        {agent.bio && (
          <p className="hidden md:line-clamp-2 text-[#43474e] text-xs leading-relaxed opacity-60">
            {agent.bio}
          </p>
        )}

        {/* Actions Section */}
        <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
          {[
            { icon: 'call', label: 'Call', color: 'hover:bg-[#002045]' },
            { icon: 'chat', label: 'Message', color: 'hover:bg-[#25D366]' },
            { icon: 'alternate_email', label: 'Email', color: 'hover:bg-[#EA4335]' }
          ].map((btn) => (
            <button
              key={btn.icon}
              aria-label={btn.label}
              className={`w-10 h-10 flex items-center justify-center bg-[#f2f4f6] ${btn.color} text-[#002045] hover:text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5`}
            >
              <span className="material-symbols-outlined text-lg">{btn.icon}</span>
            </button>
          ))}
          <button className="ml-auto hidden lg:flex items-center gap-2 px-4 py-2 bg-[#002045]/5 hover:bg-[#002045] text-[#002045] hover:text-white rounded-xl font-black text-[10px] tracking-widest uppercase transition-all duration-300">
            View Profile
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
