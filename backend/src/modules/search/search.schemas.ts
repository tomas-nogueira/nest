import { z } from "zod";

const searchTypeSchema = z.enum(["top", "posts", "users", "media", "courses"]);

const searchQuerySchema = z.object({
	q: z.string().trim().max(80, "A busca deve ter no maximo 80 caracteres.").default(""),
	type: searchTypeSchema.default("top"),
	limit: z.coerce.number().int().positive().max(30).default(20),
});

const suggestionsQuerySchema = z.object({
	q: z.string().trim().max(80, "A busca deve ter no maximo 80 caracteres.").default(""),
	limit: z.coerce.number().int().positive().max(12).default(8),
});

export { searchQuerySchema, suggestionsQuerySchema };
export type SearchType = z.infer<typeof searchTypeSchema>;

