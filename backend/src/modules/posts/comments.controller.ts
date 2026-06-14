import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { env } from "../../config/env";
import type { JwtPayload } from "../auth/auth.types";
import { FileValidationError } from "../files/errors/file.errors";
import { PostAuthorizationError, PostNotFoundError, PostValidationError } from "./posts.errors";
import {
	createComment,
	deleteComment,
	listComments,
	updateComment,
	voteOnComment,
	type UploadedCommentFile,
} from "./comments.service";
import {
	commentParamsSchema,
	commentVoteSchema,
	createCommentBodySchema,
	listCommentsQuerySchema,
	updateCommentBodySchema,
} from "./comments.schemas";

type MultipartFieldPart = {
	type: "field";
	fieldname: string;
	value: unknown;
};

type MultipartFilePart = {
	type: "file";
	fieldname: string;
	filename: string;
	mimetype: string;
	toBuffer(): Promise<Buffer>;
};

type MultipartPart = MultipartFieldPart | MultipartFilePart;

const formatValidationError = (error: ZodError) => {
	return error.issues.map((issue) => issue.message).join(" ") || "Verifique os dados informados.";
};

const handleCommentError = (error: unknown, reply: FastifyReply) => {
	if (error instanceof ZodError) {
		return reply.code(400).send({ message: formatValidationError(error) });
	}

	if (error instanceof PostValidationError) {
		return reply.code(400).send({ message: error.message });
	}

	if (error instanceof FileValidationError) {
		return reply.code(400).send({ message: error.message });
	}

	if (error instanceof PostAuthorizationError) {
		return reply.code(403).send({ message: error.message });
	}

	if (error instanceof PostNotFoundError) {
		return reply.code(404).send({ message: error.message });
	}

	if (error instanceof Error && error.message === "Usuario nao encontrado.") {
		return reply.code(404).send({ message: error.message });
	}

	if (error instanceof Error && "code" in error && error.code === "FST_REQ_FILE_TOO_LARGE") {
		return reply.code(413).send({ message: "O arquivo enviado excede o tamanho maximo permitido." });
	}

	throw error;
};

const parseCreateCommentMultipart = async (request: FastifyRequest) => {
	const fields: Record<string, unknown> = {};
	const files: UploadedCommentFile[] = [];

	for await (const part of request.parts() as AsyncIterable<MultipartPart>) {
		if (part.type === "field") {
			fields[part.fieldname] = part.value;
			continue;
		}

		if (part.fieldname !== "attachments") {
			throw new PostValidationError("Campo de arquivo invalido.");
		}

		const buffer = await part.toBuffer();

		if (buffer.length > env.MAX_UPLOAD_FILE_SIZE_BYTES) {
			throw new PostValidationError("O arquivo enviado excede o tamanho maximo permitido.");
		}

		files.push({
			buffer,
			originalName: part.filename,
			mimeType: part.mimetype,
		});
	}

	return {
		body: createCommentBodySchema.parse(fields),
		files,
	};
};

const index = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const params = commentParamsSchema.parse(request.params);
		const query = listCommentsQuerySchema.parse(request.query);
		const response = await listComments({
			studentId: payload.sub,
			postId: params.id,
			page: query.page,
			limit: query.limit,
		});

		return reply.send(response);
	} catch (error) {
		return handleCommentError(error, reply);
	}
};

const store = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const params = commentParamsSchema.parse(request.params);
		const { body, files } = request.isMultipart()
			? await parseCreateCommentMultipart(request)
			: { body: createCommentBodySchema.parse(request.body), files: [] };
		const comment = await createComment({
			studentId: payload.sub,
			postId: params.id,
			parentId: body.parentId,
			content: body.content,
			files,
		});

		return reply.code(201).send({ comment });
	} catch (error) {
		return handleCommentError(error, reply);
	}
};

const update = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const params = commentParamsSchema.parse(request.params);
		const body = updateCommentBodySchema.parse(request.body);

		if (!params.commentId) {
			return reply.code(400).send({ message: "Identificador de comentario invalido." });
		}

		const comment = await updateComment({
			studentId: payload.sub,
			postId: params.id,
			commentId: params.commentId,
			content: body.content,
		});

		return reply.send({ comment });
	} catch (error) {
		return handleCommentError(error, reply);
	}
};

const destroy = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const params = commentParamsSchema.parse(request.params);

		if (!params.commentId) {
			return reply.code(400).send({ message: "Identificador de comentario invalido." });
		}

		const result = await deleteComment({
			studentId: payload.sub,
			postId: params.id,
			commentId: params.commentId,
		});

		return reply.send(result);
	} catch (error) {
		return handleCommentError(error, reply);
	}
};

const vote = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const params = commentParamsSchema.parse(request.params);
		const body = commentVoteSchema.parse(request.body);

		if (!params.commentId) {
			return reply.code(400).send({ message: "Identificador de comentario invalido." });
		}

		const votes = await voteOnComment({
			studentId: payload.sub,
			postId: params.id,
			commentId: params.commentId,
			voteType: body.voteType,
		});

		return reply.send({ votes });
	} catch (error) {
		return handleCommentError(error, reply);
	}
};

export { destroy, index, store, update, vote };
