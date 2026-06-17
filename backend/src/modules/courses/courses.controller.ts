import type { FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import { env } from '../../config/env'
import type { JwtPayload } from '../auth/auth.types'
import { FileValidationError } from '../files/errors/file.errors'
import {
  CourseDuplicateError,
  CourseNotFoundError,
  CourseSystemError,
  CourseValidationError,
  createCourse,
  deactivateCourse,
  getAllCourses,
  getCourseById,
  getCourseHighlights,
  getCourseMedia,
  getCoursePosts,
  getCourseProfile,
  updateCourse,
  updateCourseProfile,
  type UploadedCourseAvatarFile,
} from './courses.service'
import {
  courseParamsSchema,
  courseProfileListQuerySchema,
  courseQuerySchema,
  createCourseSchema,
  updateCourseProfileSchema,
  updateCourseSchema,
} from './courses.schemas'

type MultipartFieldPart = {
  type: 'field'
  fieldname: string
  value: unknown
}

type MultipartFilePart = {
  type: 'file'
  fieldname: string
  filename: string
  mimetype: string
  toBuffer(): Promise<Buffer>
}

type MultipartPart = MultipartFieldPart | MultipartFilePart

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

  if (error instanceof CourseValidationError || error instanceof FileValidationError) {
    return reply.code(400).send({ message: error.message })
  }

  if (error instanceof Error && 'code' in error && error.code === 'FST_REQ_FILE_TOO_LARGE') {
    return reply.code(413).send({ message: 'O arquivo enviado excede o tamanho maximo permitido.' })
  }

  throw error
}

const parseCourseProfileMultipart = async (request: FastifyRequest) => {
  const fields: Record<string, unknown> = {}
  let avatar: UploadedCourseAvatarFile | undefined

  for await (const part of request.parts() as AsyncIterable<MultipartPart>) {
    if (part.type === 'field') {
      fields[part.fieldname] = part.value
      continue
    }

    if (part.fieldname !== 'avatar') {
      throw new FileValidationError('Campo de arquivo invalido.')
    }

    const buffer = await part.toBuffer()

    if (buffer.length > env.MAX_UPLOAD_FILE_SIZE_BYTES) {
      throw new FileValidationError('O arquivo enviado excede o tamanho maximo permitido.')
    }

    avatar = {
      buffer,
      originalName: part.filename,
      mimeType: part.mimetype,
    }
  }

  return {
    body: updateCourseProfileSchema.parse(fields),
    avatar,
  }
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

const profile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify()
    const { id } = courseParamsSchema.parse(request.params)
    const course = await getCourseProfile(id)

    return reply.send(course)
  } catch (error) {
    return handleCourseError(error, reply)
  }
}

const profilePosts = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify()
    const payload = request.user as JwtPayload
    const { id } = courseParamsSchema.parse(request.params)
    const query = courseProfileListQuerySchema.parse(request.query)
    const response = await getCoursePosts({
      currentStudentId: payload.sub,
      courseId: id,
      page: query.page,
      limit: query.limit,
    })

    return reply.send(response)
  } catch (error) {
    return handleCourseError(error, reply)
  }
}

const profileMedia = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify()
    const payload = request.user as JwtPayload
    const { id } = courseParamsSchema.parse(request.params)
    const query = courseProfileListQuerySchema.parse(request.query)
    const response = await getCourseMedia({
      currentStudentId: payload.sub,
      courseId: id,
      page: query.page,
      limit: query.limit,
    })

    return reply.send(response)
  } catch (error) {
    return handleCourseError(error, reply)
  }
}

const profileHighlights = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify()
    const payload = request.user as JwtPayload
    const { id } = courseParamsSchema.parse(request.params)
    const query = courseProfileListQuerySchema.parse(request.query)
    const response = await getCourseHighlights({
      currentStudentId: payload.sub,
      courseId: id,
      page: query.page,
      limit: query.limit,
    })

    return reply.send(response)
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

const updateProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = courseParamsSchema.parse(request.params)
    const { body, avatar } = await parseCourseProfileMultipart(request)
    const course = await updateCourseProfile({
      courseId: id,
      name: body.name,
      bio: body.bio,
      avatar,
    })

    return reply.send({ course })
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

export { listCourses, getCourse, create, profile, profileHighlights, profileMedia, profilePosts, remove, update, updateProfile }
