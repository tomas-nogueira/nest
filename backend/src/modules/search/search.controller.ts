import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import type { JwtPayload } from "../auth/auth.types";
import { getSuggestions, searchAll } from "./search.service";
import { searchQuerySchema, suggestionsQuerySchema } from "./search.schemas";

const formatValidationError = (error: ZodError) => {
	return error.issues.map((issue) => issue.message).join(" ") || "Verifique os dados informados.";
};

const handleSearchError = (error: unknown, reply: FastifyReply) => {
	if (error instanceof ZodError) {
		return reply.code(400).send({ message: formatValidationError(error) });
	}

	throw error;
};

const index = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const query = searchQuerySchema.parse(request.query);
		const response = await searchAll({
			studentId: payload.sub,
			query: query.q,
			type: query.type,
			limit: query.limit,
		});

		return reply.send(response);
	} catch (error) {
		return handleSearchError(error, reply);
	}
};

const suggestions = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const query = suggestionsQuerySchema.parse(request.query);
		const response = await getSuggestions({
			query: query.q,
			limit: query.limit,
		});

		return reply.send(response);
	} catch (error) {
		return handleSearchError(error, reply);
	}
};

export { index, suggestions };

