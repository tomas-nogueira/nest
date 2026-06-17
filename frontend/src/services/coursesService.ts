import { request } from './api'

export type Course = {
  id: string
  name: string
  nameKey: string
  isActive: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export type CourseSubject = {
  id: string
  subjectId: string
  courseId: string
  subjectNameKey: string
  subject: {
    id: string
    name: string
    nameKey: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
}

export type CourseWithSubjects = Course & {
  subjects: CourseSubject[]
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
}

type FetchCoursesOptions = {
  page?: number
  limit?: number
  search?: string
  includeSubjects?: boolean
}

export const fetchCourses = (page: number = 1, limit: number = 20) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return request<PaginatedResponse<Course>>(`/courses?${params}`)
}

export const fetchCoursesList = (options: FetchCoursesOptions = {}) => {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 20),
  })

  if (options.search?.trim()) {
    params.set('search', options.search.trim())
  }

  if (options.includeSubjects) {
    params.set('includeSubjects', 'true')
  }

  return request<PaginatedResponse<CourseWithSubjects>>(`/courses?${params}`)
}

export const createCourse = (payload: { name: string; isActive?: boolean }) => {
  return request<Course>('/courses', { method: 'POST', body: JSON.stringify(payload) })
}

export const updateCourse = (id: string, payload: { name?: string; isActive?: boolean }) => {
  return request<Course>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export const deactivateCourse = (id: string) => {
  return request<Course>(`/courses/${id}`, { method: 'DELETE' })
}
