import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { env } from "../../config/env";
import type { JwtPayload } from "../auth/auth.types";
import { FileNotFoundError, FileValidationError } from "./errors/file.errors";
import { getAuthorizedFileById, getAuthorizedFileContent, removeFile, uploadFile } from "./files.service";
import { fileParamsSchema } from "./files.schemas";

const handleFileError = (error: unknown, reply: FastifyReply) => {
	if (error instanceof ZodError) {
		const message = error.issues.map((issue) => issue.message).join(" ");

		return reply.code(400).send({ message: message || "Verifique os dados informados." });
	}

	if (error instanceof FileValidationError) {
		return reply.code(400).send({ message: error.message });
	}

	if (error instanceof FileNotFoundError) {
		return reply.code(404).send({ message: error.message });
	}

	if (error instanceof Error && error.message === "Voce nao tem permissao para acessar este arquivo.") {
		return reply.code(403).send({ message: error.message });
	}

	if (error instanceof Error && error.message === "Usuario nao encontrado.") {
		return reply.code(404).send({ message: error.message });
	}

	if (error instanceof Error && "code" in error && error.code === "FST_REQ_FILE_TOO_LARGE") {
		return reply.code(413).send({ message: "O arquivo enviado excede o tamanho máximo permitido." });
	}

	throw error;
};

const upload = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();

		const multipartFile = await request.file();

		if (!multipartFile) {
			return reply.code(400).send({ message: "Envie um arquivo para continuar." });
		}

		const buffer = await multipartFile.toBuffer();

		if (buffer.length > env.MAX_UPLOAD_FILE_SIZE_BYTES) {
			return reply.code(413).send({ message: "O arquivo enviado excede o tamanho máximo permitido." });
		}

		const file = await uploadFile({
			buffer,
			originalName: multipartFile.filename,
			mimeType: multipartFile.mimetype,
		});

		request.log.info({ fileId: file.id, mimeType: file.mimeType, size: file.size }, "Arquivo armazenado com sucesso");

		return reply.code(201).send({ file });
	} catch (error) {
		request.log.warn({ error }, "Falha ao processar upload de arquivo");

		return handleFileError(error, reply);
	}
};

const show = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;

		const params = fileParamsSchema.parse(request.params);
		const file = await getAuthorizedFileById(params.id, payload.sub);

		return reply.send({ file });
	} catch (error) {
		return handleFileError(error, reply);
	}
};

const destroy = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();

		const params = fileParamsSchema.parse(request.params);
		await removeFile(params.id);

		return reply.code(204).send();
	} catch (error) {
		return handleFileError(error, reply);
	}
};

const download = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const params = fileParamsSchema.parse(request.params);
		const { file, buffer } = await getAuthorizedFileContent(params.id, payload.sub);

		return reply
			.header("Content-Type", file.mimeType)
			.header("Content-Length", buffer.length)
			.header("Content-Disposition", `attachment; filename="${encodeURIComponent(file.originalName)}"`)
			.send(buffer);
	} catch (error) {
		return handleFileError(error, reply);
	}
};

const preview = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const params = fileParamsSchema.parse(request.params);
		const { file, buffer } = await getAuthorizedFileContent(params.id, payload.sub);

		return reply
			.header("Content-Type", file.mimeType)
			.header("Content-Length", buffer.length)
			.header("Content-Disposition", `inline; filename="${encodeURIComponent(file.originalName)}"`)
			.send(buffer);
	} catch (error) {
		return handleFileError(error, reply);
	}
};

export { destroy, download, preview, show, upload };
