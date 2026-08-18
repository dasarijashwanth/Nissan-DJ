-- Hand-written (not Prisma-generated) to preserve existing data: Prisma's own diff would have
-- dropped and recreated the Car table and all carId columns, destroying the row(s) in them.
-- This migration renames instead, so existing rows keep their id and values.

-- Car -> Vehicle
ALTER TABLE "Car" RENAME TO "Vehicle";
ALTER TABLE "Vehicle" RENAME CONSTRAINT "Car_userId_fkey" TO "Vehicle_userId_fkey";
ALTER TABLE "Vehicle" RENAME CONSTRAINT "Car_pkey" TO "Vehicle_pkey";

-- userId is no longer unique (multiple vehicles per user)
DROP INDEX "Car_userId_key";
CREATE INDEX "Vehicle_userId_idx" ON "Vehicle"("userId");

-- New required "nickname" column: add nullable, backfill from make+model, then enforce NOT NULL
ALTER TABLE "Vehicle" ADD COLUMN "nickname" TEXT;
UPDATE "Vehicle" SET "nickname" = "make" || ' ' || "model" WHERE "nickname" IS NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "nickname" SET NOT NULL;

-- make/model/year/color no longer default to a specific vehicle (multi-vehicle support)
ALTER TABLE "Vehicle" ALTER COLUMN "make" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "model" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "year" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "color" DROP DEFAULT;

-- New columns
ALTER TABLE "Vehicle" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Vehicle" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- Any pre-existing vehicle was the user's only one; mark it primary
UPDATE "Vehicle" SET "isPrimary" = true;

-- carId -> vehicleId on every child table (rename, not drop+recreate, to keep existing FK values)
ALTER TABLE "FuelLog" RENAME COLUMN "carId" TO "vehicleId";
ALTER TABLE "FuelLog" RENAME CONSTRAINT "FuelLog_carId_fkey" TO "FuelLog_vehicleId_fkey";
ALTER INDEX "FuelLog_carId_idx" RENAME TO "FuelLog_vehicleId_idx";

ALTER TABLE "MaintenanceLog" RENAME COLUMN "carId" TO "vehicleId";
ALTER TABLE "MaintenanceLog" RENAME CONSTRAINT "MaintenanceLog_carId_fkey" TO "MaintenanceLog_vehicleId_fkey";
ALTER INDEX "MaintenanceLog_carId_idx" RENAME TO "MaintenanceLog_vehicleId_idx";

ALTER TABLE "RepairLog" RENAME COLUMN "carId" TO "vehicleId";
ALTER TABLE "RepairLog" RENAME CONSTRAINT "RepairLog_carId_fkey" TO "RepairLog_vehicleId_fkey";
ALTER INDEX "RepairLog_carId_idx" RENAME TO "RepairLog_vehicleId_idx";

ALTER TABLE "OdometerLog" RENAME COLUMN "carId" TO "vehicleId";
ALTER TABLE "OdometerLog" RENAME CONSTRAINT "OdometerLog_carId_fkey" TO "OdometerLog_vehicleId_fkey";
ALTER INDEX "OdometerLog_carId_idx" RENAME TO "OdometerLog_vehicleId_idx";

ALTER TABLE "Insurance" RENAME COLUMN "carId" TO "vehicleId";
ALTER TABLE "Insurance" RENAME CONSTRAINT "Insurance_carId_fkey" TO "Insurance_vehicleId_fkey";
ALTER INDEX "Insurance_carId_idx" RENAME TO "Insurance_vehicleId_idx";

-- New table: DailyOdometer (Part B daily tracking; no existing data)
CREATE TABLE "DailyOdometer" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "miles" DOUBLE PRECISION NOT NULL,
    "driven" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyOdometer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyOdometer_vehicleId_date_key" ON "DailyOdometer"("vehicleId", "date");

ALTER TABLE "DailyOdometer" ADD CONSTRAINT "DailyOdometer_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
