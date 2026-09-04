-- Ensure every subject's creator is enrolled in their own subject.
--
-- Root cause of the "wrong task count" on the progress page for subject
-- owners (e.g. the Admin/teacher): they created subjects and tasks but had
-- no UserEnrollment row, so subject-scoped aggregations treated them as
-- having zero subjects.

-- This migration is ADDITIVE ONLY: it inserts missing enrollment rows and
-- never modifies or deletes any existing record. Re-running is safe.
INSERT INTO "UserEnrollment" ("id", "userId", "subjectId", "createdAt")
SELECT
  substr(md5(random()::text || clock_timestamp()::text), 1, 24),
  s."userId",
  s."id",
  now()
FROM "Subject" s
WHERE s."userId" IS NOT NULL
  AND EXISTS (SELECT 1 FROM "User" u WHERE u."id" = s."userId")
ON CONFLICT ("userId", "subjectId") DO NOTHING;
