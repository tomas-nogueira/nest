import { request } from './api'
import type { AcademicPost, PostComment } from './postsService'
import type { Pagination } from './profileService'

export type Course = {
  id: string
  name: string
  nameKey: string
  bio: string | null
  avatarUrl?: string | null
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

export type CourseProfileSummary = {
  postsCount: number
  mediaCount: number
  studentsCount: number
  subjectsCount: number
}

export type CourseProfilePayload = {
  course: Course
  summary: CourseProfileSummary
}

export type CourseActivityComment = {
  type: 'comment'
  id: string
  createdAt: string
  upvotes: number
  comment: PostComment
  post: AcademicPost
}

export type CourseActivityPost = {
  type: 'post'
  id: string
  createdAt: string
  upvotes: number
  post: AcademicPost
}

export type CourseActivityItem = CourseActivityPost | CourseActivityComment

export type CoursePostsPayload = {
  posts: AcademicPost[]
  pagination: Pagination
}

export type CourseActivityPayload = {
  items: CourseActivityItem[]
  pagination: Pagination
}

export type UpdateCourseProfileInput = {
  name: string
  bio?: string
  avatar?: File | null
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

export const fetchCourseProfile = (token: string, courseId: string) => {
  return request<CourseProfilePayload>(`/courses/${courseId}/profile`, {}, token)
}

export const fetchCoursePosts = (token: string, courseId: string, page: number, limit = 10) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return request<CoursePostsPayload>(`/courses/${courseId}/profile/posts?${params.toString()}`, {}, token)
}

export const fetchCourseMedia = (token: string, courseId: string, page: number, limit = 10) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return request<CourseActivityPayload>(`/courses/${courseId}/profile/media?${params.toString()}`, {}, token)
}

export const fetchCourseHighlights = (token: string, courseId: string, page: number, limit = 10) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return request<CourseActivityPayload>(`/courses/${courseId}/profile/highlights?${params.toString()}`, {}, token)
}

export const updateCourseProfile = (token: string, courseId: string, input: UpdateCourseProfileInput) => {
  const formData = new FormData()
  formData.append('name', input.name)
  formData.append('bio', input.bio ?? '')

  if (input.avatar) {
    formData.append('avatar', input.avatar)
  }

  return request<{ course: Course }>(
    `/courses/${courseId}/profile`,
    {
      method: 'PATCH',
      body: formData,
    },
    token,
  )
}
