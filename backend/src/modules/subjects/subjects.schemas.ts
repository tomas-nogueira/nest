import { z } from 'zod'

const subjectQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().trim().max(80, 'Pesquise com ate 80 caracteres.').optional(),
})

const subjectParamsSchema = z.object({
  id: z.string().uuid('Materia invalida.'),
})

const createSubjectSchema = z.object({
  name: z.string().trim().min(2, 'O nome da materia deve ter no minimo 2 caracteres.').max(120, 'O nome da materia deve ter ate 120 caracteres.'),
  isActive: z.boolean().optional(),
  courseIds: z.array(z.string().uuid('Curso invalido.')).optional(),
})

const updateSubjectSchema = z.object({
  name: z.string().trim().min(2, 'O nome da materia deve ter no minimo 2 caracteres.').max(120, 'O nome da materia deve ter ate 120 caracteres.').optional(),
  isActive: z.boolean().optional(),
  courseIds: z.array(z.string().uuid('Curso invalido.')).optional(),
})

export { createSubjectSchema, subjectParamsSchema, subjectQuerySchema, updateSubjectSchema }
