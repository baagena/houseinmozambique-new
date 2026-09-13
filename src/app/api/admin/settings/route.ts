import { NextResponse } from 'next/server';
import { requireAdminAgent } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';

const defaults = {
  adminName: 'Dev Admin',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@houseinmozambique.com',
  platformTagline: 'The Modern Estate Curator',
  globalNotifications: true,
  agentApprovalAlerts: true,
  weeklyReport: false,
};

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
    return NextResponse.json({ settings: await readSettings() });
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

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Admin settings save error:', error);
    const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    const message = errorCode === 'P1001'
      ? 'The database is currently unreachable. Check the Neon database status and try again.'
      : 'Could not save admin settings.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}