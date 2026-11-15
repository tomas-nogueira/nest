import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL nao configurada.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const normalizeNameKey = (name: string) => name.trim().toLocaleLowerCase("pt-BR");

const getOrCreateCourseByName = async (name: string, options: { isSystem?: boolean } = {}) => {
  const nameKey = normalizeNameKey(name);
  const existingCourse = await prisma.course.findFirst({
    where: {
      nameKey,
      isActive: true,
    },
  });

  if (existingCourse) {
    return prisma.course.update({
      where: { id: existingCourse.id },
      data: {
        name,
        ...(options.isSystem !== undefined ? { isSystem: options.isSystem } : {}),
      },
    });
  }

  return prisma.course.create({
    data: {
      name,
      nameKey,
      isActive: true,
      isSystem: options.isSystem ?? false,
    },
  });
};

const getOrCreateSubjectByName = async (name: string) => {
  const nameKey = normalizeNameKey(name);
  const existingSubject = await prisma.subject.findFirst({
    where: { nameKey },
  });

  if (existingSubject) {
    return prisma.subject.update({
      where: { id: existingSubject.id },
      data: {
        name,
        nameKey,
        isActive: true,
      },
    });
  }

  return prisma.subject.create({
    data: {
      name,
      nameKey,
      isActive: true,
    },
  });
};

const linkSubjectToCourse = async (courseId: string, subjectId: string, subjectNameKey: string) => {
  await prisma.subjectCourse.upsert({
    where: {
      subjectId_courseId: {
        courseId,
        subjectId,
      },
    },
    update: {
      subjectNameKey,
    },
    create: {
      courseId,
      subjectId,
      subjectNameKey,
    },
  });
};

const getOrCreateAdmin = async (courseId: string) => {
  const existingAdmin = await prisma.student.findUnique({
    where: {
      email: "admin@gmail.com",
    },
  });

  if (existingAdmin) {
    return existingAdmin;
  }

  return prisma.student.create({
    data: {
      name: "Admin",
      email: "admin@gmail.com",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "admin",
      courseId,
    },
  });
};

const ensureDefaultChangeLog = async (adminId: string) => {
  const title = "Bem-vindo às Novidades do NEST";
  const description =
    "Bem-vindo à página Novidades! Aqui você pode acompanhar o histórico de mudanças, melhorias e novos recursos do NEST. Administradores também podem publicar, editar e excluir novidades por esta página.";
  const publicationDate = new Date();
  const defaultChangeLog = await prisma.changeLog.findFirst({
    where: {
      userId: adminId,
      title,
    },
    select: { id: true },
  });

  if (defaultChangeLog) {
    return prisma.changeLog.update({
      where: { id: defaultChangeLog.id },
      data: { description, publicationDate },
    });
  }

  return prisma.changeLog.create({
    data: {
      userId: adminId,
      title,
      description,
      publicationDate,
    },
  });
};

const main = async () => {
  const defaultCourse = await getOrCreateCourseByName("Sistemas de Informação");
  const defaultSubject = await getOrCreateSubjectByName("Algoritmos");
  await linkSubjectToCourse(defaultCourse.id, defaultSubject.id, defaultSubject.nameKey);

  const systemCourse = await getOrCreateCourseByName("Outros", { isSystem: true });
  const systemSubject = await getOrCreateSubjectByName("Geral");
  await linkSubjectToCourse(systemCourse.id, systemSubject.id, systemSubject.nameKey);

  const admin = await getOrCreateAdmin(defaultCourse.id);
  await ensureDefaultChangeLog(admin.id);

  console.info("Seed concluído: cursos, matérias obrigatórias, usuário admin e novidade padrão garantidos.");
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
