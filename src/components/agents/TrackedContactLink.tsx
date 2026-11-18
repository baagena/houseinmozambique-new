'use client';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import type { ContactChannelKey } from '@/lib/agent-contact-links';

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  agentId: string;
  channel: ContactChannelKey;
  children: ReactNode;
}

/**
 * A contact link on an agent's profile that also records the press, so the
 * agent and the team can see how people reached them. The beacon survives the
 * page being left for WhatsApp or the dialler, and never delays the link.
 */
export default function TrackedContactLink({ agentId, channel, onClick, children, ...rest }: Props) {
  return (
    <a
      {...rest}
      onClick={(event) => {
        try {
          const body = new Blob([JSON.stringify({ channel })], { type: 'application/json' });
          const url = `/api/agents/${encodeURIComponent(agentId)}/contact`;
          if (!navigator.sendBeacon?.(url, body)) {
            void fetch(url, { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } });
          }
        } catch {
          // Recording is best effort; the contact itself always goes through.
        }
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
