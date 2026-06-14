import { prisma } from '../../lib/prisma'

type CreateSubjectInput = {
  name: string
  isActive?: boolean
  courseIds?: string[]
}

type PaginationParams = {
  page: number
  limit: number
}

type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
}

const getAllSubjects = async (params: PaginationParams) => {
  const { page, limit } = params
  const skip = (page - 1) * limit

  const [subjects, total] = await Promise.all([
    prisma.subject.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.subject.count(),
  ])

  return {
    data: subjects,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  } as PaginatedResponse<typeof subjects[0]>
}

const createSubject = async (data: CreateSubjectInput) => {
  const courseIds = Array.isArray(data.courseIds)
    ? [...new Set(data.courseIds.filter(Boolean))]
    : []

  if (!courseIds.length) {
    return prisma.subject.create({
      data: {
        name: data.name,
        isActive: data.isActive,
      },
    })
  }

  return prisma.$transaction(async (tx) => {
    const courseCount = await tx.course.count({
      where: {
        id: { in: courseIds },
      },
    })

    if (courseCount !== courseIds.length) {
      throw new Error('Um ou mais cursos não foram encontrados.')
    }

    const subject = await tx.subject.create({
      data: {
        name: data.name,
        isActive: data.isActive,
      },
    })

    await tx.subjectCourse.createMany({
      data: courseIds.map((courseId) => ({
        subjectId: subject.id,
        courseId,
      })),
      skipDuplicates: true,
    })

    return subject
  })
}

const updateSubject = async (id: string, data: Partial<CreateSubjectInput>) => {
  const courseIds = Array.isArray(data.courseIds)
    ? [...new Set(data.courseIds.filter(Boolean))]
    : undefined

  return prisma.$transaction(async (tx) => {
    if (courseIds !== undefined) {
      const courseCount = await tx.course.count({
        where: {
          id: { in: courseIds },
        },
      })

      if (courseCount !== courseIds.length) {
        throw new Error('Um ou mais cursos não foram encontrados.')
      }
    }

    const subject = await tx.subject.update({
      where: { id },
      data: {
        name: data.name,
        isActive: data.isActive,
      },
    })

    if (courseIds !== undefined) {
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
          })),
          skipDuplicates: true,
        })
      }
    }

    return subject
  })
}

const deleteSubject = async (id: string) => {
  return prisma.subject.delete({ where: { id } })
}

export { getAllSubjects, createSubject, updateSubject, deleteSubject }
