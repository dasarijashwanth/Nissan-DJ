-- Distinguishes money paid out (chit contributions, the default and only kind that existed
-- before) from money received (e.g. interest on a loan given out), tracked as a separate total.
ALTER TABLE "ChitFund" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'paid';
ALTER TABLE "ChitFundPlan" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'paid';
