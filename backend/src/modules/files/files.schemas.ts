import { z } from "zod";

const fileParamsSchema = z.object({
	id: z.uuid("Identificador do arquivo inválido."),
});

export { fileParamsSchema };
