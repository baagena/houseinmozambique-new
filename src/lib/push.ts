import { after } from 'next/server';
import type { Messaging } from 'firebase-admin/messaging';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * Push notifications to the mobile app, through Firebase Cloud Messaging.
 *
 * Off until the server has FIREBASE_SERVICE_ACCOUNT — the service-account JSON
 * from the Firebase console (Project settings → Service accounts → Generate new
 * private key), pasted raw or base64-encoded. Without it every call here is a
 * no-op, so nothing that triggers a push can fail because of it.
 *
 * Sends never block or break the action that triggered them: they run in
 * `after()`, once the response has gone, and every error is logged and
 * swallowed. Devices register themselves via /api/mobile/v1/devices.
 */

type Text = { title: string; body: string };

export interface PushMessage {
  en: Text;
  pt: Text;
  /** App route opened when the notification is tapped, e.g. "/my-leads". */
  route: string;
  /**
   * Never sent to iPhones. Apple does not allow the iOS app to show anything
   * about payments made outside in-app purchase, so payment news goes to
   * Android (and email) only — see mobile/lib/core/utils/store_policy.dart.
   */
  androidOnly?: boolean;
}

let messagingPromise: Promise<Messaging | null> | null = null;

function readServiceAccount(): Record<string, string> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) return null;
  try {
    const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (error) {
    console.error('push: FIREBASE_SERVICE_ACCOUNT is not valid JSON (raw or base64)', error);
    return null;
  }
}

async function messaging(): Promise<Messaging | null> {
  if (!messagingPromise) {
    messagingPromise = (async () => {
      const account = readServiceAccount();
      if (!account) return null;
      // Imported lazily: firebase-admin is large, and most requests never push.
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');
      const { getMessaging } = await import('firebase-admin/messaging');
      const app = getApps().find((a) => a.name === 'him-push')
        ?? initializeApp({ credential: cert(account as Parameters<typeof cert>[0]) }, 'him-push');
      return getMessaging(app);
    })().catch((error) => {
      console.error('push: Firebase could not be initialised', error);
      return null;
    });
  }
  return messagingPromise;
}

/** Tokens Firebase says will never work again; their rows are deleted. */
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

async function deliver(where: Prisma.PushDeviceWhereInput, msg: PushMessage): Promise<void> {
  const fcm = await messaging();
  if (!fcm) return;

  const devices = await prisma.pushDevice.findMany({
    where: msg.androidOnly ? { AND: [where, { platform: { not: 'ios' } }] } : where,
    select: { token: true, lang: true },
  });
  if (devices.length === 0) return;

  const dead: string[] = [];
  for (const lang of ['en', 'pt'] as const) {
    const tokens = devices.filter((d) => (d.lang === 'en' ? 'en' : 'pt') === lang).map((d) => d.token);
    const text = msg[lang];
    // FCM takes at most 500 tokens per multicast.
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);
      const res = await fcm.sendEachForMulticast({
        tokens: batch,
        notification: { title: text.title.slice(0, 120), body: text.body.slice(0, 240) },
        data: { route: msg.route },
        android: { priority: 'high', notification: { sound: 'default', icon: 'ic_notification', color: '#002045' } },
        apns: { payload: { aps: { sound: 'default' } } },
      });
      res.responses.forEach((r, idx) => {
        if (!r.success && r.error && DEAD_TOKEN_CODES.has(r.error.code)) dead.push(batch[idx]);
      });
    }
  }
  if (dead.length) await prisma.pushDevice.deleteMany({ where: { token: { in: dead } } });
}

function schedule(task: () => Promise<void>) {
  const run = () => task().catch((error) => console.error('push: send failed', error));
  try {
    after(run);
  } catch {
    // Outside a request (a script, a test): just send now.
    void run();
  }
}

/** Notify specific agents (their own listings, leads, payments). */
export function pushToAgents(agentIds: (string | null | undefined)[], msg: PushMessage) {
  const ids = [...new Set(agentIds.filter((x): x is string => Boolean(x)))];
  if (ids.length === 0) return;
  schedule(() => deliver({ agentId: { in: ids } }, msg));
}

/** Tell the owner when moderation approves or rejects their listing. */
export function pushListingDecision(hostId: string, title: string, from: string, to: string) {
  if (from === to) return;
  if (to === 'PUBLISHED') pushToAgents([hostId], pushes.listingApproved(title));
  else if (to === 'REJECTED') pushToAgents([hostId], pushes.listingRejected(title));
}

