'use client';

import { useEffect, useState } from 'react';
import { BANNER_MIN_RATIO, BANNER_MIN_WIDTH, isBannerSize, isVideoUrl } from '@/components/ads/AdBanner';

type Result =
  | { kind: 'empty' }
  | { kind: 'checking' }
  | { kind: 'banner' | 'logo'; width: number; height: number }
  | { kind: 'video' }
  | { kind: 'broken' };

/**
 * Under the ad form's picture/video field: the rules for good artwork, and
 * how the pasted link will actually show (full banner or small logo), so the
 * person creating the ad knows before saving. Same rules as the app.
 */
export default function AdArtworkCheck({ url }: { url: string }) {
  const link = url.trim();
  // Decided from the text alone; only real pictures need loading.
  const immediate: Result | null = !link
    ? { kind: 'empty' }
    : isVideoUrl(link)
      ? { kind: 'video' }
      : !/^https:\/\//i.test(link)
        ? { kind: 'broken' }
        : null;
  const [measured, setMeasured] = useState<{ link: string; result: Result } | null>(null);

  useEffect(() => {
    if (immediate) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        const { naturalWidth: width, naturalHeight: height } = img;
        setMeasured({ link, result: { kind: isBannerSize(width, height) ? 'banner' : 'logo', width, height } });
      };
      img.onerror = () => { if (!cancelled) setMeasured({ link, result: { kind: 'broken' } }); };
      img.src = link;
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link, immediate?.kind]);

  const result: Result = immediate ?? (measured?.link === link ? measured.result : { kind: 'checking' });

  const verdict =
    result.kind === 'checking' ? { tone: 'text-[#5b616b] bg-[#f6f7f9] border-[#e6e8eb]', text: 'Checking the picture…' }
    : result.kind === 'banner' ? { tone: 'text-[#166534] bg-[#f0fdf4] border-[#bbf7d0]', text: `✓ Wide banner (${result.width} × ${result.height} px) — shown full width.` }
    : result.kind === 'logo' ? { tone: 'text-[#845326] bg-[#fdf6ee] border-[#f1d9bd]', text: `${result.width} × ${result.height} px — shown as a small logo beside the title. For a full-width banner use a wide picture of at least 1200 × 400 px (3:1).` }
    : result.kind === 'video' ? { tone: 'text-[#166534] bg-[#f0fdf4] border-[#bbf7d0]', text: 'Video — plays silently on a loop in a wide frame. Make sure it is an MP4 link (best uploaded to Cloudinary).' }
    : result.kind === 'broken' ? { tone: 'text-[#b91c1c] bg-[#fef2f2] border-[#fecaca]', text: 'This link could not be opened as a picture. Use a full https:// link to a JPG, PNG, WebP or GIF.' }
    : null;

  return (
    <div className="mt-2 space-y-2">
      {verdict && <p className={`rounded-lg border px-3 py-2 text-xs leading-5 ${verdict.tone}`}>{verdict.text}</p>}
      <div className="rounded-lg bg-[#f6f7f9] px-3 py-2.5 text-xs leading-5 text-[#5b616b]">
        <p className="mb-1 font-semibold text-[#374151]">Picture and video rules</p>
        <ul className="list-disc space-y-0.5 pl-4">
          <li>Banner: a wide picture, at least 1200 × 400 px (3:1 is ideal; at least {BANNER_MIN_RATIO === 1.5 ? '3:2' : BANNER_MIN_RATIO} and {BANNER_MIN_WIDTH} px wide). JPG, PNG, WebP or GIF. Shown full width.</li>
          <li>Logo: a square or small picture (e.g. 400 × 400 px). Shown small beside the title, never stretched.</li>
          <li>Video: an MP4 link, wide (16:9), up to 15 seconds and 5 MB. Upload it to Cloudinary for reliable playback.</li>
          <li>Keep important wording in the title and button, not only inside the picture.</li>
        </ul>
      </div>
    </div>
  );
}
