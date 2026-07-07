import jwt from 'jsonwebtoken';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET as string;
const TOKEN_EXPIRY = '30d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export interface AgentTokenPayload {
  agentId: string;
  role: string;
}

export function signAgentToken(agentId: string, role: string): string {
  return jwt.sign({ agentId, role } as AgentTokenPayload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

export function verifyAgentToken(token: string): AgentTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AgentTokenPayload;
  } catch {
    return null;
  }
}

function getBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

/**
 * Resolves the authenticated agent from an Authorization: Bearer <jwt> header.
 * Mirrors the cookie-based requireAgent() in src/actions/properties.ts, for mobile API routes.
 */
export async function requireBearerAgent(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return { error: 'Not authenticated.', status: 401 as const };
  }

  const payload = verifyAgentToken(token);
  if (!payload) {
    return { error: 'Invalid or expired token.', status: 401 as const };
  }

  const agent = await prisma.agent.findUnique({ where: { id: payload.agentId } });
  if (!agent) {
    return { error: 'Agent not found.', status: 401 as const };
  }

  if (agent.role === 'REVOKED') {
    return { error: 'Agent access has been revoked.', status: 403 as const };
  }

  return { agent };
}

/**
 * Resolves the authenticated agent from an Authorization: Bearer <jwt> header
 * and requires that agent to have the ADMIN role. Mirrors the cookie-based
 * requireAdmin() helpers in src/app/api/admin/*, for mobile API routes.
 */
export async function requireBearerAdmin(request: Request) {
  const result = await requireBearerAgent(request);
  if ('error' in result) return result;

  if (result.agent.role !== 'ADMIN') {
    return { error: 'Forbidden - admins only', status: 403 as const };
  }

  return { agent: result.agent };
}

export const AGENT_PUBLIC_SELECT = {
  id: true,
  name: true,
  initials: true,
  title: true,
  location: true,
  phone: true,
  rating: true,
  reviewCount: true,
  isFeatured: true,
  isVerified: true,
  avatar: true,
  bio: true,
  yearsExperience: true,
  specializations: true,
  createdAt: true,
} as const;

export const AGENT_SELF_SELECT = {
  ...AGENT_PUBLIC_SELECT,
  email: true,
  role: true,
} as const;