/** Notify every admin (work waiting in the console). */
export function pushToAdmins(msg: PushMessage) {
  schedule(() => deliver({ agent: { role: 'ADMIN' } }, msg));
}

// ── The notifications, in both languages ────────────────────────────────────

const clip = (s: string | null | undefined, n = 80) => {
  const v = (s ?? '').trim();
  return v.length > n ? `${v.slice(0, n - 1)}…` : v;
};

export const pushes = {
  // Agent
  newLead: (name: string, subject: string): PushMessage => ({
    en: { title: `New lead from ${clip(name, 40)}`, body: clip(subject) },
    pt: { title: `Novo contacto de ${clip(name, 40)}`, body: clip(subject) },
    route: '/my-leads',
  }),
  listingApproved: (title: string): PushMessage => ({
    en: { title: 'Your listing is live', body: clip(title) },
    pt: { title: 'O seu anúncio foi publicado', body: clip(title) },
    route: '/my-listings',
  }),
  listingRejected: (title: string): PushMessage => ({
    en: { title: 'Your listing needs changes', body: clip(title) },
    pt: { title: 'O seu anúncio precisa de alterações', body: clip(title) },
    route: '/my-listings',
  }),
  paymentApproved: (orderRef: string): PushMessage => ({
    en: { title: 'Payment confirmed', body: `Reference ${orderRef}` },
    pt: { title: 'Pagamento confirmado', body: `Referência ${orderRef}` },
    route: '/dashboard/billing',
    androidOnly: true,
  }),
  paymentRejected: (orderRef: string): PushMessage => ({
    en: { title: 'Payment could not be confirmed', body: `Reference ${orderRef} — open to see why` },
    pt: { title: 'Pagamento não confirmado', body: `Referência ${orderRef} — abra para ver o motivo` },
    route: '/dashboard/billing',
    androidOnly: true,
  }),
  buyerRequest: (city: string, intent: string): PushMessage => ({
    en: { title: `A buyer is looking in ${clip(city, 40)}`, body: `${clip(intent, 20)} — respond before other agents` },
    pt: { title: `Um comprador procura em ${clip(city, 40)}`, body: `${clip(intent, 20)} — responda antes de outros agentes` },
    route: '/dashboard/requests',
  }),

  // Admin
  listingToReview: (title: string, by?: string | null): PushMessage => {
    const body = by ? `${clip(title, 60)} · ${clip(by, 30)}` : clip(title);
    return {
      en: { title: 'New listing to review', body },
      pt: { title: 'Novo anúncio para aprovar', body },
      route: '/admin/approvals',
    };
  },
  proofSubmitted: (orderRef: string, name: string): PushMessage => ({
    en: { title: 'Payment proof to verify', body: `${clip(name, 40)} · ${orderRef}` },
    pt: { title: 'Comprovativo para verificar', body: `${clip(name, 40)} · ${orderRef}` },
    route: '/admin/payments/verify',
    androidOnly: true,
  }),
  contactMessage: (name: string, subject: string): PushMessage => ({
    en: { title: `New message from ${clip(name, 40)}`, body: clip(subject) },
    pt: { title: `Nova mensagem de ${clip(name, 40)}`, body: clip(subject) },
    route: '/admin/leads',
  }),
  propertyRequest: (city: string, intent: string): PushMessage => ({
    en: { title: 'New buyer request to release', body: `${clip(intent, 20)} · ${clip(city, 40)}` },
    pt: { title: 'Novo pedido de comprador', body: `${clip(intent, 20)} · ${clip(city, 40)}` },
    route: '/admin/requests',
  }),
  newAccount: (name: string, role: string): PushMessage => ({
    en: {
      title: role === 'CUSTOMER' ? 'New customer account' : role === 'CORPORATE' ? 'New agency to review' : role === 'OWNER' ? 'New property owner signed up' : 'New agent signed up',
      body: clip(name),
    },
    pt: {
      title: role === 'CUSTOMER' ? 'Nova conta de cliente' : role === 'CORPORATE' ? 'Nova agência para aprovar' : role === 'OWNER' ? 'Novo proprietário registado' : 'Novo agente registado',
      body: clip(name),
    },
    route: '/admin/agents',
  }),
};
