'use client';

import { useCallback, useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * The photographs, alone.
 *
 * On the page a photograph competes with the price, the buttons and the
 * writing. A buyer deciding whether to spend a Saturday driving to Costa do
 * Sol is looking at the photographs and nothing else, and that deserves the
 * whole screen with everything else out of the way.
 *
 * Contained, never cropped: this is the one place where seeing all of the
 * frame matters more than filling the rectangle.
 *
 * Keyboard is first-class — arrows move, Escape closes, and focus is put on
 * the dialog when it opens and returned when it closes, so a keyboard user is
 * not dropped back at the top of the document.
 */

export interface PhotoLightboxProps {
  images: string[];
  index: number;
  title: string;
  onIndex: (i: number) => void;
  onClose: () => void;
  closeLabel: string;
  counterLabel: (i: number, n: number) => string;
}

export default function PhotoLightbox({
  images, index, title, onIndex, onClose, closeLabel, counterLabel,
}: PhotoLightboxProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const returnFocusTo = useRef<Element | null>(null);

  const step = useCallback(
    (delta: number) => onIndex((index + delta + images.length) % images.length),
    [index, images.length, onIndex],
  );

  useEffect(() => {
    returnFocusTo.current = document.activeElement;
    dialogRef.current?.focus();

    // The page behind must not scroll under the overlay.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
      (returnFocusTo.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose, step]);

  return (
    <div
      className="lb"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      ref={dialogRef}
      // A click that starts and ends on the backdrop closes. Checking the
      // target keeps a drag that ends outside the image from closing it.
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="lb-bar">
        <span className="lb-count">{counterLabel(index + 1, images.length)}</span>
        <button className="lb-x" onClick={onClose} aria-label={closeLabel}>
          <Icon name="close" size={20} />
        </button>
      </div>

      <div className="lb-stage" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        {images.length > 1 && (
          <button className="lb-nav prev" onClick={() => step(-1)} aria-label="Previous photograph">
            <Icon name="chevron_left" size={22} />
          </button>
        )}
        {/*
          * A plain img sized to its own content, not a `fill` image.
          *
          * A fill image stretches to the whole stage box even when the picture
          * inside it is letterboxed, so it swallows every click in the dark
          * area around the photograph — which is exactly the area a person
          * clicks to dismiss a lightbox. Sized to the content, the dark area
          * belongs to the stage again and closing works.
          */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="lb-img" key={images[index]} src={images[index]} alt={`${title} — ${index + 1}`} />
        {images.length > 1 && (
          <button className="lb-nav next" onClick={() => step(1)} aria-label="Next photograph">
            <Icon name="chevron_right" size={22} />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="lb-rail">
          {images.map((src, i) => (
            <button
              key={src + i}
              className={`lb-thb${i === index ? ' on' : ''}`}
              onClick={() => onIndex(i)}
              aria-label={`Photograph ${i + 1}`}
              aria-current={i === index}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
