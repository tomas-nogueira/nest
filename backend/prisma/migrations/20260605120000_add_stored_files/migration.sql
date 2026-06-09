CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoredFile_storedName_key" ON "StoredFile"("storedName");

ALTER TABLE "Attachment" ADD COLUMN "storedFileId" TEXT;

INSERT INTO "StoredFile" ("id", "originalName", "storedName", "path", "mimeType", "size", "createdAt")
SELECT
    'legacy-attachment-' || "id",
    "filepath",
    'legacy-attachment-' || "id",
    "filepath",
    'application/octet-stream',
    0,
    "createdAt"
FROM "Attachment";

UPDATE "Attachment"
SET "storedFileId" = 'legacy-attachment-' || "id"
WHERE "storedFileId" IS NULL;

ALTER TABLE "Attachment" ALTER COLUMN "storedFileId" SET NOT NULL;

ALTER TABLE "Attachment" DROP COLUMN "filepath";

ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_storedFileId_fkey" FOREIGN KEY ("storedFileId") REFERENCES "StoredFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
