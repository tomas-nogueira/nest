import { z } from "zod";

const profileParamsSchema = z.object({
	studentId: z.uuid("Identificador do usuario invalido."),
});

const paginationQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(20).default(10),
});

const profileVotesQuerySchema = paginationQuerySchema.extend({
	voteType: z
		.enum(["1", "-1"])
		.optional()
		.transform((value) => (value ? (Number(value) as 1 | -1) : undefined)),
});

const emptyToUndefined = (value: unknown) => {
	if (typeof value === "string" && value.trim() === "") {
		return undefined;
	}

	return value;
};

const profileUpdateSchema = z
	.object({
		name: z.string().trim().min(2, "O nome deve ter no minimo 2 caracteres.").max(120, "O nome deve ter no maximo 120 caracteres."),
		bio: z.preprocess(
			emptyToUndefined,
			z.string().trim().max(280, "A bio deve ter no maximo 280 caracteres.").optional(),
		),
		password: z.preprocess(emptyToUndefined, z.string().min(6, "A senha deve ter no minimo 6 caracteres.").optional()),
		passwordConfirmation: z.preprocess(emptyToUndefined, z.string().optional()),
	})
	.superRefine((data, context) => {
		if (!data.password) {
			return;
		}

		if (!data.passwordConfirmation) {
			context.addIssue({
				code: "custom",
				path: ["passwordConfirmation"],
				message: "Confirme a nova senha.",
			});
			return;
		}

		if (data.password !== data.passwordConfirmation) {
			context.addIssue({
				code: "custom",
				path: ["passwordConfirmation"],
				message: "As senhas nao coincidem.",
			});
		}
	});

export { paginationQuerySchema, profileParamsSchema, profileUpdateSchema, profileVotesQuerySchema };
