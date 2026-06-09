import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { env } from "../../config/env";
import type { Prisma } from "../../../generated/prisma/client";
import type { JwtPayload } from "../auth/auth.types";
import {
	PostAuthorizationError,
	PostNotFoundError,
	PostValidationError,
	StudentCourseRequiredError,
} from "./posts.errors";
import {
	createPost,
	deletePost,
	listCourseSubjects,
	listPostFilters,
	listPosts,
	updatePost,
	voteOnPost,
	type UploadedPostFile,
} from "./posts.service";
import {
	createPostBodySchema,
	listPostsQuerySchema,
	postParamsSchema,
	updatePostBodySchema,
	voteSchema,
} from "./posts.schemas";

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

const parseJsonField = (value: unknown) => {
	if (typeof value !== "string") {
		throw new PostValidationError("Conteudo do post invalido.");
	}

	try {
		return JSON.parse(value) as unknown;
	} catch {
		throw new PostValidationError("Conteudo do post invalido.");
	}
};

const parseCreatePostMultipart = async (request: FastifyRequest) => {
	const fields: Record<string, unknown> = {};
	const files: UploadedPostFile[] = [];

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

		const body = createPostBodySchema.parse({
			title: fields.title,
			subtitle: fields.subtitle,
			subjectId: fields.subjectId,
			content: parseJsonField(fields.content),
	});

	return {
		body,
		files,
	};
};

const formatValidationError = (error: ZodError) => {
	return error.issues.map((issue) => issue.message).join(" ") || "Verifique os dados informados.";
};

const handlePostError = (error: unknown, reply: FastifyReply) => {
	if (error instanceof ZodError) {
		return reply.code(400).send({ message: formatValidationError(error) });
	}

	if (error instanceof PostValidationError || error instanceof StudentCourseRequiredError) {
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

const subjects = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const items = await listCourseSubjects(payload.sub);

		return reply.send({ subjects: items });
	} catch (error) {
		return handlePostError(error, reply);
	}
};

const filters = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const response = await listPostFilters(payload.sub);

		return reply.send(response);
	} catch (error) {
		return handlePostError(error, reply);
	}
};

const index = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const query = listPostsQuerySchema.parse(request.query);
		const response = await listPosts({
			studentId: payload.sub,
			...query,
		});

		return reply.send(response);
	} catch (error) {
		return handlePostError(error, reply);
	}
};

const store = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const { body, files } = await parseCreatePostMultipart(request);
		const post = await createPost({
			studentId: payload.sub,
			title: body.title,
			subtitle: body.subtitle,
			subjectId: body.subjectId,
			content: body.content as Prisma.InputJsonValue,
			files,
		});

		return reply.code(201).send({ post });
	} catch (error) {
		request.log.warn({ error }, "Falha ao criar post academico");
		return handlePostError(error, reply);
	}
};

const vote = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const params = postParamsSchema.parse(request.params);
		const body = voteSchema.parse(request.body);
		const votes = await voteOnPost({
			studentId: payload.sub,
			postId: params.id,
			voteType: body.voteType,
		});

		return reply.send({ votes });
	} catch (error) {
		return handlePostError(error, reply);
	}
};

const update = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const params = postParamsSchema.parse(request.params);
		const body = updatePostBodySchema.parse(request.body);
		const post = await updatePost({
			studentId: payload.sub,
			postId: params.id,
			title: body.title,
			subtitle: body.subtitle,
			subjectId: body.subjectId,
			content: body.content as Prisma.InputJsonValue,
		});

		return reply.send({ post });
	} catch (error) {
		return handlePostError(error, reply);
	}
};

const destroy = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const params = postParamsSchema.parse(request.params);
		await deletePost({
			studentId: payload.sub,
			postId: params.id,
		});

		return reply.code(204).send();
	} catch (error) {
		return handlePostError(error, reply);
	}
};

export { destroy, filters, index, store, subjects, update, vote };
