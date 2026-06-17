import {
  ArrowLeft,
  ArrowRight,
  Download,
  Edit3,
  FileText,
  ImageIcon,
  MessageCircle,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PostCard, formatSize } from '../components/posts/PostCard'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Modal } from '../components/ui/modal'
import { UserAvatar } from '../components/UserAvatar'
import { useAuth } from '../hooks/useAuth'
import {
  fetchCourseHighlights,
  fetchCourseMedia,
  fetchCoursePosts,
  fetchCourseProfile,
  updateCourseProfile,
  type CourseActivityItem,
  type CourseProfilePayload,
} from '../services/coursesService'
import {
  fetchAttachmentDownload,
  fetchAttachmentPreview,
  voteOnPost,
  type AcademicPost,
  type PostAttachment,
} from '../services/postsService'
import type { Pagination } from '../services/profileService'

type CourseTab = 'overview' | 'posts' | 'media' | 'highlights'

const PAGE_SIZE = 10

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const getBannerStyle = (color: { r: number; g: number; b: number } | null) => {
  if (!color) {
    return {
      background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 45%, #06b6d4 100%)',
    }
  }

  const base = `rgb(${color.r}, ${color.g}, ${color.b})`
  const dark = `rgb(${Math.max(0, color.r - 62)}, ${Math.max(0, color.g - 62)}, ${Math.max(0, color.b - 62)})`
  const light = `rgb(${Math.min(255, color.r + 58)}, ${Math.min(255, color.g + 58)}, ${Math.min(255, color.b + 58)})`

  return {
    background: `linear-gradient(135deg, ${dark} 0%, ${base} 52%, ${light} 100%)`,
  }
}

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
    <p className="text-sm font-medium text-slate-900">{title}</p>
    <p className="mt-1 text-sm text-slate-500">{description}</p>
  </div>
)

const EditCourseModal = ({
  open,
  profile,
  token,
  onClose,
  onSaved,
}: {
  open: boolean
  profile: CourseProfilePayload
  token: string | null
  onClose(): void
  onSaved(course: CourseProfilePayload['course']): void
}) => {
  const [name, setName] = useState(profile.course.name)
  const [bio, setBio] = useState(profile.course.bio ?? '')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!avatar) {
      return
    }

    const url = URL.createObjectURL(avatar)
    setAvatarPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [avatar])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!token) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await updateCourseProfile(token, profile.course.id, { name, bio, avatar })
      onSaved(response.course)
      toast.success('Curso atualizado com sucesso.')
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form className="w-[min(94vw,560px)] rounded-lg bg-white p-5 shadow-xl" onSubmit={handleSubmit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Editar curso</h2>
            <p className="text-sm text-slate-500">Atualize os dados publicos do curso.</p>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" title="Fechar" onClick={onClose}>
            <X />
          </Button>
        </div>

        <div className="mt-5 flex items-center gap-4">
          {avatarPreview ? (
            <img className="size-20 rounded-full object-cover" src={avatarPreview} alt="Previa do avatar" />
          ) : (
            <UserAvatar
              name={profile.course.name}
              avatarUrl={profile.course.avatarUrl}
              token={token}
              className="size-20 text-xl"
            />
          )}
          <div>
            <Label htmlFor="course-avatar">Foto do curso</Label>
            <Input
              id="course-avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="mt-2 rounded-lg border-slate-200 bg-white px-3 py-2 text-sm"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                setAvatar(file)
                if (!file) {
                  setAvatarPreview(null)
                }
              }}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <div>
            <Label htmlFor="course-name">Nome</Label>
            <Input
              id="course-name"
              value={name}
              required
              minLength={2}
              className="mt-1 rounded-lg border-slate-200 bg-white"
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="course-bio">Bio</Label>
            <textarea
              id="course-bio"
              value={bio}
              maxLength={280}
              rows={4}
              className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
              placeholder="Descreva o foco do curso, trilhas e materiais relevantes."
              onChange={(event) => setBio(event.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">{bio.length}/280</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-red-700 text-white hover:bg-red-800" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar curso'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

const CommentActivityCard = ({
  item,
  onPreview,
  onDownload,
}: {
  item: Extract<CourseActivityItem, { type: 'comment' }>
  onPreview(attachment: PostAttachment, gallery: PostAttachment[]): void
  onDownload(attachment: PostAttachment): void
}) => {
  const attachments = item.comment.attachments

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <MessageCircle className="size-3.5" />
        Comentario em{' '}
        <Link to={`/posts/${item.post.id}`} className="text-red-700 hover:text-red-800">
          {item.post.title}
        </Link>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.comment.content}</p>
      {attachments.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 text-left transition hover:text-cyan-800"
                onClick={() => onPreview(attachment, attachments)}
              >
                {attachment.file.mimeType.startsWith('image/') ? <ImageIcon className="size-4" /> : <FileText className="size-4" />}
                <span className="truncate">{attachment.file.originalName}</span>
              </button>
              <Button type="button" variant="ghost" size="icon-sm" title="Download" onClick={() => onDownload(attachment)}>
                <Download className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
        <span>{item.upvotes} upvotes</span>
        <span>
          {new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(item.createdAt))}
        </span>
      </div>
    </article>
  )
}

