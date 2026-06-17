import type { FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import {
  SubjectCourseError,
  SubjectDuplicateError,
  SubjectNotFoundError,
  createSubject,
  deleteSubject,
  getAllSubjects,
  updateSubject,
} from './subjects.service'
import { createSubjectSchema, subjectParamsSchema, subjectQuerySchema, updateSubjectSchema } from './subjects.schemas'

const formatValidationError = (error: ZodError) => {
  return error.issues.map((issue) => issue.message).join(' ') || 'Verifique os dados informados.'
}

const handleSubjectError = (error: unknown, reply: FastifyReply) => {
  if (error instanceof ZodError) {
    return reply.code(400).send({ message: formatValidationError(error) })
  }

  if (error instanceof SubjectDuplicateError) {
    return reply.code(409).send({ message: error.message })
  }

  if (error instanceof SubjectCourseError) {
    return reply.code(400).send({ message: error.message })
  }

  if (error instanceof SubjectNotFoundError) {
    return reply.code(404).send({ message: error.message })
  }

  throw error
}

const listSubjects = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = subjectQuerySchema.parse(request.query)
    const pageNum = Math.max(1, parseInt(query.page ?? '1') || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(query.limit ?? '20') || 20))

    const subjects = await getAllSubjects({ page: pageNum, limit: limitNum, search: query.search })
    return reply.send(subjects)
  } catch (error) {
    return handleSubjectError(error, reply)
  }
}

const create = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = createSubjectSchema.parse(request.body)
    const subject = await createSubject({
      name: body.name,
      isActive: body.isActive,
      courseIds: body.courseIds,
    })
    return reply.code(201).send(subject)
  } catch (error) {
    return handleSubjectError(error, reply)
  }
}

const update = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = subjectParamsSchema.parse(request.params)
    const body = updateSubjectSchema.parse(request.body)
    const subject = await updateSubject(id, body)
    return reply.send(subject)
  } catch (error) {
    return handleSubjectError(error, reply)
  }
}

const remove = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = subjectParamsSchema.parse(request.params)
    await deleteSubject(id)
    return reply.code(204).send()
  } catch (error) {
    return handleSubjectError(error, reply)
  }
}

export { listSubjects, create, update, remove }
