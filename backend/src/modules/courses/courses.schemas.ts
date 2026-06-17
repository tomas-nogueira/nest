import { z } from 'zod'

const courseQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().trim().max(80, 'Pesquise com ate 80 caracteres.').optional(),
  includeSubjects: z.enum(['true', 'false']).optional(),
})

const courseProfileListQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Pagina invalida.').default(1),
  limit: z.coerce.number().int().min(1, 'Limite invalido.').max(50, 'Use ate 50 itens por pagina.').default(10),
})

const courseParamsSchema = z.object({
  id: z.string().uuid('Curso invalido.'),
})

const createCourseSchema = z.object({
  name: z.string().trim().min(2, 'O nome do curso deve ter no minimo 2 caracteres.').max(120, 'O nome do curso deve ter ate 120 caracteres.'),
  isActive: z.boolean().optional(),
})

const updateCourseSchema = z.object({
  name: z.string().trim().min(2, 'O nome do curso deve ter no minimo 2 caracteres.').max(120, 'O nome do curso deve ter ate 120 caracteres.').optional(),
  bio: z.string().trim().max(280, 'A bio do curso deve ter ate 280 caracteres.').optional(),
  isActive: z.boolean().optional(),
})

const updateCourseProfileSchema = z.object({
  name: z.string().trim().min(2, 'O nome do curso deve ter no minimo 2 caracteres.').max(120, 'O nome do curso deve ter ate 120 caracteres.'),
  bio: z.string().trim().max(280, 'A bio do curso deve ter ate 280 caracteres.').optional(),
})

export { courseParamsSchema, courseProfileListQuerySchema, courseQuerySchema, createCourseSchema, updateCourseProfileSchema, updateCourseSchema }
