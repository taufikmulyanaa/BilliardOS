-- AlterTable
ALTER TABLE "shift_reports" ALTER COLUMN "closed_at" DROP NOT NULL,
ALTER COLUMN "closed_at" DROP DEFAULT;
