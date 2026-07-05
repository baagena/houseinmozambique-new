import { NextResponse } from 'next/server';
import { requireBearerAgent } from '@/lib/mobile-auth';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { base64, folder } = await request.json();

    if (!base64 || !base64.startsWith('data:')) {
      return NextResponse.json({ error: 'Invalid image format. Expected base64 data string.' }, { status: 400 });
    }

    const url = await uploadImage(base64, folder || 'houseinmozambique/houses');
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Mobile image upload failed:', error);
    return NextResponse.json({ error: error.message || 'Image upload failed.' }, { status: 500 });
  }
}
