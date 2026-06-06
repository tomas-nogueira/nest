class FileValidationError extends Error {}

class FileNotFoundError extends Error {
	constructor() {
		super("Arquivo não encontrado.");
	}
}

export { FileValidationError, FileNotFoundError };
