import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { sendPropertyApprovedEmail, sendPropertyRejectedEmail } from '@/lib/email';

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden - admins only' }, { status: 403 });

    const body = await request.json();
    const { status } = body;
    if (!status) return NextResponse.json({ error: 'Missing status' }, { status: 400 });

    const existing = await prisma.property.findUnique({ where: { id }, include: { host: true } });
    if (!existing) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

    const property = await prisma.property.update({
      where: { id },
      data: { status, ...(status === 'PUBLISHED' && { approvedAt: new Date() }) },
    });

    if (existing.status !== status && (status === 'PUBLISHED' || status === 'REJECTED')) {
      try {
        const notify = status === 'PUBLISHED' ? sendPropertyApprovedEmail : sendPropertyRejectedEmail;
        await notify(property, { name: existing.host.name, email: existing.host.email });
      } catch (error) {
        console.error('Property status notification email failed:', error);
      }
    }

    return NextResponse.json({ success: true, property });
  } catch (err: any) {
    console.error('API admin/property status error', err);
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden - admins only' }, { status: 403 });

    const { id } = await params;
    const { status } = await request.json();

    if (!['PUBLISHED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const existing = await prisma.property.findUnique({ where: { id }, include: { host: true } });
    if (!existing) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

    const updated = await prisma.property.update({
      where: { id },
      data: { status, ...(status === 'PUBLISHED' && { approvedAt: new Date() }) },
    });

    if (existing.status !== status && (status === 'PUBLISHED' || status === 'REJECTED')) {
      try {
        const notify = status === 'PUBLISHED' ? sendPropertyApprovedEmail : sendPropertyRejectedEmail;
        await notify(updated, { name: existing.host.name, email: existing.host.email });
      } catch (error) {
        console.error('Property status notification email failed:', error);
      }
    }

    revalidatePath('/dashboard/agent/listings');
    revalidatePath('/dashboard/admin/approvals');
    revalidatePath('/dashboard/admin/properties');
    revalidatePath('/properties');
    revalidatePath('/');

    return NextResponse.json({ property: updated, message: `Property status updated to ${status}` });
  } catch (error) {
    console.error('Property status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
