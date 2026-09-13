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
  const shareAgent = async () => {
    const url = `${window.location.origin}/agents#${agent.id}`;
    if (navigator.share) {
      await navigator.share({ title: agent.name, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <article className={`adv ${className}`} id={agent.id}>
      <span className="adv__logo">
        {agent.avatar ? (
          <a href={`/api/agent/avatar-download?url=${encodeURIComponent(agent.avatar)}&name=${encodeURIComponent(`${agent.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-profile.jpg`)}`} target="_blank" rel="noreferrer" title="Download agent photo">
            <SafeImage src={agent.avatar} alt={agent.name} fill className="object-cover" sizes="62px" />
          </a>
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
        <button type="button" onClick={shareAgent} className="meta mt-3 hover:text-(--gold-deep)" title="Share agent profile">
          <span className="material-symbols-outlined text-[0.95rem]">share</span>
          <span>Share profile</span>
        </button>
      </div>
    </article>
  );
}
