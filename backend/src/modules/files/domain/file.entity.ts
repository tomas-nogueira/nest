type StoredFileEntity = {
	id: string;
	originalName: string;
	storedName: string;
	path: string;
	mimeType: string;
	size: number;
	createdAt: Date;
};

export type { StoredFileEntity };
