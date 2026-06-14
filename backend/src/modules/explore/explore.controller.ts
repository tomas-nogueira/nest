import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import type { JwtPayload } from "../auth/auth.types";
import { exploreQuerySchema } from "./explore.schemas";
import { listExplore } from "./explore.service";

const formatValidationError = (error: ZodError) => {
	return error.issues.map((issue) => issue.message).join(" ") || "Verifique os dados informados.";
};

const handleExploreError = (error: unknown, reply: FastifyReply) => {
	if (error instanceof ZodError) {
		return reply.code(400).send({ message: formatValidationError(error) });
	}

	if (error instanceof Error && error.message === "Usuário não encontrado.") {
		return reply.code(404).send({ message: error.message });
	}

	throw error;
};

const index = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const query = exploreQuerySchema.parse(request.query);
		const response = await listExplore({
			studentId: payload.sub,
			limit: query.limit,
		});

		return reply.send(response);
	} catch (error) {
		return handleExploreError(error, reply);
	}
};

export { index };
