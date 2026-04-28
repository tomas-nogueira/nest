import { z } from "zod";

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});

const registerSchema = z.object({
	name: z.string().min(2),
	email: z.string().email(),
	password: z.string().min(6),
	phone: z.string().min(8).optional(),
});

const authUserSelect = {
	id: true,
	name: true,
	email: true,
	phone: true,
} as const;

export { authUserSelect, loginSchema, registerSchema };