'use client';

import { useEffect, useState } from 'react';

/**
 * Recharts paints into SVG attributes, which cannot read CSS custom properties,
 * so the chart needs literal hex. This resolves the same values the token
 * stylesheet holds, for whichever theme is actually showing.
 *
 * Theme state is three-way: an explicit `data-theme` on <html> wins, and its
 * absence means "system", which is `prefers-color-scheme`. Both are watched.
 */
export type ChartMode = 'light' | 'dark';

export interface ChartTheme {
  mode: ChartMode;
  /** Fixed order, never cycled. Validated as a categorical set. */
  slots: [string, string, string, string, string];
  surface: string;
  grid: string;
  axis: string;
  text1: string;
  text2: string;
  text3: string;
  border: string;
}

const LIGHT: ChartTheme = {
  mode: 'light',
  slots: ['#2a78d6', '#c9631f', '#1a9a76', '#a87c00', '#c25e8c'],
  surface: '#ffffff',
  grid: '#edeff3',
  axis: '#c4c9d2',
  text1: '#132339',
  text2: '#5b6472',
  text3: '#667080',
  border: '#e4e7ec',
};

const DARK: ChartTheme = {
  mode: 'dark',
  slots: ['#5596e8', '#e2834a', '#33b590', '#d9aa2e', '#d97faa'],
  surface: '#111b29',
  grid: '#1b2734',
  axis: '#3a4a5f',
  text1: '#eef2f7',
  text2: '#a7b2c2',
  text3: '#8b98a8',
  border: '#233246',
};

function resolve(): ChartMode {
  if (typeof document === 'undefined') return 'light';
  const explicit = document.documentElement.getAttribute('data-theme');
  if (explicit === 'dark') return 'dark';
  if (explicit === 'light') return 'light';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useChartTheme(): ChartTheme {
  // Start light so server and first client render agree; the effect corrects it.
  const [mode, setMode] = useState<ChartMode>('light');

  useEffect(() => {
    const sync = () => setMode(resolve());
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    media?.addEventListener('change', sync);

    return () => {
      observer.disconnect();
      media?.removeEventListener('change', sync);
    };
  }, []);

  return mode === 'dark' ? DARK : LIGHT;
}
