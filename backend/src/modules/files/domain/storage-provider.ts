type SaveFileInput = {
	buffer: Buffer;
	storedName: string;
};

type SavedFile = {
	path: string;
};

type StorageProvider = {
	save(input: SaveFileInput): Promise<SavedFile>;
	remove(storedName: string): Promise<void>;
	getBuffer(storedName: string): Promise<Buffer>;
	getUrl(storedName: string): string;
};

export type { SaveFileInput, SavedFile, StorageProvider };
