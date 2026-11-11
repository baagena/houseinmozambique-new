-- The currency the agent or admin quoted the listing price in ("MZN" or "USD").
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'MZN';
