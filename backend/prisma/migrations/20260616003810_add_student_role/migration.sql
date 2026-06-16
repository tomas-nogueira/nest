-- CreateEnum
CREATE TYPE "StudentRole" AS ENUM ('student', 'admin');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "role" "StudentRole" NOT NULL DEFAULT 'student';
