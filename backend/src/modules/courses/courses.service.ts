import { prisma } from '../../lib/prisma'

type CreateCourseInput = {
  name: string
  isActive?: boolean
}

type UpdateCourseInput = Partial<CreateCourseInput>

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

const getAllCourses = async (params: PaginationParams) => {
  const { page, limit } = params
  const skip = (page - 1) * limit

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.course.count(),
  ])

  return {
    data: courses,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  } as PaginatedResponse<typeof courses[0]>
}

const getCourseById = async (id: string) => {
  return prisma.course.findUnique({
    where: { id },
  })
}

const createCourse = async (data: CreateCourseInput) => {
  return prisma.course.create({
    data,
  })
}

const updateCourse = async (id: string, data: UpdateCourseInput) => {
  return prisma.course.update({
    where: { id },
    data,
  })
}

const deactivateCourse = async (id: string) => {
  return prisma.course.update({
    where: { id },
    data: { isActive: false },
  })
}

export { getAllCourses, getCourseById, createCourse, updateCourse, deactivateCourse }
