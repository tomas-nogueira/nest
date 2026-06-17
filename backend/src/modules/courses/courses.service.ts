import { prisma } from '../../lib/prisma'

type CreateCourseInput = {
  name: string
  isActive?: boolean
}

type UpdateCourseInput = Partial<CreateCourseInput>

type PaginationParams = {
  page: number
  limit: number
  search?: string
  includeSubjects?: boolean
}

type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
}

class CourseDuplicateError extends Error {
  constructor() {
    super('Ja existe um curso com este nome e status.')
  }
}

class CourseSystemError extends Error {
  constructor() {
    super('O curso Outros e obrigatorio e nao pode ser alterado.')
  }
}

class CourseNotFoundError extends Error {
  constructor() {
    super('Curso nao encontrado.')
  }
}

const normalizeName = (name: string) => name.trim()
const normalizeNameKey = (name: string) => normalizeName(name).toLocaleLowerCase('pt-BR')

const isUniqueConstraintError = (error: unknown) => {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'P2002'
}

const getAllCourses = async (params: PaginationParams) => {
  const { page, limit, search, includeSubjects = false } = params
  const skip = (page - 1) * limit
  const normalizedSearch = search?.trim()
  const where = normalizedSearch
    ? {
        OR: [
          { name: { contains: normalizedSearch, mode: 'insensitive' as const } },
          ...(includeSubjects
            ? [
                {
                  subjects: {
                    some: {
                      subject: {
                        name: { contains: normalizedSearch, mode: 'insensitive' as const },
                      },
                    },
                  },
                },
              ]
            : []),
        ],
      }
    : undefined

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isSystem: 'desc' }, { isActive: 'desc' }, { name: 'asc' }],
      include: includeSubjects
        ? {
            subjects: {
              include: {
                subject: true,
              },
              orderBy: {
                subject: {
                  name: 'asc',
                },
              },
            },
          }
        : undefined,
    }),
    prisma.course.count({ where }),
  ])

  return {
    data: courses,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  } as PaginatedResponse<(typeof courses)[0]>
}

const getCourseById = async (id: string) => {
  return prisma.course.findUnique({
    where: { id },
  })
}

const ensureUniqueCourseNameStatus = async (nameKey: string, isActive: boolean, ignoreId?: string) => {
  const existing = await prisma.course.findFirst({
    where: {
      nameKey,
      isActive,
    },
    select: { id: true },
  })

  if (existing && existing.id !== ignoreId) {
    throw new CourseDuplicateError()
  }
}

const createCourse = async (data: CreateCourseInput) => {
  const name = normalizeName(data.name)
  const nameKey = normalizeNameKey(name)
  const isActive = data.isActive ?? true

  await ensureUniqueCourseNameStatus(nameKey, isActive)

  try {
    return await prisma.course.create({
      data: {
        name,
        nameKey,
        isActive,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new CourseDuplicateError()
    }

    throw error
  }
}

const updateCourse = async (id: string, data: UpdateCourseInput) => {
  const current = await prisma.course.findUnique({
    where: { id },
    select: { id: true, isActive: true, isSystem: true, nameKey: true },
  })

  if (!current) {
    throw new CourseNotFoundError()
  }

  if (current.isSystem) {
    throw new CourseSystemError()
  }

  const name = data.name === undefined ? undefined : normalizeName(data.name)
  const nameKey = name === undefined ? current.nameKey : normalizeNameKey(name)
  const isActive = data.isActive ?? current.isActive

  await ensureUniqueCourseNameStatus(nameKey, isActive, id)

  try {
    return await prisma.course.update({
      where: { id },
      data: {
        name,
        nameKey,
        isActive: data.isActive,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new CourseDuplicateError()
    }

    throw error
  }
}

const deactivateCourse = async (id: string) => {
  const current = await prisma.course.findUnique({
    where: { id },
    select: { id: true, isSystem: true, nameKey: true },
  })

  if (!current) {
    throw new CourseNotFoundError()
  }

  if (current.isSystem) {
    throw new CourseSystemError()
  }

  await ensureUniqueCourseNameStatus(current.nameKey, false, id)

  return prisma.course.update({
    where: { id },
    data: { isActive: false },
  })
}

export {
  CourseDuplicateError,
  CourseNotFoundError,
  CourseSystemError,
  createCourse,
  deactivateCourse,
  getAllCourses,
  getCourseById,
  normalizeNameKey,
  updateCourse,
}
