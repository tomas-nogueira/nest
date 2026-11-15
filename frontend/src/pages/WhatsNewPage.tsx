import { useCallback, useEffect, useRef, useState } from 'react'
import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import Modal from '../components/ui/modal'
import {
  createChangeLog,
  deleteChangeLog,
  fetchChangeLogs,
  updateChangeLog,
  type ChangeLog,
  type ChangeLogInput,
  type ChangeLogListResponse,
} from '../services/changelogService'

const LIMIT = 5

type FormMode = 'create' | 'edit'

type FormState = {
  mode: FormMode
  item?: ChangeLog
}

const formatPublicationDate = (date: string) => {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(date))
}

const validateForm = (title: string, description: string) => {
  const trimmedTitle = title.trim()
  const trimmedDescription = description.trim()

  if (!trimmedTitle) return 'O título é obrigatório.'
  if (trimmedTitle.length > 120) return 'O título deve ter até 120 caracteres.'
  if (!trimmedDescription) return 'A descrição é obrigatória.'
  if (trimmedDescription.length > 2000) return 'A descrição deve ter até 2000 caracteres.'
  return null
}

const WhatsNewPage = () => {
  const { accessToken, user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedPage = Number(searchParams.get('page') ?? '1')
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const [response, setResponse] = useState<ChangeLogListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [itemToDelete, setItemToDelete] = useState<ChangeLog | null>(null)
  const requestId = useRef(0)
  const isAdmin = user?.role === 'admin'

  const load = useCallback(async (pageToLoad: number) => {
    const currentRequestId = ++requestId.current
    setLoading(true)
    setError(null)

    try {
      const data = await fetchChangeLogs(pageToLoad, LIMIT, accessToken)
      if (currentRequestId === requestId.current) {
        setResponse(data)
      }
    } catch (loadError) {
      if (currentRequestId === requestId.current) {
        setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as novidades.')
      }
    } finally {
      if (currentRequestId === requestId.current) {
        setLoading(false)
      }
    }
  }, [accessToken])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load(page)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [load, page])

  const changePage = (nextPage: number) => {
    setSearchParams({ page: String(nextPage) })
  }

  const openCreate = () => {
    setFormState({ mode: 'create' })
    setTitle('')
    setDescription('')
    setFormError(null)
  }

  const openEdit = (item: ChangeLog) => {
    setFormState({ mode: 'edit', item })
    setTitle(item.title)
    setDescription(item.description)
    setFormError(null)
  }

  const closeForm = () => {
    if (!saving) setFormState(null)
  }

  const save = async () => {
    const validationError = validateForm(title, description)
    if (validationError) {
      setFormError(validationError)
      return
    }

    const input: ChangeLogInput = { title: title.trim(), description: description.trim() }
    setSaving(true)
    setFormError(null)

    try {
      if (formState?.mode === 'edit' && formState.item) {
        await updateChangeLog(formState.item.id, input, accessToken)
        setFormState(null)
        await load(page)
      } else {
        await createChangeLog(input, accessToken)
        setFormState(null)
        if (page === 1) {
          await load(1)
        } else {
          changePage(1)
        }
      }
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar a novidade.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item: ChangeLog) => {
    setDeletingId(item.id)
    try {
      await deleteChangeLog(item.id, accessToken)
      const nextPage = response && response.items.length === 1 && page > 1 ? page - 1 : page
      if (nextPage !== page) {
        changePage(nextPage)
      } else {
        await load(page)
      }
    } catch {
      // O request centralizado já exibe o erro para o usuário.
    } finally {
      setDeletingId(null)
      setItemToDelete(null)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="size-5 text-red-700" />
            <h1 className="text-2xl font-semibold text-slate-900">Novidades</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Acompanhe as mudanças mais recentes da plataforma.</p>
        </div>
        {isAdmin ? (
          <Button onClick={openCreate} className="bg-blue-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md">
            <Plus className="size-4" />
            Incluir novidades
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-600">Carregando novidades...</div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="mb-4 text-slate-600">{error}</p>
          <Button onClick={() => void load(page)} variant="outline">Tentar novamente</Button>
        </div>
      ) : response?.items.length ? (
        <>
          <div className="grid grid-cols-1 gap-4">
            {response.items.map((item) => (
              <Card key={item.id} className="max-w-none bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader className="mb-4 px-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-600">
                      <span className="font-medium text-slate-700">{item.author.name}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {formatPublicationDate(item.publicationDate)}
                      </span>
                    </div>
                    {isAdmin ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button type="button" size="icon-sm" variant="ghost" aria-label="Editar novidade" onClick={() => openEdit(item)} className="hover:bg-blue-50 hover:text-blue-700">
                          <Pencil />
                        </Button>
                        <Button type="button" size="icon-sm" variant="ghost" aria-label="Excluir novidade" onClick={() => setItemToDelete(item)} disabled={deletingId === item.id} className="hover:bg-red-50 hover:text-red-700">
                          <Trash2 />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-900">{item.title}</h2>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {response.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button onClick={() => changePage(page - 1)} disabled={page === 1} variant="outline">Anterior</Button>
              <span className="text-sm text-slate-600">Pagina {page} de {response.totalPages}</span>
              <Button onClick={() => changePage(page + 1)} disabled={page === response.totalPages} variant="outline">Proxima</Button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="py-12 text-center">
          <p className="mb-4 text-slate-600">Nenhuma novidade publicada ainda.</p>
          {isAdmin ? <Button onClick={openCreate} variant="outline">Incluir novidade</Button> : null}
        </div>
      )}

      <Modal open={Boolean(formState)} onClose={closeForm}>
        <div className="w-[min(32rem,calc(100vw-2rem))] rounded bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            {formState?.mode === 'edit' ? 'Editar novidade' : 'Incluir novidade'}
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="changelog-title">Título</Label>
              <Input id="changelog-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="changelog-description">Descrição</Label>
              <textarea
                id="changelog-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={2000}
                rows={7}
                className="mt-1 w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-cyan-500"
              />
            </div>
            {formError ? <p className="text-sm text-red-700">{formError}</p> : null}
            <div className="flex items-center justify-end gap-3">
              <Button onClick={closeForm} variant="ghost" disabled={saving}>Cancelar</Button>
              <Button onClick={() => void save()} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700">
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(itemToDelete)} onClose={() => (deletingId ? undefined : setItemToDelete(null))}>
        <div className="w-[min(28rem,calc(100vw-2rem))] rounded bg-white p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-900">Excluir novidade?</h2>
          <p className="mt-2 text-sm text-slate-600">
            A novidade &quot;{itemToDelete?.title}&quot; será excluída permanentemente.
          </p>
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button onClick={() => setItemToDelete(null)} variant="ghost" disabled={Boolean(deletingId)}>Cancelar</Button>
            <Button onClick={() => itemToDelete && void remove(itemToDelete)} variant="destructive" disabled={Boolean(deletingId)}>
              {deletingId ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export { WhatsNewPage }
