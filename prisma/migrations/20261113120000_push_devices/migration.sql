-- Phones that receive push notifications (mobile app 1.3.0+). Additive only.
CREATE TABLE IF NOT EXISTS "PushDevice" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'pt',
    "appVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PushDevice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PushDevice_token_key" ON "PushDevice"("token");
CREATE INDEX IF NOT EXISTS "PushDevice_agentId_idx" ON "PushDevice"("agentId");
DO $$ BEGIN
  ALTER TABLE "PushDevice" ADD CONSTRAINT "PushDevice_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
