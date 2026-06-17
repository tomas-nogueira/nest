import { request } from './api'

export type Subject = {
  id: string
  name: string
  nameKey: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  courses?: Array<{
    id: string
    subjectId: string
    courseId: string
    subjectNameKey: string
    course: {
      id: string
      name: string
      nameKey: string
      isActive: boolean
      isSystem: boolean
      createdAt: string
      updatedAt: string
    }
  }>
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
}

export const fetchSubjects = (page: number = 1, limit: number = 20, search?: string) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })

  if (search?.trim()) {
    params.set('search', search.trim())
  }

  return request<PaginatedResponse<Subject>>(`/subjects?${params}`)
}

export const createSubject = (payload: { name: string; isActive?: boolean; courseIds?: string[] }) => {
  return request<Subject>('/subjects', { method: 'POST', body: JSON.stringify(payload) })
}

export const updateSubject = (id: string, payload: { name?: string; isActive?: boolean; courseIds?: string[] }) => {
  return request<Subject>(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

const validateSubjectId = (id: string) => {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('ID de matéria inválido.')
  }
}

export const deleteSubject = (id: string) => {
  validateSubjectId(id)
  return request<void>(`/subjects/${id}`, { method: 'DELETE' })
}
