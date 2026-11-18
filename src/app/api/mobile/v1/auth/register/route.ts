import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { sendAgentVerificationEmail, sendNewAgentNotificationEmail } from '@/lib/email';
import { signAgentToken, AGENT_SELF_SELECT } from '@/lib/mobile-auth';
import { randomBytes } from 'node:crypto';
import { pushes, pushToAdmins } from '@/lib/push';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, name, phone, title, location, yearsExperience, bio, specializations } = body;
    // Phone keyboards capitalise the first letter and leave trailing spaces;
    // emails are stored trimmed and lower-case (as the website does), so
    // match that, or "Admin@…" is told its password is wrong.
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const requestedRole = body.accountType || body.role;
    // CORPORATE is an AGENT account with an agency attached (as on the
    // website): it stays PENDING until staff verify the business.
    const isCorporate = requestedRole === 'CORPORATE';
    const role =
      requestedRole === 'CUSTOMER' ? 'CUSTOMER' : requestedRole === 'OWNER' ? 'OWNER' : 'AGENT';

    const text = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);
    const list = (value: unknown, max: number) =>
      (Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [])
        .map((v) => String(v).trim())
        .filter(Boolean)
        .slice(0, max);
    const agencyName = isCorporate ? text(body.agencyName, 160) : '';
    const agencyPhone = isCorporate ? text(body.agencyPhone, 40) : '';
    const agencyWebsite = isCorporate ? text(body.agencyWebsite, 300) : '';
    const agencyEmail = isCorporate ? text(body.agencyEmail, 200).toLowerCase() : '';
    if (isCorporate) {
      if (!agencyName || !agencyPhone) {
        return NextResponse.json({ error: 'Enter the agency name and contact phone.' }, { status: 400 });
      }
      const digits = agencyPhone.replace(/\D/g, '');
      if (digits.length < 6 || digits.length > 20) {
        return NextResponse.json({ error: 'Enter a complete agency phone number with 6 to 20 digits.' }, { status: 400 });
      }
      if (agencyWebsite && !/^https:\/\//i.test(agencyWebsite)) {
        return NextResponse.json({ error: 'Enter a full website address starting with https://.' }, { status: 400 });
      }
      if (agencyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agencyEmail)) {
        return NextResponse.json({ error: 'Enter a valid public agency email address.' }, { status: 400 });
      }
    }

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password and name are required' },
        { status: 400 }
      );
    }

    // Current app builds send acceptedTerms: true from a required checkbox.
    // Builds already installed from before the checkbox don't send it, so a
    // missing flag is recorded as "not captured" rather than refused.
    if (body.acceptedTerms !== undefined && body.acceptedTerms !== true) {
      return NextResponse.json(
        { error: 'You must accept the Terms of Service and Privacy Policy' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const existingAgent = await prisma.agent.findUnique({ where: { email } });
    if (existingAgent) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    const verificationToken = randomBytes(32).toString('hex');

    const newAgent = await prisma.agent.create({
      data: {
        email,
        password: hashedPassword,
        name,
        initials,
        phone: (isCorporate ? agencyPhone : phone) || null,
        title:
          role === 'CUSTOMER'
            ? 'Customer'
            : role === 'OWNER'
              ? title || 'Property Owner'
              : title || (isCorporate ? 'Agency representative' : 'Agent'),
        location: location || 'Mozambique',
        yearsExperience: yearsExperience || 0,
        bio: bio || '',
        specializations: specializations || [],
        ...(isCorporate && {
          agencyName,
          agencyPhone,
          agencyBusinessType: text(body.agencyBusinessType, 120) || null,
          agencyAbout: text(body.agencyAbout, 3000) || null,
          agencyServices: list(body.agencyServices, 20),
          agencyAreasServed: list(body.agencyAreasServed, 30),
          agencyWebsite: agencyWebsite || null,
          agencyEmail: agencyEmail || null,
          corporateStatus: 'PENDING',
        }),
        role,
        emailVerifyToken: verificationToken,
        emailVerifyExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        termsAcceptedAt: body.acceptedTerms === true ? new Date() : null,
      },
      select: AGENT_SELF_SELECT,
    });

    if (role === 'AGENT' || role === 'OWNER') {
      try {
        await sendAgentVerificationEmail({
          name: newAgent.name,
          email: newAgent.email,
          token: verificationToken,
        });
        await sendNewAgentNotificationEmail({ name: newAgent.name, email: newAgent.email, role });
      } catch (emailError) {
        console.error('Agent verification email failed:', emailError);
      }
    }

    pushToAdmins(pushes.newAccount(isCorporate ? `${agencyName} (${newAgent.name})` : newAgent.name, isCorporate ? 'CORPORATE' : newAgent.role));
    const token = signAgentToken(newAgent.id, newAgent.role);

    return NextResponse.json({
      token,
      agent: newAgent,
      message: role === 'CUSTOMER'
        ? 'Account created successfully.'
        : isCorporate
          ? 'Agency submitted. Our team will review it before it appears in the directory.'
          : 'Agent registered successfully. A verification email has been sent.',
    });
  } catch (error) {
    console.error('Mobile registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
