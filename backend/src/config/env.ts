import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	PORT: z.coerce.number().int().positive().default(3333),
	DATABASE_URL: z.string().min(1),
	JWT_SECRET: z.string().min(1).default('nest-backup-dev-secret'),
	FILE_STORAGE_PROVIDER: z.enum(['local']).default('local'),
	LOCAL_STORAGE_PATH: z.string().min(1).default('storage/uploads'),
	MAX_UPLOAD_FILE_SIZE_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
	MAX_POST_ATTACHMENTS: z.coerce.number().int().positive().default(5),
	MAX_POST_CONTENT_JSON_BYTES: z.coerce.number().int().positive().default(1024 * 1024),
	MAX_POST_CONTENT_NODES: z.coerce.number().int().positive().default(5000),
	MAX_POST_CONTENT_TEXT_CHARS: z.coerce.number().int().positive().default(200000),
});

const env = envSchema.parse(process.env);

export { env };
