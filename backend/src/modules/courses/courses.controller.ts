import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deactivateCourse,
} from './courses.service'

const listCourses = async (request: FastifyRequest, reply: FastifyReply) => {
  const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string }
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20))

  const courses = await getAllCourses({ page: pageNum, limit: limitNum })
  return reply.send(courses)
}

const getCourse = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const course = await getCourseById(id)

  if (!course) {
    return reply.code(404).send({ message: 'Curso não encontrado.' })
  }

  return reply.send(course)
}

const create = async (request: FastifyRequest, reply: FastifyReply) => {
  const body = request.body as { name: string; isActive?: boolean }
  const course = await createCourse({ name: body.name, isActive: body.isActive })
  return reply.code(201).send(course)
}

const update = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const body = request.body as { name?: string; isActive?: boolean }
  const course = await updateCourse(id, { name: body.name, isActive: body.isActive })
  return reply.send(course)
}

const remove = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const course = await deactivateCourse(id)
  return reply.send(course)
}

export { listCourses, getCourse, create, update, remove }
