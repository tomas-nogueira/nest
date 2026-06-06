import { randomUUID } from "node:crypto";
import type { StoredFileEntity } from "./domain/file.entity";
import type { StorageProvider } from "./domain/storage-provider";
import { FileNotFoundError } from "./errors/file.errors";
import { createStoredFile, deleteStoredFileById, findStoredFileById } from "./repositories/stored-files.repository";
import { storageProvider } from "./infrastructure/storage/storage-provider.factory";
import { validateUploadedFile } from "./validation/file-upload.validation";

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

const removeFile = async (id: string, provider = storageProvider) => {
	const file = await findStoredFileById(id);

	if (!file) {
		throw new FileNotFoundError();
	}

	await provider.remove(file.storedName);
	await deleteStoredFileById(id);
};

export { getFileById, removeFile, uploadFile };
