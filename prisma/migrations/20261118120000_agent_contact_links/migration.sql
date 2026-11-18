-- Agent profile contact channels, and contact presses made on a profile
-- rather than a listing. Additive only, safe to re-run.
--
-- Apply with:  npx prisma db execute --file prisma/migrations/20261118120000_agent_contact_links/migration.sql
-- (never `prisma db push` on the live database — it would drop live Agent columns)

ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "socialLinks" JSONB;

-- A press on the agent's profile has no listing.
ALTER TABLE "ContactEvent" ALTER COLUMN "propertyId" DROP NOT NULL;