const CourseProfilePage = () => {
  const { courseId } = useParams()
  const { accessToken, user } = useAuth()
  const [profile, setProfile] = useState<CourseProfilePayload | null>(null)
  const [posts, setPosts] = useState<AcademicPost[]>([])
  const [postsPagination, setPostsPagination] = useState<Pagination | null>(null)
  const [media, setMedia] = useState<CourseActivityItem[]>([])
  const [mediaPagination, setMediaPagination] = useState<Pagination | null>(null)
  const [highlights, setHighlights] = useState<CourseActivityItem[]>([])
  const [highlightsPagination, setHighlightsPagination] = useState<Pagination | null>(null)
  const [activeTab, setActiveTab] = useState<CourseTab>('overview')
  const [bannerColor, setBannerColor] = useState<{ r: number; g: number; b: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPostsLoading, setIsPostsLoading] = useState(false)
  const [isMediaLoading, setIsMediaLoading] = useState(false)
  const [isHighlightsLoading, setIsHighlightsLoading] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [preview, setPreview] = useState<{ attachment: PostAttachment; url: string; gallery: PostAttachment[] } | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const isPostsLoadingRef = useRef(false)
  const isMediaLoadingRef = useRef(false)
  const isHighlightsLoadingRef = useRef(false)
  const canEditCourse = user?.role === 'admin'

  const loadProfile = useCallback(async () => {
    if (!accessToken || !courseId) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetchCourseProfile(accessToken, courseId)
      setProfile(response)
      setBannerColor(null)
      setPosts([])
      setPostsPagination(null)
      setMedia([])
      setMediaPagination(null)
      setHighlights([])
      setHighlightsPagination(null)
      setActiveTab('overview')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, courseId])

  const loadPosts = useCallback(
    async (page: number) => {
      if (!accessToken || !courseId || isPostsLoadingRef.current) {
        return
      }

      isPostsLoadingRef.current = true
      setIsPostsLoading(true)
      try {
        const response = await fetchCoursePosts(accessToken, courseId, page, PAGE_SIZE)
        setPosts((current) => (page === 1 ? response.posts : [...current, ...response.posts]))
        setPostsPagination(response.pagination)
      } finally {
        isPostsLoadingRef.current = false
        setIsPostsLoading(false)
      }
    },
    [accessToken, courseId],
  )

  const loadMedia = useCallback(
    async (page: number) => {
      if (!accessToken || !courseId || isMediaLoadingRef.current) {
        return
      }

      isMediaLoadingRef.current = true
      setIsMediaLoading(true)
      try {
        const response = await fetchCourseMedia(accessToken, courseId, page, PAGE_SIZE)
        setMedia((current) => (page === 1 ? response.items : [...current, ...response.items]))
        setMediaPagination(response.pagination)
      } finally {
        isMediaLoadingRef.current = false
        setIsMediaLoading(false)
      }
    },
    [accessToken, courseId],
  )

  const loadHighlights = useCallback(
    async (page: number) => {
      if (!accessToken || !courseId || isHighlightsLoadingRef.current) {
        return
      }

      isHighlightsLoadingRef.current = true
      setIsHighlightsLoading(true)
      try {
        const response = await fetchCourseHighlights(accessToken, courseId, page, PAGE_SIZE)
        setHighlights((current) => (page === 1 ? response.items : [...current, ...response.items]))
        setHighlightsPagination(response.pagination)
      } finally {
        isHighlightsLoadingRef.current = false
        setIsHighlightsLoading(false)
      }
    },
    [accessToken, courseId],
  )

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (!profile) {
      return
    }

    void loadPosts(1)
    void loadMedia(1)
    void loadHighlights(1)
  }, [loadHighlights, loadMedia, loadPosts, profile])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return
        }

        if ((activeTab === 'posts' || activeTab === 'overview') && postsPagination && postsPagination.page < postsPagination.totalPages) {
          void loadPosts(postsPagination.page + 1)
        }

        if ((activeTab === 'media' || activeTab === 'overview') && mediaPagination && mediaPagination.page < mediaPagination.totalPages) {
          void loadMedia(mediaPagination.page + 1)
        }

        if (
          (activeTab === 'highlights' || activeTab === 'overview') &&
          highlightsPagination &&
          highlightsPagination.page < highlightsPagination.totalPages
        ) {
          void loadHighlights(highlightsPagination.page + 1)
        }
      },
      { rootMargin: '360px 0px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [
    activeTab,
    highlightsPagination,
    loadHighlights,
    loadMedia,
    loadPosts,
    mediaPagination,
    postsPagination,
  ])

  useEffect(() => {
    return () => {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url)
      }
    }
  }, [preview?.url])

  const handleVote = async (post: AcademicPost, direction: 1 | -1) => {
    if (!accessToken) {
      return
    }

    const nextVote = post.votes.userVote === direction ? 0 : direction
    const response = await voteOnPost(accessToken, post.id, nextVote)
    const updatePostVote = (item: AcademicPost) => (item.id === post.id ? { ...item, votes: response.votes } : item)

    setPosts((current) => current.map(updatePostVote))
    setMedia((current) => current.map((item) => (item.type === 'post' ? { ...item, post: updatePostVote(item.post) } : item)))
    setHighlights((current) => current.map((item) => (item.type === 'post' ? { ...item, post: updatePostVote(item.post) } : item)))
  }

  const handlePreview = async (attachment: PostAttachment, gallery: PostAttachment[]) => {
    if (!accessToken) {
      return
    }

    setPreview((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url)
      }
      return null
    })

    const blob = await fetchAttachmentPreview(accessToken, attachment.file.id)
    const url = URL.createObjectURL(blob)
    setPreview({ attachment, url, gallery })
  }

  const handleDownload = async (attachment: PostAttachment) => {
    if (!accessToken) {
      return
    }

    const blob = await fetchAttachmentDownload(accessToken, attachment.file.id)
    downloadBlob(blob, attachment.file.originalName)
  }

  const handlePreviewNavigation = (direction: 1 | -1) => {
    if (!preview) {
      return
    }

    const currentIndex = preview.gallery.findIndex((attachment) => attachment.id === preview.attachment.id)
    const nextIndex = (currentIndex + direction + preview.gallery.length) % preview.gallery.length
    const nextAttachment = preview.gallery[nextIndex]
    if (nextAttachment) {
      void handlePreview(nextAttachment, preview.gallery)
    }
  }

  const replaceCourse = (course: CourseProfilePayload['course']) => {
    setProfile((current) => (current ? { ...current, course } : current))
  }

  const renderPost = (post: AcademicPost) => (
    <PostCard
      key={post.id}
      post={post}
      accessToken={accessToken}
      onEdit={() => undefined}
      onDelete={() => undefined}
      onVote={handleVote}
      onPreview={handlePreview}
      onDownload={handleDownload}
    />
  )

  const renderActivityItem = (item: CourseActivityItem) => {
    if (item.type === 'post') {
      return renderPost(item.post)
    }

    return <CommentActivityCard key={item.id} item={item} onPreview={handlePreview} onDownload={handleDownload} />
  }

  const overviewItems = useMemo<CourseActivityItem[]>(() => {
    return [
      ...posts.slice(0, 4).map((post) => ({
        type: 'post' as const,
        id: post.id,
        createdAt: post.createdAt,
        upvotes: Math.max(0, post.votes.score),
        post,
      })),
      ...media.slice(0, 4),
      ...highlights.slice(0, 4),
    ]
      .filter((item, index, items) => items.findIndex((candidate) => candidate.type === item.type && candidate.id === item.id) === index)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
  }, [highlights, media, posts])

  const canLoadMore = useMemo(() => {
    if (activeTab === 'posts') {
      return Boolean(postsPagination && postsPagination.page < postsPagination.totalPages)
    }
    if (activeTab === 'media') {
      return Boolean(mediaPagination && mediaPagination.page < mediaPagination.totalPages)
    }
    if (activeTab === 'highlights') {
      return Boolean(highlightsPagination && highlightsPagination.page < highlightsPagination.totalPages)
    }

    return Boolean(
      (postsPagination && postsPagination.page < postsPagination.totalPages) ||
        (mediaPagination && mediaPagination.page < mediaPagination.totalPages) ||
        (highlightsPagination && highlightsPagination.page < highlightsPagination.totalPages),
    )
  }, [activeTab, highlightsPagination, mediaPagination, postsPagination])

  const tabs: Array<{ id: CourseTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'posts', label: 'Posts' },
    { id: 'media', label: 'Midia' },
    { id: 'highlights', label: 'Destaque' },
  ]

  if (isLoading) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Carregando curso...</div>
      </section>
    )
  }

  if (!profile) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <EmptyState title="Curso indisponivel" description="Nao foi possivel carregar os dados do curso agora." />
      </section>
    )
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="h-36 rounded-t-lg" style={getBannerStyle(bannerColor)} />
        <div className="px-5 pb-5 sm:px-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <UserAvatar
              name={profile.course.name}
              avatarUrl={profile.course.avatarUrl}
              token={accessToken}
              className="relative z-10 size-24 border-4 border-white text-2xl shadow-sm"
              onDominantColor={setBannerColor}
            />
            {canEditCourse ? (
              <Button type="button" variant="outline" className="gap-2 self-start sm:self-auto" onClick={() => setIsEditOpen(true)}>
                <Edit3 className="size-4" />
                Editar curso
              </Button>
            ) : null}
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-semibold text-slate-950">{profile.course.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">{profile.course.bio || 'Sem bio por enquanto.'}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-700">{profile.summary.postsCount} posts</span>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-700">{profile.summary.mediaCount} midias</span>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-700">{profile.summary.studentsCount} alunos</span>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-700">{profile.summary.subjectsCount} disciplinas</span>
            </div>
          </div>
        </div>

        <nav className="flex overflow-x-auto border-t border-slate-200" aria-label="Abas do curso">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`min-w-28 flex-1 border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-red-700 text-red-700'
                  : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
              aria-pressed={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-4">
          {overviewItems.length === 0 && !isPostsLoading && !isMediaLoading && !isHighlightsLoading ? (
            <EmptyState title="Nenhuma atividade encontrada" description="Posts, midias e destaques do curso aparecerao aqui." />
          ) : (
            overviewItems.map((item) => (
              <div key={`overview-${item.type}-${item.id}`} className="space-y-2">
                <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                  {item.type === 'post' ? 'Post do curso' : 'Comentario com midia'}
                </div>
                {renderActivityItem(item)}
              </div>
            ))
          )}
        </div>
      ) : null}

      {activeTab === 'posts' ? (
        <div className="space-y-4">
          {posts.length === 0 && !isPostsLoading ? (
            <EmptyState title="Nenhum post publicado" description="Os posts relacionados ao curso aparecerao aqui." />
          ) : (
            posts.map(renderPost)
          )}
        </div>
      ) : null}

      {activeTab === 'media' ? (
        <div className="space-y-4">
          {media.length === 0 && !isMediaLoading ? (
            <EmptyState title="Nenhuma midia encontrada" description="Posts e comentarios com anexos aparecerao aqui." />
          ) : (
            media.map(renderActivityItem)
          )}
        </div>
      ) : null}

      {activeTab === 'highlights' ? (
        <div className="space-y-4">
          {highlights.length === 0 && !isHighlightsLoading ? (
            <EmptyState title="Nenhum destaque encontrado" description="Posts e comentarios com mais upvotes aparecerao aqui." />
          ) : (
            highlights.map(renderActivityItem)
          )}
        </div>
      ) : null}

      <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      {isPostsLoading || isMediaLoading || isHighlightsLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Carregando mais itens...</div>
      ) : null}
      {!canLoadMore && (posts.length > 0 || media.length > 0 || highlights.length > 0) ? (
        <p className="pb-2 text-center text-xs text-slate-400">Voce chegou ao fim da lista.</p>
      ) : null}

      {isEditOpen && canEditCourse ? (
        <EditCourseModal
          key={profile.course.id}
          open={isEditOpen}
          profile={profile}
          token={accessToken}
          onClose={() => setIsEditOpen(false)}
          onSaved={replaceCourse}
        />
      ) : null}

      <Modal
        open={Boolean(preview)}
        onClose={() => {
          setPreview((current) => {
            if (current?.url) {
              URL.revokeObjectURL(current.url)
            }
            return null
          })
        }}
      >
        {preview ? (
          <div className="max-h-[90vh] w-[min(92vw,960px)] overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{preview.attachment.file.originalName}</p>
                <p className="text-xs text-slate-500">{formatSize(preview.attachment.file.size)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="icon-sm" title="Download" onClick={() => handleDownload(preview.attachment)}>
                  <Download />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" title="Fechar" onClick={() => setPreview(null)}>
                  <X />
                </Button>
              </div>
            </div>
            <div className="relative h-[70vh] bg-slate-100">
              {preview.attachment.file.mimeType === 'application/pdf' ? (
                <iframe className="h-full w-full" src={preview.url} title={preview.attachment.file.originalName} />
              ) : preview.attachment.file.mimeType.startsWith('image/') ? (
                <img className="h-full w-full object-contain" src={preview.url} alt={preview.attachment.file.originalName} />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  <ImageIcon className="size-8" />
                </div>
              )}
              {preview.attachment.file.mimeType.startsWith('image/') && preview.gallery.length > 1 ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-lg"
                    title="Imagem anterior"
                    className="absolute top-1/2 left-3 -translate-y-1/2 bg-white/90 text-slate-800 shadow-sm"
                    onClick={() => handlePreviewNavigation(-1)}
                  >
                    <ArrowLeft />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-lg"
                    title="Proxima imagem"
                    className="absolute top-1/2 right-3 -translate-y-1/2 bg-white/90 text-slate-800 shadow-sm"
                    onClick={() => handlePreviewNavigation(1)}
                  >
                    <ArrowRight />
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  )
}

export { CourseProfilePage }
