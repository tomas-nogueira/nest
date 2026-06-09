import path from "node:path";
import { FileValidationError } from "../errors/file.errors";

const allowedMimeTypesByExtension: Record<string, string[]> = {
	jpg: ["image/jpeg"],
	jpeg: ["image/jpeg"],
	png: ["image/png"],
	webp: ["image/webp"],
	pdf: ["application/pdf"],
};

const getSafeOriginalName = (originalName: string) => {
	const baseName = path.basename(originalName).replaceAll("\0", "").trim();

	if (!baseName) {
		throw new FileValidationError("Nome do arquivo inválido.");
	}

	return baseName;
};

const getAllowedExtension = (originalName: string) => {
	const extension = path.extname(originalName).replace(".", "").toLowerCase();

	if (!extension || !allowedMimeTypesByExtension[extension]) {
		throw new FileValidationError("Formato de arquivo não permitido.");
	}

	return extension;
};

const validateMimeType = (extension: string, mimeType: string) => {
	const allowedMimeTypes = allowedMimeTypesByExtension[extension];

	if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
		throw new FileValidationError("Tipo MIME incompatível com o arquivo enviado.");
	}
};

const hasPdfSignature = (buffer: Buffer) => buffer.subarray(0, 5).equals(Buffer.from("%PDF-"));
const hasPngSignature = (buffer: Buffer) =>
	buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
const hasJpegSignature = (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
const hasWebpSignature = (buffer: Buffer) =>
	buffer.length >= 12 &&
	buffer.subarray(0, 4).equals(Buffer.from("RIFF")) &&
	buffer.subarray(8, 12).equals(Buffer.from("WEBP"));

const validateFileSignature = (extension: string, buffer: Buffer) => {
	const isValid =
		(extension === "pdf" && hasPdfSignature(buffer)) ||
		(extension === "png" && hasPngSignature(buffer)) ||
		(extension === "webp" && hasWebpSignature(buffer)) ||
		((extension === "jpg" || extension === "jpeg") && hasJpegSignature(buffer));

	if (!isValid) {
		throw new FileValidationError("O conteúdo do arquivo não corresponde ao formato informado.");
	}
};

const validateUploadedFile = (input: { originalName: string; mimeType: string; buffer: Buffer }) => {
	if (input.buffer.length === 0) {
		throw new FileValidationError("O arquivo enviado está vazio.");
	}

	const originalName = getSafeOriginalName(input.originalName);
	const extension = getAllowedExtension(originalName);

	validateMimeType(extension, input.mimeType);
	validateFileSignature(extension, input.buffer);

	return {
		extension,
		originalName,
	};
};

export { allowedMimeTypesByExtension, validateUploadedFile };
