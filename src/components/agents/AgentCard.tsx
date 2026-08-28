import SafeImage from '@/components/ui/SafeImage';

interface AgentCardProps {
  agent: any;
  size?: 'large' | 'small';
  className?: string;
}

/**
 * Directory card — logo, name + verified tick, role, phone, location and
 * listing count. Deliberately compact; the detail lives on the profile.
 */
export default function AgentCard({ agent, className = '' }: AgentCardProps) {
  const listings = agent._count?.properties ?? agent.listingCount;

  return (
    <article className={`adv ${className}`} id={agent.id}>
      <span className="adv__logo">
        {agent.avatar ? (
          <SafeImage src={agent.avatar} alt="" fill className="object-cover" sizes="62px" />
        ) : (
          agent.initials
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="name">
          <span className="truncate">{agent.name}</span>
          {agent.isVerified && (
            <span className="material-symbols-outlined vtick text-[1rem]" title="Verified">
              verified
            </span>
          )}
        </div>
        <div className="role">{agent.title}</div>

        {agent.phone && (
          <a href={`tel:${agent.phone}`} className="meta hover:text-[var(--gold-deep)]">
            <span className="material-symbols-outlined text-[0.95rem]">call</span>
            <span className="truncate">{agent.phone}</span>
          </a>
        )}
        <div className="meta">
          <span className="material-symbols-outlined text-[0.95rem]">location_on</span>
          <span className="truncate">{agent.location}</span>
        </div>
        {typeof listings === 'number' && (
          <div className="meta">
            <span className="material-symbols-outlined text-[0.95rem]">apartment</span>
            <span className="mono">{listings} listings</span>
          </div>
        )}

        {agent.bio && <p className="muted mt-3 line-clamp-2 text-[0.84rem]">{agent.bio}</p>}
      </div>
    </article>
  );
}
