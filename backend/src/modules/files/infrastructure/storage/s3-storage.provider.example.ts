import type { SaveFileInput, SavedFile, StorageProvider } from "../../domain/storage-provider";

class S3StorageProvider implements StorageProvider {
	async save(_input: SaveFileInput): Promise<SavedFile> {
		throw new Error("S3StorageProvider ainda nao implementado.");
	}

	async remove(_storedName: string) {
		throw new Error("S3StorageProvider ainda nao implementado.");
	}

	async getBuffer(_storedName: string): Promise<Buffer> {
		throw new Error("S3StorageProvider ainda nao implementado.");
	}

	getUrl(_storedName: string): string {
		throw new Error("S3StorageProvider ainda nao implementado.");
	}
}

export { S3StorageProvider };
