ALTER TABLE "Course" ADD COLUMN "nameKey" TEXT;
ALTER TABLE "Course" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subject" ADD COLUMN "nameKey" TEXT;
ALTER TABLE "SubjectCourse" ADD COLUMN "subjectNameKey" TEXT;

UPDATE "Course"
SET "nameKey" = lower(btrim("name"));

UPDATE "Subject"
SET "nameKey" = lower(btrim("name"));

UPDATE "SubjectCourse" sc
SET "subjectNameKey" = s."nameKey"
FROM "Subject" s
WHERE s.id = sc."subjectId";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Course"
    GROUP BY "nameKey", "isActive"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Existem cursos com mesmo nome e mesmo status. Corrija os dados antes de aplicar esta migration.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "SubjectCourse"
    GROUP BY "courseId", "subjectNameKey"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Existem materias duplicadas no mesmo curso apos normalizacao. Corrija os dados antes de aplicar esta migration.';
  END IF;
END $$;

ALTER TABLE "Course" ALTER COLUMN "nameKey" SET NOT NULL;
ALTER TABLE "Subject" ALTER COLUMN "nameKey" SET NOT NULL;
ALTER TABLE "SubjectCourse" ALTER COLUMN "subjectNameKey" SET NOT NULL;

CREATE UNIQUE INDEX "Course_nameKey_isActive_key" ON "Course"("nameKey", "isActive");
CREATE UNIQUE INDEX "SubjectCourse_courseId_subjectNameKey_key" ON "SubjectCourse"("courseId", "subjectNameKey");
