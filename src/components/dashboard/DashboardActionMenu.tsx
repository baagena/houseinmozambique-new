'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

export default function DashboardActionMenu({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<'above' | 'below'>('below');
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!(event.target instanceof Node) || !triggerRef.current?.parentElement?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const updatePlacement = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        const nextPlacement = window.innerHeight - rect.bottom < 190 ? 'above' : 'below';
        setPlacement(nextPlacement);
        setMenuPosition({
          top: nextPlacement === 'above' ? rect.top - 8 : rect.bottom + 8,
          right: window.innerWidth - rect.right,
        });
      }
    };

    updatePlacement();
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#74777f] transition-colors hover:bg-[#f2f4f6] hover:text-[#002045] focus:outline-none focus:ring-2 focus:ring-[#002045]/20${isOpen ? ' bg-[#f2f4f6] text-[#002045]' : ''}`}
        aria-label="More actions"
        title="More actions"
        aria-expanded={isOpen}
      >
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
      </button>
      {isOpen && (
        <div
          className={`fixed right-0 z-[60] min-w-40 rounded-lg border border-[#eceef1] bg-white p-1.5 shadow-xl${placement === 'above' ? ' -translate-y-full' : ''}`}
          style={{ top: menuPosition.top, right: menuPosition.right }}
          onClick={() => setIsOpen(false)}
        >
          <div className="flex flex-col gap-0.5">{children}</div>
        </div>
      )}
    </div>
  );
}
