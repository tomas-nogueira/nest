ALTER TABLE "Post" ADD COLUMN "commentCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Attachment" ADD COLUMN "commentId" TEXT;
ALTER TABLE "Attachment" ALTER COLUMN "postId" DROP NOT NULL;

ALTER TABLE "Vote" ADD COLUMN "commentId" TEXT;
ALTER TABLE "Vote" ALTER COLUMN "postId" DROP NOT NULL;

CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Comment_postId_parentId_createdAt_idx" ON "Comment"("postId", "parentId", "createdAt");
CREATE INDEX "Comment_studentId_createdAt_idx" ON "Comment"("studentId", "createdAt");
CREATE INDEX "Attachment_commentId_idx" ON "Attachment"("commentId");
CREATE UNIQUE INDEX "Vote_userId_commentId_key" ON "Vote"("userId", "commentId");
CREATE INDEX "Vote_commentId_idx" ON "Vote"("commentId");

ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_exactly_one_owner_check" CHECK (
    (CASE WHEN "postId" IS NULL THEN 0 ELSE 1 END) +
    (CASE WHEN "commentId" IS NULL THEN 0 ELSE 1 END) = 1
);

ALTER TABLE "Vote" ADD CONSTRAINT "Vote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_exactly_one_target_check" CHECK (
    (CASE WHEN "postId" IS NULL THEN 0 ELSE 1 END) +
    (CASE WHEN "commentId" IS NULL THEN 0 ELSE 1 END) = 1
);
