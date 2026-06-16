import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma";
import type { StudentRole } from "../modules/auth/auth.types";

const requireRole = (allowedRole: StudentRole) => {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			await request.jwtVerify();

			const student = await prisma.student.findUnique({
				where: { id: request.user.sub },
				select: { role: true },
			});
			if (!student || student.role !== allowedRole) {
				return reply.code(403).send({ message: "Você não tem permissão para acessar este recurso." });
			}
			return;
		} catch(e) {
            console.error("Role verification error:", e);
			return reply.code(401).send({ message: "Sessão inválida ou expirada." });
		}
	};
};

export { requireRole };