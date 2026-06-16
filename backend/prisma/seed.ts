import bcrypt from "bcryptjs";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL nao configurada.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const upsertCourseByName = async (name: string) => {
	const existingCourse = await prisma.course.findFirst({
		where: { name },
	});

	if (existingCourse) {
		return prisma.course.update({
			where: { id: existingCourse.id },
			data: { isActive: true },
		});
	}

	return prisma.course.create({
		data: {
			name,
			isActive: true,
		},
	});
};

const upsertSubjectByName = async (name: string) => {
	const existingSubject = await prisma.subject.findFirst({
		where: { name },
	});

	if (existingSubject) {
		return prisma.subject.update({
			where: { id: existingSubject.id },
			data: { isActive: true },
		});
	}

	return prisma.subject.create({
		data: {
			name,
			isActive: true,
		},
	});
};

const main = async () => {
	const course = await upsertCourseByName("Sistema de Informação");
	const subject = await upsertSubjectByName("Algoritmos");

	await prisma.subjectCourse.createMany({
		data: [
			{
				courseId: course.id,
				subjectId: subject.id,
			},
		],
		skipDuplicates: true,
	});

	await prisma.student.upsert({
		where: {
			email: "admin@gmail.com",
		},
		update: {
			name: "Admin",
			passwordHash: await bcrypt.hash("admin123", 10),
			role: "admin",
			courseId: course.id,
		},
		create: {
			name: "Admin",
			email: "admin@gmail.com",
			passwordHash: await bcrypt.hash("admin123", 10),
			role: "admin",
			courseId: course.id,
		},
	});

	console.info("Seed concluido: curso, materia e usuario admin garantidos.");
};

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (error) => {
		console.error(error);
		await prisma.$disconnect();
		process.exit(1);
	});
