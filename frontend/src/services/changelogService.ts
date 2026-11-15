import { request } from './api'

export type ChangeLog = {
  id: string
  title: string
  description: string
  publicationDate: string
  updatedAt: string
  author: {
    id: string
    name: string
  }
}

export type ChangeLogListResponse = {
  items: ChangeLog[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ChangeLogInput = {
  title: string
  description: string
}

export const fetchChangeLogs = (page = 1, limit = 5, token?: string | null) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return request<ChangeLogListResponse>(`/changelog?${params.toString()}`, {}, token)
}

export const createChangeLog = (input: ChangeLogInput, token?: string | null) => {
  return request<ChangeLog>('/changelog', { method: 'POST', body: JSON.stringify(input) }, token)
}

export const updateChangeLog = (id: string, input: Partial<ChangeLogInput>, token?: string | null) => {
  return request<ChangeLog>(`/changelog/${id}`, { method: 'PATCH', body: JSON.stringify(input) }, token)
}

export const deleteChangeLog = (id: string, token?: string | null) => {
  return request<void>(`/changelog/${id}`, { method: 'DELETE' }, token)
}
