import { randomUUID } from "node:crypto";
import type { StoredFileEntity } from "./domain/file.entity";
import type { StorageProvider } from "./domain/storage-provider";
import { FileNotFoundError } from "./errors/file.errors";
import {
	createStoredFile,
	deleteStoredFileById,
	findStoredFileAttachmentCourses,
	findStoredFileById,
} from "./repositories/stored-files.repository";
import { storageProvider } from "./infrastructure/storage/storage-provider.factory";
import { validateUploadedFile } from "./validation/file-upload.validation";
import { prisma } from "../../lib/prisma";

type UploadFileInput = {
	buffer: Buffer;
	originalName: string;
	mimeType: string;
};

const mapStoredFileResponse = (file: StoredFileEntity, provider: StorageProvider) => ({
	id: file.id,
	originalName: file.originalName,
	storedName: file.storedName,
	path: file.path,
	url: provider.getUrl(file.storedName),
	mimeType: file.mimeType,
	size: file.size,
	createdAt: file.createdAt,
});

const uploadFile = async (input: UploadFileInput, provider = storageProvider) => {
	const { extension, originalName } = validateUploadedFile(input);
	const storedName = `${randomUUID()}.${extension}`;
	const savedFile = await provider.save({
		buffer: input.buffer,
		storedName,
	});

	try {
		const file = await createStoredFile({
			originalName,
			storedName,
			path: savedFile.path,
			mimeType: input.mimeType,
			size: input.buffer.length,
		});

		return mapStoredFileResponse(file, provider);
	} catch (error) {
		await provider.remove(storedName);
		throw error;
	}
};

const getFileById = async (id: string, provider = storageProvider) => {
	const file = await findStoredFileById(id);

	if (!file) {
		throw new FileNotFoundError();
	}

	return mapStoredFileResponse(file, provider);
};

const ensureFileAccess = async (fileId: string, studentId: string) => {
	const student = await prisma.student.findUnique({
		where: { id: studentId },
		select: { id: true },
	});

	if (!student) {
		throw new Error("Usuario nao encontrado.");
	}

	const attachmentCourses = await findStoredFileAttachmentCourses(fileId);

	if (attachmentCourses.length === 0) {
		return;
	}

	return;
};

const getAuthorizedFileById = async (id: string, studentId: string, provider = storageProvider) => {
	const file = await getFileById(id, provider);
	await ensureFileAccess(id, studentId);

	return file;
};

const getAuthorizedFileContent = async (id: string, studentId: string, provider = storageProvider) => {
	const file = await getFileById(id, provider);
	await ensureFileAccess(id, studentId);
	const buffer = await provider.getBuffer(file.storedName);

	return {
		file,
		buffer,
	};
};

const removeFile = async (id: string, provider = storageProvider) => {
	const file = await findStoredFileById(id);

	if (!file) {
		throw new FileNotFoundError();
	}

	await provider.remove(file.storedName);
	await deleteStoredFileById(id);
};

const removeStoredFilesFromProvider = async (storedNames: string[], provider = storageProvider) => {
	return Promise.allSettled(storedNames.map((storedName) => provider.remove(storedName)));
};

export { getAuthorizedFileById, getAuthorizedFileContent, getFileById, removeFile, removeStoredFilesFromProvider, uploadFile };
