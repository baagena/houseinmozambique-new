import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const imageUrl = requestUrl.searchParams.get('url');
  const requestedName = requestUrl.searchParams.get('name') || 'agent-profile.jpg';

  if (!imageUrl) return NextResponse.json({ error: 'Image URL is required.' }, { status: 400 });

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid image URL.' }, { status: 400 });
  }

  if (parsedUrl.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only secure image URLs are supported.' }, { status: 400 });
  }

  try {
    const response = await fetch(parsedUrl, { cache: 'no-store' });
    if (!response.ok || !response.body) {
      return NextResponse.json({ error: 'The image could not be downloaded.' }, { status: 502 });
    }

    const safeName = requestedName.replace(/[^a-z0-9._-]/gi, '-').replace(/-+/g, '-');
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Agent avatar download failed:', error);
    return NextResponse.json({ error: 'The image could not be downloaded.' }, { status: 502 });
  }
}
