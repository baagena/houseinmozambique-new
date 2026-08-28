'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

/**
 * next/image with a branded fallback. Listing media comes from Cloudinary and
 * agent-supplied URLs, so a dead link must never leave a broken box on the page.
 */
export default function SafeImage({
  src,
  alt,
  className = '',
  ...rest
}: Omit<ImageProps, 'src'> & { src?: string | null }) {
  const [failed, setFailed] = useState(false);
  const usable = typeof src === 'string' && src.trim().length > 0;

  if (!usable || failed) {
    return (
      <span
        aria-hidden="true"
        className="absolute inset-0 grid place-items-center bg-[#EDEAE2]"
        role="presentation"
      >
        <span className="material-symbols-outlined text-[2rem] text-[var(--line)]">image</span>
      </span>
    );
  }

  return (
    <Image
      {...rest}
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
