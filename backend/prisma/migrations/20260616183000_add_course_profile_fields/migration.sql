ALTER TABLE "Course" ADD COLUMN "bio" TEXT;
ALTER TABLE "Course" ADD COLUMN "avatarFileId" TEXT;

CREATE UNIQUE INDEX "Course_avatarFileId_key" ON "Course"("avatarFileId");

ALTER TABLE "Course"
ADD CONSTRAINT "Course_avatarFileId_fkey"
FOREIGN KEY ("avatarFileId") REFERENCES "StoredFile"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
