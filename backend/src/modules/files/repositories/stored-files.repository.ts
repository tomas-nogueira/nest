import { prisma } from "../../../lib/prisma";
import type { StoredFileEntity } from "../domain/file.entity";

type CreateStoredFileInput = {
	originalName: string;
	storedName: string;
	path: string;
	mimeType: string;
	size: number;
};

const storedFileSelect = {
	id: true,
	originalName: true,
	storedName: true,
	path: true,
	mimeType: true,
	size: true,
	createdAt: true,
};

const createStoredFile = async (input: CreateStoredFileInput): Promise<StoredFileEntity> => {
	return prisma.storedFile.create({
		data: input,
		select: storedFileSelect,
	});
};

const findStoredFileById = async (id: string): Promise<StoredFileEntity | null> => {
	return prisma.storedFile.findUnique({
		where: { id },
		select: storedFileSelect,
	});
};

const deleteStoredFileById = async (id: string): Promise<StoredFileEntity> => {
	return prisma.storedFile.delete({
		where: { id },
		select: storedFileSelect,
	});
};

const findStoredFileAttachmentCourses = async (id: string) => {
	return prisma.attachment.findMany({
		where: { storedFileId: id },
		select: {
			id: true,
		},
	});
};

export { createStoredFile, deleteStoredFileById, findStoredFileAttachmentCourses, findStoredFileById };
export type { CreateStoredFileInput };
