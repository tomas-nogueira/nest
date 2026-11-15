import type { FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import type { JwtPayload } from '../auth/auth.types'
import {
  ChangelogNotFoundError,
  createChangelog,
  deleteChangelog,
  listChangelog,
  updateChangelog,
} from './changelog.service'
import {
  changelogParamsSchema,
  changelogQuerySchema,
  createChangelogSchema,
  updateChangelogSchema,
} from './changelog.schemas'

const formatValidationError = (error: ZodError) => {
  return error.issues.map((issue) => issue.message).join(' ') || 'Verifique os dados informados.'
}

const handleChangelogError = (error: unknown, reply: FastifyReply) => {
  if (error instanceof ZodError) {
    return reply.code(400).send({ message: formatValidationError(error) })
  }

  if (error instanceof ChangelogNotFoundError) {
    return reply.code(404).send({ message: error.message })
  }

  throw error
}

const list = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify()
    const query = changelogQuerySchema.parse(request.query)
    return reply.send(await listChangelog(query.page, query.limit))
  } catch (error) {
    if (error instanceof Error && error.name === 'FastifyJWTError') {
      return reply.code(401).send({ message: 'Sessão inválida ou expirada.' })
    }

    return handleChangelogError(error, reply)
  }
}

const create = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = createChangelogSchema.parse(request.body)
    const payload = request.user as JwtPayload
    return reply.code(201).send(await createChangelog(payload.sub, body))
  } catch (error) {
    return handleChangelogError(error, reply)
  }
}

const update = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = changelogParamsSchema.parse(request.params)
    const body = updateChangelogSchema.parse(request.body)
    return reply.send(await updateChangelog(id, body))
  } catch (error) {
    return handleChangelogError(error, reply)
  }
}

const remove = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = changelogParamsSchema.parse(request.params)
    await deleteChangelog(id)
    return reply.code(204).send()
  } catch (error) {
    return handleChangelogError(error, reply)
  }
}

export { create, list, remove, update }
