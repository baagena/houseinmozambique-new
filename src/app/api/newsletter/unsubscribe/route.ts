import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/** One-click opt-out target for the link in every broadcast. */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id');

  const page = (heading: string, message: string) =>
    new NextResponse(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
       <meta name="viewport" content="width=device-width, initial-scale=1"/>
       <title>${heading} — House in Mozambique</title></head>
       <body style="margin:0;font-family:Arial,sans-serif;background:#f7f9fb;">
         <div style="max-width:520px;margin:12vh auto;padding:40px;background:#fff;border-radius:16px;text-align:center;">
           <h1 style="color:#002045;font-size:22px;margin:0 0 12px;">${heading}</h1>
           <p style="color:#43474e;line-height:1.6;margin:0 0 24px;">${message}</p>
           <a href="/" style="display:inline-block;background:#002045;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;">Back to House in Mozambique</a>
         </div>
       </body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );

  if (!id) {
    return page('Link incomplete', 'That unsubscribe link is missing its reference. Please use the link from the bottom of one of our emails.');
  }

  const subscriber = await prisma.subscriber.findUnique({ where: { id } });

  if (!subscriber) {
    return page('Already removed', 'This address is not on our update list, so there is nothing to unsubscribe.');
  }

  if (subscriber.isActive) {
    await prisma.subscriber.update({
      where: { id },
      data: { isActive: false, unsubscribedAt: new Date() },
    });
  }

  return page(
    'You have been unsubscribed',
    `We will stop sending updates to <strong>${subscriber.email}</strong>. You can subscribe again any time from the footer of our website.`
  );
}
