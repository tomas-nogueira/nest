import { prisma } from "../../lib/prisma";

const countStudents = async () => {
	return prisma.student.count();
};

export { countStudents };