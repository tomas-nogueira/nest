ALTER TABLE "Post" ADD COLUMN "content" JSONB;

CREATE INDEX IF NOT EXISTS "Student_courseId_idx" ON "Student"("courseId");
CREATE INDEX IF NOT EXISTS "SubjectCourse_courseId_idx" ON "SubjectCourse"("courseId");
CREATE INDEX IF NOT EXISTS "Post_subjectId_createdAt_idx" ON "Post"("subjectId", "createdAt");
CREATE INDEX IF NOT EXISTS "Post_studentId_createdAt_idx" ON "Post"("studentId", "createdAt");
CREATE INDEX IF NOT EXISTS "Attachment_postId_idx" ON "Attachment"("postId");
CREATE INDEX IF NOT EXISTS "Attachment_storedFileId_idx" ON "Attachment"("storedFileId");
CREATE INDEX IF NOT EXISTS "Vote_postId_idx" ON "Vote"("postId");
