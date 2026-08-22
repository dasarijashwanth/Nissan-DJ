-- Add explicit vehicle/life scope to Transaction, replacing the old category-based
-- inference (which mis-bucketed things like "Rides" income and "Other"-categorized
-- car purchases). One-time cutover: every transaction that already exists is marked
-- "vehicle" so historical data stays under Vehicle mode; new transactions default to
-- "life" and are explicitly set by the app based on whichever mode is active when
-- they're created.
ALTER TABLE "Transaction" ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'life';

UPDATE "Transaction" SET "scope" = 'vehicle';

CREATE INDEX "Transaction_userId_scope_idx" ON "Transaction"("userId", "scope");
