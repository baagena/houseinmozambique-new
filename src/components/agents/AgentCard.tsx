import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import Icon from '@/components/ui/Icon';
import { getAgentProfilePath } from '@/lib/agent-profile-url';

interface AgentCardProps {
  agent: any;
  size?: 'large' | 'small';
  className?: string;
}

/** Compact directory card: portrait, identity, a short introduction and two actions. */
export default function AgentCard({ agent, className = '' }: AgentCardProps) {
  const corporate = Boolean(agent.agencyName);
  const displayName = agent.agencyName || agent.name;
  const profileHref = getAgentProfilePath(agent);
  const contactPhone = agent.agencyPhone || agent.phone;
  const contactHref = contactPhone ? `tel:${contactPhone}` : `${profileHref}#get-in-touch`;
  const introduction = corporate
    ? agent.agencyServices?.slice(0, 3).join(' · ')
    : agent.bio;

  return (
    <article className={`adv ${className} items-center`}>
      <Link href={profileHref} className="adv__logo" style={{ width: 92, height: 112, borderRadius: 12 }} aria-label={`View ${displayName} profile`}>
        {agent.avatar ? <SafeImage src={agent.avatar} alt={agent.name} fill className="object-cover" sizes="92px" /> : <span>{agent.initials}</span>}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={profileHref} className="truncate font-semibold text-[var(--ink)] hover:text-[var(--gold-deep)]">{displayName}</Link>
          {agent.isVerified && <Icon name="verified" size={16} className="vtick" title="Verified" />}
        </div>
        <p className="mt-1 text-sm text-[var(--hm-muted)]">{corporate ? agent.agencyBusinessType || 'Real Estate Agency' : agent.title} · {agent.location}</p>
        {introduction && <p className="mt-1 line-clamp-1 text-sm leading-5 text-[var(--hm-text)]">{introduction}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href={profileHref} className="btn btn--ghost btn--sm">View Profile</Link>
          <a href={contactHref} className="btn btn--gold btn--sm"><Icon name="call" size={16} />Contact Agent</a>
        </div>
      </div>
    </article>
  );
}
