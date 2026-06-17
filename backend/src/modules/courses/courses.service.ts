import type { Prisma } from '../../../generated/prisma/client'
import { prisma } from '../../lib/prisma'
import { removeFile, uploadFile } from '../files/files.service'
import { commentInclude, getCommentMetrics, mapComment, type CommentWithAuthor } from '../posts/comments.service'
import { mapPost, postInclude } from '../posts/posts.service'

type CreateCourseInput = {
  name: string
  bio?: string
  isActive?: boolean
}

type UpdateCourseInput = Partial<CreateCourseInput>

type UploadedCourseAvatarFile = {
  buffer: Buffer
  originalName: string
  mimeType: string
}

type UpdateCourseProfileInput = {
  courseId: string
  name: string
  bio?: string
  avatar?: UploadedCourseAvatarFile
}

type CourseProfileListInput = {
  currentStudentId: string
  courseId: string
  page: number
  limit: number
}

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

class CourseValidationError extends Error {}

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

const coursePostWhere = (courseId: string): Prisma.PostWhereInput => ({
  subject: {
    isActive: true,
    courses: {
      some: {
        courseId,
      },
    },
  },
})

const courseCommentWhere = (courseId: string): Prisma.CommentWhereInput => ({
  post: coursePostWhere(courseId),
})

const mapCourse = (course: {
  id: string
  name: string
  nameKey: string
  bio: string | null
  avatarFileId: string | null
  isActive: boolean
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}) => ({
  id: course.id,
  name: course.name,
  nameKey: course.nameKey,
  bio: course.bio,
  avatarUrl: course.avatarFileId ? `/files/${course.avatarFileId}/preview` : null,
  isActive: course.isActive,
  isSystem: course.isSystem,
  createdAt: course.createdAt,
  updatedAt: course.updatedAt,
})

const ensureCourseExists = async (courseId: string) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      name: true,
      nameKey: true,
      bio: true,
      avatarFileId: true,
      isActive: true,
      isSystem: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!course) {
    throw new CourseNotFoundError()
  }

  return course
}

const pagination = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
})

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
        bio: data.bio?.trim() || null,
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
        bio: data.bio === undefined ? undefined : data.bio.trim() || null,
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

const getCourseProfile = async (courseId: string) => {
  const course = await ensureCourseExists(courseId)
  const where = coursePostWhere(courseId)
  const commentWhere = courseCommentWhere(courseId)

  const [postsCount, mediaPostsCount, mediaCommentsCount, studentsCount, subjectsCount] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.count({
      where: {
        ...where,
        attachments: {
          some: {
            commentId: null,
          },
        },
      },
    }),
    prisma.comment.count({
      where: {
        ...commentWhere,
        attachments: {
          some: {},
        },
      },
    }),
    prisma.student.count({ where: { courseId } }),
    prisma.subjectCourse.count({
      where: {
        courseId,
        subject: {
          isActive: true,
        },
      },
    }),
  ])

  return {
    course: mapCourse(course),
    summary: {
      postsCount,
      mediaCount: mediaPostsCount + mediaCommentsCount,
      studentsCount,
      subjectsCount,
    },
  }
}

const getCoursePosts = async (input: CourseProfileListInput) => {
  await ensureCourseExists(input.courseId)
  const where = coursePostWhere(input.courseId)
  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      include: postInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.post.count({ where }),
  ])

  return {
    posts: await mapPostsWithVoteState(posts, input.currentStudentId),
    pagination: pagination(input.page, input.limit, total),
  }
}

const getCommentScoreMap = async (commentIds: string[], currentStudentId: string) => {
  return getCommentMetrics(commentIds, currentStudentId)
}

const mapCourseComments = async (
  comments: Array<CommentWithAuthor & { post: Parameters<typeof mapPost>[0] }>,
  currentStudentId: string,
) => {
  const metrics = await getCommentScoreMap(
    comments.map((comment) => comment.id),
    currentStudentId,
  )

  return comments.map((comment) => ({
    type: 'comment' as const,
    id: comment.id,
    createdAt: comment.createdAt,
    upvotes: Math.max(0, metrics.get(comment.id)?.score ?? 0),
    comment: mapComment(comment, metrics, currentStudentId),
    post: mapPost(comment.post),
  }))
}

