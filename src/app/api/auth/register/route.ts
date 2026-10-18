import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { sendAgentVerificationEmail, sendNewAgentNotificationEmail } from '@/lib/email';
import { randomBytes } from 'node:crypto';
import { FOLDERS, uploadImage } from '@/lib/cloudinary';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, name, title, location, yearsExperience, bio, specializations } = body;
    const email = String(body.email || '').trim().toLowerCase();
    // Two self-service partitions share this endpoint: professional agents and
    // private owners listing their own property. Both manage only their own listings.
    const isCorporate = body.accountType === 'CORPORATE';
    const role = body.accountType === "OWNER" || body.role === "OWNER" ? "OWNER" : "AGENT";
    const agencyName = String(body.agencyName || '').trim();
    const agencyPhone = String(body.agencyPhone || '').trim();
    const agencyBusinessType = String(body.agencyBusinessType || '').trim();
    const agencyAbout = String(body.agencyAbout || '').trim();
    const agencyServices = Array.isArray(body.agencyServices)
      ? body.agencyServices.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 20)
      : [];
    const agencyAreasServed = String(body.agencyAreasServed || '').split(',').map((area: string) => area.trim()).filter(Boolean).slice(0, 30);
    const agencyWebsite = String(body.agencyWebsite || '').trim();
    const agencyEmail = String(body.agencyEmail || '').trim().toLowerCase();
    const phone = (isCorporate ? agencyPhone : String(body.phone || '')).trim();
    const officeAddress = String(body.officeAddress || '').trim();
    const avatarDataUrl = String(body.avatarDataUrl || '');
    const agentLocation = String(location || '').trim();
    const agentTitle = String(title || '').trim();
    const agentBio = String(bio || '').trim();
    const experience = Number(yearsExperience);
    const agentSpecializations = Array.isArray(specializations)
      ? specializations.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 20)
      : [];
    const phoneDigits = phone.replace(/\D/g, '');
    if (isCorporate && (!agencyName || !agencyPhone || !agencyBusinessType || agencyAbout.length < 30 || agencyAbout.length > 2000 || !agencyServices.length || !agencyAreasServed.length)) {
      return NextResponse.json({ error: 'Complete the agency name, contact phone, business type, agency description, services, and service areas.' }, { status: 400 });
    }
    if (agencyWebsite && (!/^https:\/\//i.test(agencyWebsite) || agencyWebsite.length > 300)) {
      return NextResponse.json({ error: 'Enter a full website address starting with https://.' }, { status: 400 });
    }
    if (agencyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agencyEmail)) {
      return NextResponse.json({ error: 'Enter a valid public agency email address.' }, { status: 400 });
    }
    if (role === 'AGENT' && (phoneDigits.length < 7 || phoneDigits.length > 15 || agentLocation.length < 2 || officeAddress.length < 8 || officeAddress.length > 400 || !agentTitle || agentBio.length < 20 || agentBio.length > 2000 || !agentSpecializations.length || !Number.isInteger(experience) || experience < 0 || experience > 80)) {
      return NextResponse.json({ error: 'Complete your phone, service area, exact office address, professional title, biography, and at least one specialization.' }, { status: 400 });
    }
    let avatarUrl: string | null = null;
    if (role === 'AGENT') {
      const match = avatarDataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
      if (!match || !IMAGE_TYPES.has(match[1])) {
        return NextResponse.json({ error: 'Upload a JPG, PNG, or WebP profile photo to continue.' }, { status: 400 });
      }
      const imageBytes = Buffer.from(match[2], 'base64');
      if (imageBytes.length > MAX_AVATAR_BYTES) {
        return NextResponse.json({ error: 'Profile photos must be 5 MB or smaller.' }, { status: 413 });
      }
      try {
        avatarUrl = await uploadImage(avatarDataUrl, FOLDERS.PROFILES);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not upload the profile photo.';
        return NextResponse.json({ error: message }, { status: 503 });
      }
    }

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingAgent = await prisma.agent.findUnique({
      where: { email },
    });

    if (existingAgent) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new Agent
    const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    
    const newAgent = await prisma.agent.create({
      data: {
        email,
        password: hashedPassword,
        name,
        initials,
        title: role === "OWNER" ? (title || "Property Owner") : (agentTitle || "Agent"),
        location: role === "OWNER" ? (location || "Mozambique") : agentLocation,
        phone: role === 'AGENT' ? phone : null,
        officeAddress: role === 'AGENT' ? officeAddress : null,
        yearsExperience: role === "OWNER" ? 0 : experience,
        bio: role === "OWNER" ? "" : agentBio,
        specializations: role === "OWNER" ? [] : agentSpecializations,
        agencyName: isCorporate ? agencyName : null,
        agencyPhone: isCorporate ? agencyPhone : null,
        agencyBusinessType: isCorporate ? agencyBusinessType : null,
        agencyAbout: isCorporate ? agencyAbout : null,
        agencyServices: isCorporate ? agencyServices : [],
        agencyAreasServed: isCorporate ? agencyAreasServed : [],
        agencyWebsite: isCorporate ? agencyWebsite || null : null,
        agencyEmail: isCorporate ? agencyEmail || null : null,
        avatar: avatarUrl,
        corporateStatus: isCorporate ? 'PENDING' : null,
        role,
        emailVerifyToken: randomBytes(32).toString('hex'),
        emailVerifyExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const { password: _, ...agentWithoutPassword } = newAgent;

    try {
      await sendAgentVerificationEmail({
        name: newAgent.name,
        email: newAgent.email,
        token: newAgent.emailVerifyToken || undefined,
        /*
         * Where they were going before being asked to register. The sign-up
         * form already carries it as `?redirect=`; passing it through means
         * somebody who set out to post a house lands on the listing form when
         * they click the link, instead of on a sign-in box.
         */
        next: typeof body.redirect === 'string' && body.redirect.startsWith('/')
          ? body.redirect
          : undefined,
      });
    } catch (emailError) {
      console.error('Agent verification email failed:', emailError);
      await prisma.agent.delete({ where: { id: newAgent.id } });
      const message =
        process.env.NODE_ENV === 'development' && emailError instanceof Error
          ? emailError.message
          : 'We could not send the verification email. Please check the email service configuration and try again.';
      return NextResponse.json({ error: message }, { status: 503 });
    }

    await sendNewAgentNotificationEmail({ name: newAgent.name, email: newAgent.email, role }).catch((error) => {
      console.error('New agent admin notification failed:', error);
    });

    return NextResponse.json({
      user: agentWithoutPassword,
      requiresVerification: true,
      message: 'Account created. Check your email and click the verification link before signing in.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
