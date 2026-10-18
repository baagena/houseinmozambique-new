import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { FOLDERS, uploadImage } from '@/lib/cloudinary';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get('avatar');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Choose a profile photo to upload.' }, { status: 400 });
    }
    if (!IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Use a JPG, PNG, or WebP image.' }, { status: 400 });
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return NextResponse.json({ error: 'Profile photos must be 5 MB or smaller.' }, { status: 413 });
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
    const avatar = await uploadImage(`data:${file.type};base64,${base64}`, FOLDERS.PROFILES);
    await prisma.agent.update({ where: { id: session.id }, data: { avatar } });
    revalidatePath('/dashboard/agent/profile');
    revalidatePath('/agents');
    revalidatePath(`/agents/${session.id}`);
    return NextResponse.json({ avatar });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not upload the profile photo.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
