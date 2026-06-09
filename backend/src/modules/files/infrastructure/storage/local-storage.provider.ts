import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SaveFileInput, StorageProvider } from "../../domain/storage-provider";

class LocalStorageProvider implements StorageProvider {
	private readonly uploadDirectory: string;

	constructor(uploadDirectory: string) {
		const projectRoot = process.cwd();
		const resolvedDirectory = path.resolve(projectRoot, uploadDirectory);
		const relativeDirectory = path.relative(projectRoot, resolvedDirectory);

		if (relativeDirectory.startsWith("..") || path.isAbsolute(relativeDirectory)) {
			throw new Error("Diretório de armazenamento local inválido.");
		}

		this.uploadDirectory = resolvedDirectory;
	}

	async save(input: SaveFileInput) {
		const targetPath = this.resolveStoredFilePath(input.storedName);

		await mkdir(this.uploadDirectory, { recursive: true });
		await writeFile(targetPath, input.buffer, { flag: "wx" });

		return {
			path: path.relative(process.cwd(), targetPath).replaceAll(path.sep, "/"),
		};
	}

	async remove(storedName: string) {
		const targetPath = this.resolveStoredFilePath(storedName);

		await rm(targetPath, { force: true });
	}

	async getBuffer(storedName: string) {
		const targetPath = this.resolveStoredFilePath(storedName);

		return readFile(targetPath);
	}

	getUrl(storedName: string) {
		return `/files/${encodeURIComponent(storedName)}`;
	}

	private resolveStoredFilePath(storedName: string) {
		if (storedName !== path.basename(storedName) || storedName.includes("\0")) {
			throw new Error("Nome armazenado inválido.");
		}

		const targetPath = path.resolve(this.uploadDirectory, storedName);
		const relativePath = path.relative(this.uploadDirectory, targetPath);

		if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
			throw new Error("Caminho de arquivo inválido.");
		}

		return targetPath;
	}
}

export { LocalStorageProvider };
