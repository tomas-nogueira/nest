import type { FastifyReply, FastifyRequest } from "fastify";
import { countStudents } from "./students.service";

const getStudentsCount = async (_request: FastifyRequest, reply: FastifyReply) => {
	const count = await countStudents();

	return reply.send({ count });
};

export { getStudentsCount };