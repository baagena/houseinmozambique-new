#!/usr/bin/env node
/**
 * Contrast validator for the House in Mozambique palette.
 *
 *   node tokens/validate-contrast.mjs
 *
 * Run this after ANY change to tokens.css. It exits non-zero on a failure,
 * so it can go straight into CI.
 *
 * Thresholds (WCAG 2.1 AA):
 *   4.5:1  body text
 *   3.0:1  UI component boundaries, state indicators, chart marks
 *
 * The point of this file is that nobody has to argue about whether a colour
 * "looks readable enough". It either measures or it doesn't.
 */

const hex = (h) => {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

const luminance = (c) => {
  const [r, g, b] = hex(c).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
  const l1 = luminance(a), l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

// --- the palette under test -------------------------------------------------
const LIGHT = {
  card: '#ffffff', paper: '#f5f6f9', ink: '#0a2540',
  text1: '#132339', text2: '#5b6472', text3: '#667080',
  bronze: '#8a5a2b', navLabel: '#8098bb', navItem: '#b9cbe4',
  borderCtl: '#7d8695', goldLine: '#b9791f',
  good: '#157a4a', goodBg: '#e7f5ee',
  warn: '#8f550e', warnBg: '#fdf1de',
  crit: '#b23b34', critBg: '#fbeae8',
  slots: ['#2a78d6', '#c9631f', '#1a9a76', '#a87c00', '#c25e8c'],
  seq500: '#256abf',
};

const DARK = {
  card: '#111b29', paper: '#0b1420', ink: '#0e2f52',
  text1: '#eef2f7', text2: '#a7b2c2', text3: '#8b98a8',
  bronze: '#d09a5c', navLabel: '#8098bb', navItem: '#b9cbe4',
  borderCtl: '#5d7189', goldLine: '#e8a53d',
  good: '#45b881', goodBg: '#0f2b1f',
  warn: '#dba24a', warnBg: '#2e2410',
  crit: '#e8857b', critBg: '#301514',
  slots: ['#5596e8', '#e2834a', '#33b590', '#d9aa2e', '#d97faa'],
  seq500: '#4a8fd8',
};

let failures = 0;

const check = (label, fg, bg, need) => {
  const r = ratio(fg, bg);
  const ok = r >= need;
  if (!ok) failures++;
  const mark = ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
  console.log(`  ${mark} ${r.toFixed(2).padStart(5)}:1  (min ${need})  ${label}`);
};

const suite = (name, P) => {
  console.log(`\n${name}`);
  console.log('  — text on surfaces —');
  check('body on card',        P.text1, P.card, 4.5);
  check('secondary on card',   P.text2, P.card, 4.5);
  check('caption on card',     P.text3, P.card, 4.5);
  check('caption on paper',    P.text3, P.paper, 4.5);
  check('link (bronze)',       P.bronze, P.card, 4.5);

  console.log('  — status text (on card and on its own tint) —');
  check('good on card',        P.good, P.card, 4.5);
  check('good on tint',        P.good, P.goodBg, 4.5);
  check('warn on card',        P.warn, P.card, 4.5);
  check('warn on tint',        P.warn, P.warnBg, 4.5);
  check('crit on card',        P.crit, P.card, 4.5);
  check('crit on tint',        P.crit, P.critBg, 4.5);

  console.log('  — sidebar (on brand navy) —');
  check('nav item',            P.navItem, P.ink, 4.5);
  check('nav section label',   P.navLabel, P.ink, 4.5);

  console.log('  — UI boundaries and marks (3:1) —');
  check('form control border', P.borderCtl, P.card, 3);
  check('form border on paper',P.borderCtl, P.paper, 3);
  check('selected-state outline', P.goldLine, P.card, 3);
  P.slots.forEach((c, i) => check(`chart series ${i + 1}`, c, P.card, 3));
  check('sequential ramp mid', P.seq500, P.card, 3);
};

console.log('House in Mozambique — contrast validation (WCAG 2.1 AA)');
suite('LIGHT', LIGHT);
suite('DARK  (selected for the dark surface, not inverted)', DARK);

console.log(
  failures === 0
    ? '\n\x1b[32mALL PASS\x1b[0m — palette meets WCAG 2.1 AA in both themes.\n'
    : `\n\x1b[31m${failures} FAILING\x1b[0m — fix before shipping.\n`
);

process.exit(failures === 0 ? 0 : 1);
