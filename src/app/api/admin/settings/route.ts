import { NextResponse } from 'next/server';
import { requireAdminAgent } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';
import {
  getPaymentInstructions,
  savePaymentInstructions,
  type PaymentInstructions,
} from '@/lib/payment-instructions';

const defaults = {
  adminName: 'Dev Admin',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@houseinmozambique.com',
  platformTagline: 'The Modern Estate Curator',
  globalNotifications: true,
  agentApprovalAlerts: true,
  weeklyReport: false,
};

/*
 * The payment destination is read and written here rather than on its own
 * endpoint so the admin saves it with the same button as everything else.
 * It lives in its own module because the billing page and the checkout route
 * read it too, and none of them should know the AppSetting key names.
 */
/**
 * The rent below which a private owner may list for nothing, in MAJOR units
 * for the form. Stored in centavos, like every other figure here.
 */
async function readFreeRentalCeiling(): Promise<string> {
  const row = await prisma.appSetting.findUnique({
    where: { key: 'freeRentalCeilingMinor' },
    select: { value: true },
  });
  const minor = Number.parseInt(row?.value ?? '0', 10);
  return Number.isFinite(minor) && minor > 0 ? String(Math.round(minor / 100)) : '';
}

async function readSettings() {
  const rows = await prisma.appSetting.findMany({ where: { key: { in: Object.keys(defaults) } } });
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    adminName: values.adminName || defaults.adminName,
    adminEmail: values.adminEmail || defaults.adminEmail,
    platformTagline: values.platformTagline || defaults.platformTagline,
    globalNotifications: values.globalNotifications === undefined ? defaults.globalNotifications : values.globalNotifications === 'true',
    agentApprovalAlerts: values.agentApprovalAlerts === undefined ? defaults.agentApprovalAlerts : values.agentApprovalAlerts === 'true',
    weeklyReport: values.weeklyReport === undefined ? defaults.weeklyReport : values.weeklyReport === 'true',
  };
}

export async function GET() {
  try {
    if (!(await requireAdminAgent())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const [settings, paymentInstructions, freeRentalCeiling] = await Promise.all([
      readSettings(),
      getPaymentInstructions(),
      readFreeRentalCeiling(),
    ]);
    return NextResponse.json({ settings, paymentInstructions, freeRentalCeiling });
  } catch (error) {
    console.error('Admin settings load error:', error);
    return NextResponse.json({ error: 'Could not load admin settings.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await requireAdminAgent())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const adminEmail = String(body.adminEmail || '').trim().toLowerCase();
    if (!adminEmail || !adminEmail.includes('@')) {
      return NextResponse.json({ error: 'A valid notification email is required.' }, { status: 400 });
    }

    const settings = {
      adminName: String(body.adminName || defaults.adminName).trim(),
      adminEmail,
      platformTagline: String(body.platformTagline || defaults.platformTagline).trim(),
      globalNotifications: Boolean(body.globalNotifications),
      agentApprovalAlerts: Boolean(body.agentApprovalAlerts),
      weeklyReport: Boolean(body.weeklyReport),
    };

    await prisma.$transaction(
      Object.entries(settings).map(([key, value]) =>
        prisma.appSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        }),
      ),
    );

    /*
     * Saved only when the key is present in the body.
     *
     * An older client that does not know about these fields must not be able
     * to blank the M-Pesa number by omitting it — agents would be shown a
     * reference with nowhere to send it.
     */
    if (body.paymentInstructions && typeof body.paymentInstructions === 'object') {
      await savePaymentInstructions(body.paymentInstructions as Partial<PaymentInstructions>);
    }

    /*
     * Only written when the key is present, so an older client cannot switch
     * the exemption off by omitting it. An empty string is a deliberate
     * "switch it off"; undefined is "I have nothing to say about this".
     */
    if (body.freeRentalCeiling !== undefined) {
      const major = Number(String(body.freeRentalCeiling).replace(/[^\d.]/g, ''));
      const minor = Number.isFinite(major) && major > 0 ? Math.round(major * 100) : 0;
      await prisma.appSetting.upsert({
        where: { key: 'freeRentalCeilingMinor' },
        update: { value: String(minor) },
        create: { key: 'freeRentalCeilingMinor', value: String(minor) },
      });
    }

    // Read back rather than echo, so the client shows what was actually stored
    // (trimmed) instead of what it sent.
    return NextResponse.json({
      settings,
      paymentInstructions: await getPaymentInstructions(),
      freeRentalCeiling: await readFreeRentalCeiling(),
    });
  } catch (error) {
    console.error('Admin settings save error:', error);
    const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    const message = errorCode === 'P1001'
      ? 'The database is currently unreachable. Check the Neon database status and try again.'
      : 'Could not save admin settings.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}