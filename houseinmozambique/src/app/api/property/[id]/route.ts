import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.info('/api/property/[id] GET invoked', { params: resolvedParams, url: String(request.url) });
    const isDev = process.env.NODE_ENV !== 'production';
    const cookieStore = await cookies();
    const cookieNames = cookieStore.getAll().map(c => c.name);
    console.info('/api/property/[id] cookies available', { cookieNames });
    // Ensure we have an id: Next should pass it via params, but in some dev
    // server situations `params` may be empty. Fall back to parsing the URL.
    let id = resolvedParams?.id;
    if (!id) {
      console.warn('/api/property/[id] GET — params.id missing, attempting fallback from URL', { url: String(request.url), params: resolvedParams });
      try {
        const u = new URL(request.url);
        const parts = u.pathname.split('/').filter(Boolean);
        // Expecting [..., 'api', 'property', '<id']
        const apiIndex = parts.indexOf('api');
        if (apiIndex >= 0 && parts[apiIndex + 1] === 'property') {
          id = parts[apiIndex + 2];
        }
      } catch (e) {
        console.warn('/api/property/[id] GET — fallback URL parse failed', e);
      }
    }

    if (!id) {
      console.warn('/api/property/[id] GET — missing route param id after fallback', { params: resolvedParams, url: String(request.url) });
      return NextResponse.json({ error: 'Missing property id in route', debug: isDev ? { params: resolvedParams, url: String(request.url) } : undefined }, { status: 400 });
    }

    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      console.info('/api/property/[id] GET — missing cookie userId', { paramsId: resolvedParams.id });
      return NextResponse.json(
        { error: 'Not authenticated', debug: isDev ? { userId: userId ?? null } : undefined },
        { status: 401 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id },
      include: { host: true },
    });

    if (!property) {
      console.info('/api/property/[id] GET — property not found', { paramsId: resolvedParams.id, userId });
      return NextResponse.json(
        { error: 'Property not found', debug: isDev ? { paramsId: resolvedParams.id } : undefined },
        { status: 404 }
      );
    }

    if (property.hostId !== userId) {
      console.info('/api/property/[id] GET — forbidden: host mismatch', { paramsId: resolvedParams.id, userId, hostId: property.hostId });
      return NextResponse.json(
        { error: 'Forbidden', debug: isDev ? { userId, hostId: property.hostId } : undefined },
        { status: 403 }
      );
    }

    return NextResponse.json({ property });
  } catch (error: any) {
    console.error('/api/property/[id] GET error:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
      { error: 'Internal server error', debug: isDev ? { message: error?.message, stack: error?.stack } : undefined },
      { status: 500 }
    );
  }
}
