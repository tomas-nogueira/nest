import { useEffect, useState } from 'react'
import { Card, CardHeader, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import Modal from '../components/ui/modal'
import { fetchSubjects, createSubject, updateSubject, deleteSubject, type Subject, type PaginatedResponse } from '../services/subjectsService'

const SubjectsPage = () => {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [name, setName] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginatedResponse<Subject> | null>(null)
  const LIMIT = 20

  const load = async (pageNum: number) => {
    setLoading(true)
    try {
      const data = await fetchSubjects(pageNum, LIMIT)
      setSubjects(data.data)
      setPagination(data)
      setPage(pageNum)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
  }, [])

  const openNew = () => {
    setEditing(null)
    setName('')
    setIsModalOpen(true)
  }

  const openEdit = (s: Subject) => {
    setEditing(s)
    setName(s.name)
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editing) {
        await updateSubject(editing.id, { name })
      } else {
        await createSubject({ name })
      }
      setIsModalOpen(false)
      await load(1)
    } catch {
      // error handled globally by request
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir essa matéria?')) return
    try {
      await deleteSubject(id)
      await load(page)
    } catch {
      // handled globally
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Matérias</h1>
        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white">
          + Nova Matéria
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-600">Carregando matérias...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600 mb-4">Nenhuma matéria encontrada.</p>
          <Button onClick={openNew} variant="outline">
            Criar primeira matéria
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {subjects.map((s) => (
              <Card key={s.id} className="max-w-none flex flex-col p-4 hover:shadow-md transition-shadow">
                <CardHeader className="mb-2 px-0">
                  <h3 className="font-semibold text-slate-900 truncate">{s.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{new Date(s.createdAt).toLocaleDateString()}</p>
                </CardHeader>
                <CardContent className="py-3 px-0 flex-1" />
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(s)}
                    className="flex-1 text-xs"
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(s.id)}
                    className="flex-1 text-xs"
                  >
                    Excluir
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                onClick={() => load(page - 1)}
                disabled={page === 1}
                variant="outline"
              >
                ← Anterior
              </Button>
              <span className="text-sm text-slate-600">
                Página {page} de {pagination.pages} ({pagination.total} matérias)
              </span>
              <Button
                onClick={() => load(page + 1)}
                disabled={page === pagination.pages}
                variant="outline"
              >
                Próxima →
              </Button>
            </div>
          )}
        </>
      )}

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="bg-white rounded p-6 shadow-xl">
          <h3 className="text-xl font-semibold mb-4 text-slate-900">
            {editing ? 'Editar Matéria' : 'Criar Matéria'}
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Nome da Matéria</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Cálculo I"
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button onClick={() => setIsModalOpen(false)} variant="ghost">
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export { SubjectsPage }

