import { prisma } from '../../lib/prisma'

type CreateSubjectInput = {
  name: string
  isActive?: boolean
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
  return prisma.subject.create({ data })
}

const updateSubject = async (id: string, data: Partial<CreateSubjectInput>) => {
  return prisma.subject.update({ where: { id }, data })
}

const deleteSubject = async (id: string) => {
  return prisma.subject.delete({ where: { id } })
}

export { getAllSubjects, createSubject, updateSubject, deleteSubject }
