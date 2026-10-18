export interface AgentProfileIdentity {
  id: string;
  name: string;
  agencyName?: string | null;
}

/** Readable profile URL based on the agent's own name. */
export function getAgentProfileSlug(agent: AgentProfileIdentity) {
  const readableName = agent.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'agent';

  return readableName;
}

export function getAgentProfilePath(agent: AgentProfileIdentity) {
  return `/agents/${getAgentProfileSlug(agent)}`;
}

/** Match canonical slugs plus both legacy id-only and former name-id URLs. */
export function agentMatchesProfileSegment(agent: AgentProfileIdentity, segment: string) {
  const slug = getAgentProfileSlug(agent);
  return agent.id === segment || slug === segment || `${slug}-${agent.id}` === segment;
}

