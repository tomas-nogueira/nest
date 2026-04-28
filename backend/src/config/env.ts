import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	PORT: z.coerce.number().int().positive().default(3333),
	DATABASE_URL: z.string().min(1),
	JWT_SECRET: z.string().min(1).default('nest-backup-dev-secret'),
});

const env = envSchema.parse(process.env);

export { env };