import type { SaveFileInput, SavedFile, StorageProvider } from "../../domain/storage-provider";

class S3StorageProvider implements StorageProvider {
	async save(_input: SaveFileInput): Promise<SavedFile> {
		throw new Error("S3StorageProvider ainda não implementado.");
	}

	async remove(_storedName: string) {
		throw new Error("S3StorageProvider ainda não implementado.");
	}

	getUrl(_storedName: string): string {
		throw new Error("S3StorageProvider ainda não implementado.");
	}
}

export { S3StorageProvider };
