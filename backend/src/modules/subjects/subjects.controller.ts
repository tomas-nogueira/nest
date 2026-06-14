import type { FastifyReply, FastifyRequest } from 'fastify'
import { getAllSubjects, createSubject, updateSubject, deleteSubject } from './subjects.service'

const listSubjects = async (request: FastifyRequest, reply: FastifyReply) => {
  const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string }
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20))

  const subjects = await getAllSubjects({ page: pageNum, limit: limitNum })
  return reply.send(subjects)
}

const create = async (request: FastifyRequest, reply: FastifyReply) => {
  const body = request.body as { name: string; isActive?: boolean; courseIds?: string[] }
  const subject = await createSubject({
    name: body.name,
    isActive: body.isActive,
    courseIds: body.courseIds,
  })
  return reply.code(201).send(subject)
}

const update = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const body = request.body as { name?: string; isActive?: boolean; courseIds?: string[] }
  const subject = await updateSubject(id, body)
  return reply.send(subject)
}

const remove = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  await deleteSubject(id)
  return reply.code(204).send()
}

export { listSubjects, create, update, remove }