const mapPostsWithVoteState = async (
  posts: Array<Parameters<typeof mapPost>[0] & { id: string }>,
  currentStudentId: string,
) => {
  const postIds = posts.map((post) => post.id)
  const [voteStats, userVotes] = await Promise.all([
    postIds.length
      ? prisma.vote.groupBy({
          by: ['postId'],
          where: {
            postId: {
              in: postIds,
            },
            commentId: null,
          },
          _sum: {
            vote_type: true,
          },
        })
      : [],
    postIds.length
      ? prisma.vote.findMany({
          where: {
            postId: {
              in: postIds,
            },
            userId: currentStudentId,
            commentId: null,
          },
          select: {
            postId: true,
            vote_type: true,
          },
        })
      : [],
  ])

  const scoresByPostId = new Map(voteStats.map((vote) => [vote.postId, vote._sum.vote_type ?? 0]))
  const userVotesByPostId = new Map(userVotes.map((vote) => [vote.postId, vote.vote_type as 1 | -1]))

  return posts.map((post) => mapPost(post, scoresByPostId.get(post.id) ?? 0, userVotesByPostId.get(post.id) ?? 0))
}

const getCourseMedia = async (input: CourseProfileListInput) => {
  await ensureCourseExists(input.courseId)
  const offset = (input.page - 1) * input.limit
  const rows = await prisma.$queryRaw<Array<{ itemType: 'post' | 'comment'; id: string; createdAt: Date }>>`
    SELECT * FROM (
      SELECT 'post' AS "itemType", p."id", p."createdAt"
      FROM "Post" p
      INNER JOIN "SubjectCourse" sc ON sc."subjectId" = p."subjectId"
      INNER JOIN "Subject" s ON s."id" = p."subjectId"
      WHERE sc."courseId" = ${input.courseId}
        AND s."isActive" = true
        AND EXISTS (
          SELECT 1 FROM "Attachment" a
          WHERE a."postId" = p."id" AND a."commentId" IS NULL
        )
      UNION ALL
      SELECT 'comment' AS "itemType", c."id", c."createdAt"
      FROM "Comment" c
      INNER JOIN "Post" p ON p."id" = c."postId"
      INNER JOIN "SubjectCourse" sc ON sc."subjectId" = p."subjectId"
      INNER JOIN "Subject" s ON s."id" = p."subjectId"
      WHERE sc."courseId" = ${input.courseId}
        AND s."isActive" = true
        AND EXISTS (
          SELECT 1 FROM "Attachment" a
          WHERE a."commentId" = c."id"
        )
    ) media
    ORDER BY media."createdAt" DESC, media."id" ASC
    LIMIT ${input.limit} OFFSET ${offset}
  `
  const totalRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS "count" FROM (
      SELECT p."id"
      FROM "Post" p
      INNER JOIN "SubjectCourse" sc ON sc."subjectId" = p."subjectId"
      INNER JOIN "Subject" s ON s."id" = p."subjectId"
      WHERE sc."courseId" = ${input.courseId}
        AND s."isActive" = true
        AND EXISTS (
          SELECT 1 FROM "Attachment" a
          WHERE a."postId" = p."id" AND a."commentId" IS NULL
        )
      UNION ALL
      SELECT c."id"
      FROM "Comment" c
      INNER JOIN "Post" p ON p."id" = c."postId"
      INNER JOIN "SubjectCourse" sc ON sc."subjectId" = p."subjectId"
      INNER JOIN "Subject" s ON s."id" = p."subjectId"
      WHERE sc."courseId" = ${input.courseId}
        AND s."isActive" = true
        AND EXISTS (
          SELECT 1 FROM "Attachment" a
          WHERE a."commentId" = c."id"
        )
    ) media
  `

  return hydrateCourseActivityRows(rows, input.currentStudentId, input.page, input.limit, Number(totalRows[0]?.count ?? 0))
}

const getCourseHighlights = async (input: CourseProfileListInput) => {
  await ensureCourseExists(input.courseId)
  const offset = (input.page - 1) * input.limit
  const rows = await prisma.$queryRaw<Array<{ itemType: 'post' | 'comment'; id: string; createdAt: Date; upvotes: number }>>`
    SELECT * FROM (
      SELECT 'post' AS "itemType", p."id", p."createdAt", COUNT(v."id")::int AS "upvotes"
      FROM "Post" p
      INNER JOIN "SubjectCourse" sc ON sc."subjectId" = p."subjectId"
      INNER JOIN "Subject" s ON s."id" = p."subjectId"
      LEFT JOIN "Vote" v ON v."postId" = p."id" AND v."commentId" IS NULL AND v."vote_type" = 1
      WHERE sc."courseId" = ${input.courseId}
        AND s."isActive" = true
      GROUP BY p."id", p."createdAt"
      UNION ALL
      SELECT 'comment' AS "itemType", c."id", c."createdAt", COUNT(v."id")::int AS "upvotes"
      FROM "Comment" c
      INNER JOIN "Post" p ON p."id" = c."postId"
      INNER JOIN "SubjectCourse" sc ON sc."subjectId" = p."subjectId"
      INNER JOIN "Subject" s ON s."id" = p."subjectId"
      LEFT JOIN "Vote" v ON v."commentId" = c."id" AND v."postId" IS NULL AND v."vote_type" = 1
      WHERE sc."courseId" = ${input.courseId}
        AND s."isActive" = true
      GROUP BY c."id", c."createdAt"
    ) highlights
    ORDER BY highlights."upvotes" DESC, highlights."createdAt" DESC, highlights."id" ASC
    LIMIT ${input.limit} OFFSET ${offset}
  `
  const [postsCount, commentsCount] = await Promise.all([
    prisma.post.count({ where: coursePostWhere(input.courseId) }),
    prisma.comment.count({ where: courseCommentWhere(input.courseId) }),
  ])

  return hydrateCourseActivityRows(rows, input.currentStudentId, input.page, input.limit, postsCount + commentsCount)
}

const hydrateCourseActivityRows = async (
  rows: Array<{ itemType: 'post' | 'comment'; id: string; createdAt: Date; upvotes?: number }>,
  currentStudentId: string,
  page: number,
  limit: number,
  total: number,
) => {
  const postIds = rows.filter((row) => row.itemType === 'post').map((row) => row.id)
  const commentIds = rows.filter((row) => row.itemType === 'comment').map((row) => row.id)

  const [posts, comments] = await Promise.all([
    postIds.length
      ? prisma.post.findMany({
          where: { id: { in: postIds } },
          include: postInclude,
        })
      : [],
    commentIds.length
      ? prisma.comment.findMany({
          where: { id: { in: commentIds } },
          include: {
            ...commentInclude,
            post: {
              include: postInclude,
            },
          },
        })
      : [],
  ])

  const mappedPosts = await mapPostsWithVoteState(posts, currentStudentId)
  const mappedComments = await mapCourseComments(comments, currentStudentId)
  const postsById = new Map(mappedPosts.map((post) => [post.id, post]))
  const commentsById = new Map(mappedComments.map((comment) => [comment.id, comment]))

  return {
    items: rows
      .map((row) => {
        if (row.itemType === 'post') {
          const post = postsById.get(row.id)
          return post
            ? {
                type: 'post' as const,
                id: row.id,
                createdAt: row.createdAt,
                upvotes: row.upvotes ?? Math.max(0, post.votes.score),
                post,
              }
            : null
        }

        const comment = commentsById.get(row.id)
        return comment
          ? {
              ...comment,
              upvotes: row.upvotes ?? comment.upvotes,
            }
          : null
      })
      .filter(Boolean),
    pagination: pagination(page, limit, total),
  }
}

const updateCourseProfile = async (input: UpdateCourseProfileInput) => {
  const current = await ensureCourseExists(input.courseId)
  if (current.isSystem) {
    throw new CourseSystemError()
  }

  const name = normalizeName(input.name)
  const nameKey = normalizeNameKey(name)
  await ensureUniqueCourseNameStatus(nameKey, current.isActive, input.courseId)

  let uploadedAvatarId: string | null = null
  let profileUpdated = false

  try {
    if (input.avatar) {
      const file = await uploadFile(input.avatar)

      if (!file.mimeType.startsWith('image/')) {
        await removeFile(file.id)
        throw new CourseValidationError('Envie uma imagem valida para o curso.')
      }

      uploadedAvatarId = file.id
    }

    const course = await prisma.course.update({
      where: { id: input.courseId },
      data: {
        name,
        nameKey,
        bio: input.bio?.trim() || null,
        ...(uploadedAvatarId
          ? {
              avatarFile: {
                connect: {
                  id: uploadedAvatarId,
                },
              },
            }
          : {}),
      },
    })
    profileUpdated = true

    if (uploadedAvatarId && current.avatarFileId && current.avatarFileId !== uploadedAvatarId) {
      await removeFile(current.avatarFileId)
    }

    return mapCourse(course)
  } catch (error) {
    if (uploadedAvatarId && !profileUpdated) {
      await removeFile(uploadedAvatarId).catch(() => undefined)
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
  CourseValidationError,
  createCourse,
  deactivateCourse,
  getAllCourses,
  getCourseById,
  getCourseHighlights,
  getCourseMedia,
  getCoursePosts,
  getCourseProfile,
  normalizeNameKey,
  updateCourse,
  updateCourseProfile,
}
export type { UploadedCourseAvatarFile }
