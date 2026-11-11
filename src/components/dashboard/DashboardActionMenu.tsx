'use client';

import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/Icon';

type MenuPosition = {
  top: number;
  right: number;
  placement: 'above' | 'below';
  maxHeight: number;
};

export default function DashboardActionMenu({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePlacement = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;

      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const edgeGap = 8;
      const availableAbove = Math.max(0, triggerRect.top - edgeGap * 2);
      const availableBelow = Math.max(0, window.innerHeight - triggerRect.bottom - edgeGap * 2);
      const placement = menuRect.height <= availableBelow || availableBelow >= availableAbove ? 'below' : 'above';
      const maxHeight = Math.max(80, placement === 'below' ? availableBelow : availableAbove);

      setMenuPosition({
        top: placement === 'above' ? triggerRect.top - edgeGap : triggerRect.bottom + edgeGap,
        right: Math.max(
          edgeGap,
          Math.min(window.innerWidth - menuRect.width - edgeGap, window.innerWidth - triggerRect.right)
        ),
        placement,
        maxHeight,
      });
    };

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
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
        onClick={() => {
          setMenuPosition(null);
          setIsOpen((open) => !open);
        }}
        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#74777f] transition-colors hover:bg-[#f2f4f6] hover:text-[#002045] focus:outline-none focus:ring-2 focus:ring-[#002045]/20${isOpen ? ' bg-[#f2f4f6] text-[#002045]' : ''}`}
        aria-label="More actions"
        title="More actions"
        aria-expanded={isOpen}
      >
        <Icon name="more_vert" />
      </button>
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className={`fixed z-[100] min-w-40 rounded-lg border border-[#eceef1] bg-white p-1.5 shadow-xl${menuPosition?.placement === 'above' ? ' -translate-y-full' : ''}`}
          style={{
            top: menuPosition?.top ?? 0,
            right: menuPosition?.right ?? 8,
            maxHeight: menuPosition?.maxHeight ?? 'calc(100vh - 16px)',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            visibility: menuPosition ? 'visible' : 'hidden',
          }}
          onClick={() => setIsOpen(false)}
        >
          <div className="flex flex-col gap-0.5">{children}</div>
        </div>,
        document.body
      )}
    </div>
  );
}
