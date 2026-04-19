import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	PORT: z.coerce.number().int().positive().default(3333),
	DATABASE_URL: z.string().min(1),
});

const env = envSchema.parse(process.env);

export { env };