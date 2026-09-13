import JSZip from 'jszip';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface Params {
  params: Promise<{ id: string }>;
}

function safeName(value: string) {
  return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'property';
}

function extensionFrom(contentType: string | null, source: string) {
  const type = contentType?.split(';')[0].toLowerCase();
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  if (type === 'image/gif') return 'gif';
  if (type === 'image/avif') return 'avif';
  if (type === 'image/jpeg') return 'jpg';
  const extension = source.match(/\.(jpg|jpeg|png|webp|gif|avif)(?:\?|$)/i)?.[1];
  return extension?.toLowerCase().replace('jpeg', 'jpg') || 'jpg';
}

export async function GET(request: Request, { params }: Params) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const admin = await prisma.agent.findUnique({ where: { id: userId }, select: { role: true } });
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden - admins only' }, { status: 403 });

  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    select: { title: true, images: true, host: { select: { name: true } } },
  });
  if (!property) return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
  if (!property.images.length) return NextResponse.json({ error: 'This property has no images.' }, { status: 404 });

  const folderName = safeName(property.host.name);
  const propertyName = safeName(property.title);
  const zip = new JSZip();
  let downloaded = 0;

  for (const [index, source] of property.images.entries()) {
    try {
      const response = await fetch(source, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) continue;
      const bytes = await response.arrayBuffer();
      const extension = extensionFrom(response.headers.get('content-type'), source);
      zip.file(`${folderName}/${propertyName}-${String(index + 1).padStart(2, '0')}.${extension}`, bytes);
      downloaded += 1;
    } catch {
      // Skip an unavailable image and keep the remaining archive usable.
    }
  }

  if (!downloaded) return NextResponse.json({ error: 'None of the property images could be downloaded.' }, { status: 502 });

  const archive = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return new NextResponse(archive, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${propertyName}-images.zip"`,
      'Cache-Control': 'no-store',
    },
  });
}
