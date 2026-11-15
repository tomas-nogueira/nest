import { prisma } from '../../lib/prisma'

const changelogSelect = {
  id: true,
  title: true,
  description: true,
  publicationDate: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      name: true,
    },
  },
} as const

class ChangelogNotFoundError extends Error {
  constructor() {
    super('Novidade não encontrada.')
  }
}

const listChangelog = async (page: number, limit: number) => {
  const [items, total] = await prisma.$transaction([
    prisma.changeLog.findMany({
      select: changelogSelect,
      orderBy: [{ publicationDate: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.changeLog.count(),
  ])

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}

const createChangelog = async (userId: string, data: { title: string; description: string }) => {
  return prisma.changeLog.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
    },
    select: changelogSelect,
  })
}

const updateChangelog = async (
  id: string,
  data: { title?: string; description?: string },
) => {
  const existing = await prisma.changeLog.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!existing) {
    throw new ChangelogNotFoundError()
  }

  return prisma.changeLog.update({
    where: { id },
    data,
    select: changelogSelect,
  })
}

const deleteChangelog = async (id: string) => {
  const existing = await prisma.changeLog.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!existing) {
    throw new ChangelogNotFoundError()
  }

  await prisma.changeLog.delete({ where: { id } })
}

export { ChangelogNotFoundError, createChangelog, deleteChangelog, listChangelog, updateChangelog }
