import { z } from "zod";
import { env } from "../../config/env";

const postParamsSchema = z.object({
	id: z.string().uuid("Identificador de post invalido."),
});

const listPostsQuerySchema = z.object({
	subjectId: z.string().uuid("Identificador de disciplina invalido.").optional(),
	courseId: z.string().uuid("Identificador de curso invalido.").optional(),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(50).default(20),
});

const voteSchema = z.object({
	voteType: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

const allowedContentNodeTypes = new Set([
	"doc",
	"paragraph",
	"text",
	"heading",
	"bulletList",
	"orderedList",
	"listItem",
	"blockquote",
	"codeBlock",
	"hardBreak",
]);

const allowedMarkTypes = new Set(["bold", "italic", "underline", "strike", "code", "link"]);
const allowedLinkProtocols = ["http:", "https:", "mailto:"];

type RichTextNode = {
	type?: unknown;
	text?: unknown;
	attrs?: unknown;
	marks?: unknown;
	content?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const validateLinkHref = (href: unknown) => {
	if (typeof href !== "string" || href.length > 2048) {
		return false;
	}

	try {
		const url = new URL(href);
		return allowedLinkProtocols.includes(url.protocol);
	} catch {
		return href.startsWith("/") && !href.startsWith("//");
	}
};

const validateRichTextNode = (node: unknown, depth = 0): boolean => {
	if (depth > 30 || !isRecord(node)) {
		return false;
	}

	const richNode = node as RichTextNode;

	if (typeof richNode.type !== "string" || !allowedContentNodeTypes.has(richNode.type)) {
		return false;
	}

	if (richNode.text !== undefined && typeof richNode.text !== "string") {
		return false;
	}

	if (richNode.type === "heading") {
		if (!isRecord(richNode.attrs) || ![1, 2, 3].includes(Number(richNode.attrs.level))) {
			return false;
		}
	}

	if (richNode.marks !== undefined) {
		if (!Array.isArray(richNode.marks)) {
			return false;
		}

		for (const mark of richNode.marks) {
			if (!isRecord(mark) || typeof mark.type !== "string" || !allowedMarkTypes.has(mark.type)) {
				return false;
			}

			if (mark.type === "link") {
				if (!isRecord(mark.attrs) || !validateLinkHref(mark.attrs.href)) {
					return false;
				}
			}
		}
	}

	if (richNode.content !== undefined) {
		if (!Array.isArray(richNode.content)) {
			return false;
		}

		return richNode.content.every((child) => validateRichTextNode(child, depth + 1));
	}

	return true;
};

const getRichTextStats = (node: unknown): { nodes: number; textChars: number } => {
	if (!isRecord(node)) {
		return { nodes: 0, textChars: 0 };
	}

	const richNode = node as RichTextNode;
	const currentTextChars = typeof richNode.text === "string" ? richNode.text.length : 0;

	if (!Array.isArray(richNode.content)) {
		return { nodes: 1, textChars: currentTextChars };
	}

	return richNode.content.reduce(
		(stats, child) => {
			const childStats = getRichTextStats(child);
			return {
				nodes: stats.nodes + childStats.nodes,
				textChars: stats.textChars + childStats.textChars,
			};
		},
		{ nodes: 1, textChars: currentTextChars },
	);
};

const validateRichTextSize = (value: unknown) => {
	const jsonSize = Buffer.byteLength(JSON.stringify(value), "utf8");

	if (jsonSize > env.MAX_POST_CONTENT_JSON_BYTES) {
		return false;
	}

	const stats = getRichTextStats(value);
	return stats.nodes <= env.MAX_POST_CONTENT_NODES && stats.textChars <= env.MAX_POST_CONTENT_TEXT_CHARS;
};

const richTextContentSchema = z
	.unknown()
	.refine((value) => validateRichTextNode(value), "Conteudo do post invalido.")
	.refine(
		(value) => validateRichTextSize(value),
		"Conteudo do post muito grande. Envie materiais extensos como anexo.",
	);

const postTitleSchema = z.string().trim().min(3, "Informe um titulo com pelo menos 3 caracteres.").max(180, "O titulo deve ter no maximo 180 caracteres.");
const postSubtitleSchema = z.string().trim().max(300, "O subtitulo deve ter no maximo 300 caracteres.").optional();

const createPostBodySchema = z.object({
	title: postTitleSchema,
	subtitle: postSubtitleSchema,
	subjectId: z.string().uuid("Selecione uma disciplina valida."),
	content: richTextContentSchema,
});

const updatePostBodySchema = z.object({
	title: postTitleSchema,
	subtitle: postSubtitleSchema,
	subjectId: z.string().uuid("Selecione uma disciplina valida."),
	content: richTextContentSchema,
});

export {
	createPostBodySchema,
	listPostsQuerySchema,
	postParamsSchema,
	richTextContentSchema,
	updatePostBodySchema,
	voteSchema,
};
export type { RichTextNode };
