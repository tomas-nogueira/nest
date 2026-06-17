import { prisma } from '../../lib/prisma'
import { normalizeNameKey } from '../courses/courses.service'

type CreateSubjectInput = {
  name: string
  isActive?: boolean
  courseIds?: string[]
}

type PaginationParams = {
  page: number
  limit: number
  search?: string
}

type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
}

class SubjectDuplicateError extends Error {
  constructor() {
    super('Ja existe uma materia com este nome no curso selecionado.')
  }
}

class SubjectCourseError extends Error {
  constructor(message = 'Um ou mais cursos nao foram encontrados.') {
    super(message)
  }
}

class SubjectNotFoundError extends Error {
  constructor() {
    super('Materia nao encontrada.')
  }
}

const SYSTEM_COURSE_KEY = 'outros'
const SYSTEM_SUBJECT_KEY = 'geral'

const normalizeName = (name: string) => name.trim()

const isUniqueConstraintError = (error: unknown) => {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'P2002'
}

const getAllSubjects = async (params: PaginationParams) => {
  const { page, limit, search } = params
  const skip = (page - 1) * limit
  const normalizedSearch = search?.trim()
  const where = normalizedSearch
    ? {
        OR: [
          { name: { contains: normalizedSearch, mode: 'insensitive' as const } },
          {
            courses: {
              some: {
                course: {
                  name: { contains: normalizedSearch, mode: 'insensitive' as const },
                },
              },
            },
          },
        ],
      }
    : undefined

  const [subjects, total] = await Promise.all([
    prisma.subject.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        courses: {
          include: {
            course: true,
          },
          orderBy: {
            course: {
              name: 'asc',
            },
          },
        },
      },
    }),
    prisma.subject.count({ where }),
  ])

  return {
    data: subjects,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  } as PaginatedResponse<(typeof subjects)[0]>
}

const normalizeCourseIds = (courseIds?: string[]) => {
  return Array.isArray(courseIds) ? [...new Set(courseIds.filter(Boolean))] : []
}

const getCoursesForSubject = async (courseIds: string[]) => {
  if (!courseIds.length) {
    return []
  }

  const courses = await prisma.course.findMany({
    where: {
      id: { in: courseIds },
    },
    select: {
      id: true,
      nameKey: true,
      isSystem: true,
    },
  })

  if (courses.length !== courseIds.length) {
    throw new SubjectCourseError()
  }

  return courses
}

const ensureSystemCourseRule = (courses: Array<{ nameKey: string; isSystem: boolean }>, subjectNameKey: string) => {
  const includesSystemCourse = courses.some((course) => course.isSystem || course.nameKey === SYSTEM_COURSE_KEY)

  if (includesSystemCourse && subjectNameKey !== SYSTEM_SUBJECT_KEY) {
    throw new SubjectCourseError('O curso Outros aceita apenas a materia Geral.')
  }
}

const ensureUniqueSubjectNamesByCourse = async (courseIds: string[], subjectNameKey: string, ignoreSubjectId?: string) => {
  if (!courseIds.length) {
    return
  }

  const duplicate = await prisma.subjectCourse.findFirst({
    where: {
      courseId: { in: courseIds },
      subjectNameKey,
      ...(ignoreSubjectId ? { subjectId: { not: ignoreSubjectId } } : {}),
    },
    select: { id: true },
  })

  if (duplicate) {
    throw new SubjectDuplicateError()
  }
}

const createSubject = async (data: CreateSubjectInput) => {
  const name = normalizeName(data.name)
  const nameKey = normalizeNameKey(name)
  const courseIds = normalizeCourseIds(data.courseIds)
  const courses = await getCoursesForSubject(courseIds)

  ensureSystemCourseRule(courses, nameKey)
  await ensureUniqueSubjectNamesByCourse(courseIds, nameKey)

  try {
    return await prisma.$transaction(async (tx) => {
      const subject = await tx.subject.create({
        data: {
          name,
          nameKey,
          isActive: data.isActive,
        },
      })

      if (courseIds.length) {
        await tx.subjectCourse.createMany({
          data: courseIds.map((courseId) => ({
            subjectId: subject.id,
            courseId,
            subjectNameKey: nameKey,
          })),
        })
      }

      return subject
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new SubjectDuplicateError()
    }

    throw error
  }
}

const updateSubject = async (id: string, data: Partial<CreateSubjectInput>) => {
  const current = await prisma.subject.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      nameKey: true,
      courses: {
        select: {
          courseId: true,
        },
      },
    },
  })

  if (!current) {
    throw new SubjectNotFoundError()
  }

  const name = data.name === undefined ? undefined : normalizeName(data.name)
  const nameKey = name === undefined ? current.nameKey : normalizeNameKey(name)
  const courseIds = Array.isArray(data.courseIds)
    ? normalizeCourseIds(data.courseIds)
    : current.courses.map((course) => course.courseId)
  const courses = await getCoursesForSubject(courseIds)

  ensureSystemCourseRule(courses, nameKey)
  await ensureUniqueSubjectNamesByCourse(courseIds, nameKey, id)

  try {
    return await prisma.$transaction(async (tx) => {
      const subject = await tx.subject.update({
        where: { id },
        data: {
          name,
          nameKey,
          isActive: data.isActive,
        },
      })

      if (Array.isArray(data.courseIds)) {
        await tx.subjectCourse.deleteMany({
          where: {
            subjectId: id,
          },
        })

        if (courseIds.length) {
          await tx.subjectCourse.createMany({
            data: courseIds.map((courseId) => ({
              subjectId: id,
              courseId,
              subjectNameKey: nameKey,
            })),
          })
        }
      } else if (name !== undefined) {
        await tx.subjectCourse.updateMany({
          where: {
            subjectId: id,
          },
          data: {
            subjectNameKey: nameKey,
          },
        })
      }

      return subject
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new SubjectDuplicateError()
    }

    throw error
  }
}

const deleteSubject = async (id: string) => {
  const current = await prisma.subject.findUnique({
    where: { id },
    select: {
      id: true,
      nameKey: true,
      courses: {
        select: {
          course: {
            select: {
              nameKey: true,
              isSystem: true,
            },
          },
        },
      },
    },
  })

  if (!current) {
    throw new SubjectNotFoundError()
  }

  const isSystemSubject = current.nameKey === SYSTEM_SUBJECT_KEY && current.courses.some((item) => item.course.isSystem || item.course.nameKey === SYSTEM_COURSE_KEY)

  if (isSystemSubject) {
    throw new SubjectCourseError('A materia Geral do curso Outros nao pode ser excluida.')
  }

  return prisma.subject.delete({ where: { id } })
}

export {
  SubjectCourseError,
  SubjectDuplicateError,
  SubjectNotFoundError,
  createSubject,
  deleteSubject,
  getAllSubjects,
  updateSubject,
}
