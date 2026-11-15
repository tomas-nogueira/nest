import { z } from 'zod'

const changelogQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Página inválida.').default(1),
  limit: z.coerce.number().int().min(1, 'Limite inválido.').max(20, 'Use até 20 itens por página.').default(5),
})

const changelogParamsSchema = z.object({
  id: z.string().uuid('Novidade inválida.'),
})

const changelogContentSchema = z.object({
  title: z.string().trim().min(1, 'O título é obrigatório.').max(120, 'O título deve ter até 120 caracteres.'),
  description: z.string().trim().min(1, 'A descrição é obrigatória.').max(2000, 'A descrição deve ter até 2000 caracteres.'),
})

const createChangelogSchema = changelogContentSchema

const updateChangelogSchema = changelogContentSchema.partial().refine(
  (value) => value.title !== undefined || value.description !== undefined,
  'Informe o título ou a descrição para atualizar.',
)

export { changelogParamsSchema, changelogQuerySchema, createChangelogSchema, updateChangelogSchema }
