import { z } from "zod";

const exploreQuerySchema = z.object({
	limit: z.coerce.number().int().positive().max(12).default(6),
});

export { exploreQuerySchema };
