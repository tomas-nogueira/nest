-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "SubjectCourse" DROP CONSTRAINT "SubjectCourse_courseId_fkey";

-- DropForeignKey
ALTER TABLE "SubjectCourse" DROP CONSTRAINT "SubjectCourse_subjectId_fkey";

-- AddForeignKey
ALTER TABLE "SubjectCourse" ADD CONSTRAINT "SubjectCourse_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCourse" ADD CONSTRAINT "SubjectCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
