import type { FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import {
  CourseDuplicateError,
  CourseNotFoundError,
  CourseSystemError,
  createCourse,
  deactivateCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
} from './courses.service'
import { courseParamsSchema, courseQuerySchema, createCourseSchema, updateCourseSchema } from './courses.schemas'

const formatValidationError = (error: ZodError) => {
  return error.issues.map((issue) => issue.message).join(' ') || 'Verifique os dados informados.'
}

const handleCourseError = (error: unknown, reply: FastifyReply) => {
  if (error instanceof ZodError) {
    return reply.code(400).send({ message: formatValidationError(error) })
  }

  if (error instanceof CourseDuplicateError) {
    return reply.code(409).send({ message: error.message })
  }

  if (error instanceof CourseSystemError) {
    return reply.code(400).send({ message: error.message })
  }

  if (error instanceof CourseNotFoundError) {
    return reply.code(404).send({ message: error.message })
  }

  throw error
}

const listCourses = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = courseQuerySchema.parse(request.query)
    const pageNum = Math.max(1, parseInt(query.page ?? '1') || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(query.limit ?? '20') || 20))

    const courses = await getAllCourses({
      page: pageNum,
      limit: limitNum,
      search: query.search,
      includeSubjects: query.includeSubjects === 'true',
    })
    return reply.send(courses)
  } catch (error) {
    return handleCourseError(error, reply)
  }
}

const getCourse = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = courseParamsSchema.parse(request.params)
    const course = await getCourseById(id)

    if (!course) {
      return reply.code(404).send({ message: 'Curso nao encontrado.' })
    }

    return reply.send(course)
  } catch (error) {
    return handleCourseError(error, reply)
  }
}

const create = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = createCourseSchema.parse(request.body)
    const course = await createCourse({ name: body.name, isActive: body.isActive })
    return reply.code(201).send(course)
  } catch (error) {
    return handleCourseError(error, reply)
  }
}

const update = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = courseParamsSchema.parse(request.params)
    const body = updateCourseSchema.parse(request.body)
    const course = await updateCourse(id, { name: body.name, isActive: body.isActive })
    return reply.send(course)
  } catch (error) {
    return handleCourseError(error, reply)
  }
}

const remove = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = courseParamsSchema.parse(request.params)
    const course = await deactivateCourse(id)
    return reply.send(course)
  } catch (error) {
    return handleCourseError(error, reply)
  }
}

export { listCourses, getCourse, create, update, remove }
