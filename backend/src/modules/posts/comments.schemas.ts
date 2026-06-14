import { z } from "zod";

const commentParamsSchema = z.object({
	id: z.string().uuid("Identificador de post invalido."),
	commentId: z.string().uuid("Identificador de comentario invalido.").optional(),
});

const listCommentsQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(50).default(20),
});

const commentContentSchema = z
	.string()
	.trim()
	.max(4000, "O comentario deve ter no maximo 4000 caracteres.");

const createCommentBodySchema = z.object({
	content: commentContentSchema.default(""),
	parentId: z.string().uuid("Comentario pai invalido.").optional(),
});

const updateCommentBodySchema = z.object({
	content: commentContentSchema,
});

const commentVoteSchema = z.object({
	voteType: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

export {
	commentParamsSchema,
	commentVoteSchema,
	createCommentBodySchema,
	listCommentsQuerySchema,
	updateCommentBodySchema,
};
