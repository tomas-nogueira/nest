import { request } from './api'

export type Course = {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
}

export const fetchCourses = (page: number = 1, limit: number = 20) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return request<PaginatedResponse<Course>>(`/courses?${params}`)
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
