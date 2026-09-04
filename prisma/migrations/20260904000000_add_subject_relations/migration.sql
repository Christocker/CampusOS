-- CampusOS: subject relations + FK alignment

-- Clean up dangling subject references left by earlier subject deletions
UPDATE "CalendarEvent" SET "subjectId" = NULL
WHERE "subjectId" IS NOT NULL AND "subjectId" NOT IN (SELECT "id" FROM "Subject");

UPDATE "File" SET "subjectId" = NULL
WHERE "subjectId" IS NOT NULL AND "subjectId" NOT IN (SELECT "id" FROM "Subject");

-- AlterTable: align Task.subjectId FK with schema (onDelete: Cascade)
ALTER TABLE "Task" DROP CONSTRAINT "Task_subjectId_fkey";
ALTER TABLE "Task" ADD CONSTRAINT "Task_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CalendarEvent_subjectId_idx" ON "CalendarEvent"("subjectId");
CREATE INDEX IF NOT EXISTS "File_subjectId_idx" ON "File"("subjectId");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
