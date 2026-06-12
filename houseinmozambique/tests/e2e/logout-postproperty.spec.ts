import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test('login -> access /post-property -> logout clears client+server state', async ({ page, request }) => {
  // Go to auth page
  await page.goto(`${BASE}/auth`, { waitUntil: 'networkidle' });

  // Perform login via fetch from the page context so browser stores the HttpOnly cookie
  const login = await page.evaluate(async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'agent-1@houseinmoz.com', password: 'password123' }),
      credentials: 'include',
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  });

  expect(login.status).toBe(200);
  expect(login.body).toBeTruthy();

  // Allow cookie to settle
  await page.waitForTimeout(500);

  // Navigate to post-property and assert we can access the page
  await page.goto(`${BASE}/post-property`, { waitUntil: 'networkidle' });
  const hasListingProgress = await page.locator('text=Listing Progress').count();
  expect(hasListingProgress).toBeGreaterThan(0);

  // Open user menu and click Sign Out (try several common labels)
  await page.click('button[aria-label="User menu"]');
  const signOutSelectors = ['text=Sign Out', 'text=Sign out', 'text=Logout', 'text=Log out'];
  let clicked = false;
  for (const s of signOutSelectors) {
    const loc = page.locator(s);
    if (await loc.count() > 0) {
      await loc.first().click();
      clicked = true;
      break;
    }
  }

  // If dropdown sign-out not found, try sidebar (dashboard)
  if (!clicked) {
    await page.goto(`${BASE}/dashboard/agent`, { waitUntil: 'networkidle' });
    const sidebarBtn = page.locator('button:has-text("Sign Out"), button:has-text("Sign out"), button:has-text("Logout")');
    if (await sidebarBtn.count() > 0) {
      await sidebarBtn.first().click();
      clicked = true;
    }
  }

  // Wait briefly for client-side logout to complete
  await page.waitForTimeout(700);

  // Verify navigation away after logout and localStorage cleared
  const url = page.url();
  expect(url.includes('/auth') || url === `${BASE}/` || url === `${BASE}`).toBeTruthy();
  const storedUserId = await page.evaluate(() => localStorage.getItem('userId'));
  expect(storedUserId).toBeNull();

  // Verify server-side session cleared
  const meResp = await request.get(`${BASE}/api/auth/me`);
  expect(meResp.status()).toBe(401);
});
