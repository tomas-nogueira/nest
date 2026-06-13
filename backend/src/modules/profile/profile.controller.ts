import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { env } from "../../config/env";
import type { JwtPayload } from "../auth/auth.types";
import { FileValidationError } from "../files/errors/file.errors";
import {
	getOwnProfile,
	getProfile,
	getProfilePosts,
	getProfileVotes,
	updateProfile,
	type UploadedAvatarFile,
} from "./profile.service";
import { paginationQuerySchema, profileParamsSchema, profileUpdateSchema, profileVotesQuerySchema } from "./profile.schemas";

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

const handleProfileError = (error: unknown, reply: FastifyReply) => {
	if (error instanceof ZodError) {
		return reply.code(400).send({ message: formatValidationError(error) });
	}

	if (error instanceof FileValidationError) {
		return reply.code(400).send({ message: error.message });
	}

	if (error instanceof Error && error.message === "Usuario nao encontrado.") {
		return reply.code(404).send({ message: error.message });
	}

	if (error instanceof Error && error.message === "Envie uma imagem valida para o avatar.") {
		return reply.code(400).send({ message: error.message });
	}

	if (error instanceof Error && "code" in error && error.code === "FST_REQ_FILE_TOO_LARGE") {
		return reply.code(413).send({ message: "O arquivo enviado excede o tamanho maximo permitido." });
	}

	throw error;
};

const parseProfileMultipart = async (request: FastifyRequest) => {
	const fields: Record<string, unknown> = {};
	let avatar: UploadedAvatarFile | undefined;

	for await (const part of request.parts() as AsyncIterable<MultipartPart>) {
		if (part.type === "field") {
			fields[part.fieldname] = part.value;
			continue;
		}

		if (part.fieldname !== "avatar") {
			throw new FileValidationError("Campo de arquivo invalido.");
		}

		const buffer = await part.toBuffer();

		if (buffer.length > env.MAX_UPLOAD_FILE_SIZE_BYTES) {
			throw new FileValidationError("O arquivo enviado excede o tamanho maximo permitido.");
		}

		avatar = {
			buffer,
			originalName: part.filename,
			mimeType: part.mimetype,
		};
	}

	return {
		body: profileUpdateSchema.parse(fields),
		avatar,
	};
};

const show = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const profile = await getOwnProfile(payload.sub);

		return reply.send(profile);
	} catch (error) {
		return handleProfileError(error, reply);
	}
};

const showByStudent = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const params = profileParamsSchema.parse(request.params);
		const profile = await getProfile(params.studentId);

		return reply.send(profile);
	} catch (error) {
		return handleProfileError(error, reply);
	}
};

const posts = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const params = profileParamsSchema.parse(request.params);
		const query = paginationQuerySchema.parse(request.query);
		const response = await getProfilePosts({
			currentStudentId: payload.sub,
			profileStudentId: params.studentId,
			page: query.page,
			limit: query.limit,
		});

		return reply.send(response);
	} catch (error) {
		return handleProfileError(error, reply);
	}
};

const votes = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const params = profileParamsSchema.parse(request.params);
		const query = profileVotesQuerySchema.parse(request.query);
		const response = await getProfileVotes({
			currentStudentId: payload.sub,
			profileStudentId: params.studentId,
			page: query.page,
			limit: query.limit,
			voteType: query.voteType,
		});

		return reply.send(response);
	} catch (error) {
		return handleProfileError(error, reply);
	}
};

const update = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const { body, avatar } = await parseProfileMultipart(request);
		const user = await updateProfile({
			studentId: payload.sub,
			name: body.name,
			bio: body.bio,
			password: body.password,
			avatar,
		});

		return reply.send({ user });
	} catch (error) {
		return handleProfileError(error, reply);
	}
};

export { posts, show, showByStudent, update, votes };
