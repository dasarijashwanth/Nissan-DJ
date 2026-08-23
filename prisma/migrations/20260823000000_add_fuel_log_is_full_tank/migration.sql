-- Distinguishes a genuine full-tank fill-up from a small partial top-off. MPG is only computed
-- between two consecutive full-tank fills; a partial fill's gallons roll forward into that next
-- segment instead of forming their own (misleadingly short) segment.
ALTER TABLE "FuelLog" ADD COLUMN "isFullTank" BOOLEAN NOT NULL DEFAULT true;
