'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Three-state theme control: System / Light / Dark.
 *
 * "System" is the default and stamps NOTHING on the document, so the OS setting
 * drives it through `prefers-color-scheme`. Light and dark stamp an explicit
 * `data-theme`, which the token stylesheet scopes so an explicit choice wins in
 * either direction.
 */

type Theme = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'him-dash-theme';

const OPTIONS: { value: Theme; icon: string; label: string }[] = [
  { value: 'system', icon: 'computer', label: 'System' },
  { value: 'light', icon: 'light_mode', label: 'Light' },
  { value: 'dark', icon: 'dark_mode', label: 'Dark' },
];

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

export default function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Private window or blocked site data — fall back to system.
    }
    const initial: Theme =
      stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const choose = useCallback((next: Theme) => {
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preference just will not persist; the page still works.
    }
  }, []);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="inline-flex items-center gap-0.5 p-0.5"
      style={{
        background: 'var(--d-border-soft)',
        borderRadius: 'var(--d-radius-sm)',
        border: '1px solid var(--d-border)',
      }}
    >
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.label}
            onClick={() => choose(opt.value)}
            className="flex items-center justify-center transition-colors"
            style={{
              width: 26,
              height: 24,
              borderRadius: 6,
              background: active ? 'var(--d-card)' : 'transparent',
              color: active ? 'var(--d-text-1)' : 'var(--d-text-3)',
              border: active ? '1px solid var(--d-border)' : '1px solid transparent',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
              {opt.icon}
            </span>
            <span className="sr-only">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
