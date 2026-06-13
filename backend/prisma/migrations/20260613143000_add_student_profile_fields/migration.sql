ALTER TABLE "Student" ADD COLUMN "bio" TEXT;
ALTER TABLE "Student" ADD COLUMN "avatarFileId" TEXT;

CREATE UNIQUE INDEX "Student_avatarFileId_key" ON "Student"("avatarFileId");

ALTER TABLE "Student"
ADD CONSTRAINT "Student_avatarFileId_fkey"
FOREIGN KEY ("avatarFileId") REFERENCES "StoredFile"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
