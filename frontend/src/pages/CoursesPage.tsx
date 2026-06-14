import { useEffect, useState } from 'react'
import { Card, CardHeader, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import Modal from '../components/ui/modal'
import {
  fetchCourses,
  createCourse,
  updateCourse,
  deactivateCourse,
  type Course,
  type PaginatedResponse,
} from '../services/coursesService'

const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginatedResponse<Course> | null>(null)
  const LIMIT = 20

  const load = async (pageNum: number) => {
    setLoading(true)

    try {
      const data = await fetchCourses(pageNum, LIMIT)
      setCourses(data.data)
      setPagination(data)
      setPage(pageNum)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(1)
  }, [])

  const openNew = () => {
    setEditing(null)
    setName('')
    setIsActive(true)
    setIsModalOpen(true)
  }

  const openEdit = (course: Course) => {
    setEditing(course)
    setName(course.name)
    setIsActive(course.isActive)
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editing) {
        await updateCourse(editing.id, { name, isActive })
      } else {
        await createCourse({ name, isActive })
      }
      setIsModalOpen(false)
      await load(1)
    } catch {
      // error handled globally by request
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Desativar este curso? Estudantes vinculados não perderão seus dados.')) return
    try {
      await deactivateCourse(id)
      await load(page)
    } catch {
      // error handled globally by request
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Cursos</h1>
        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white">
          + Novo Curso
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-600">Carregando cursos...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600 mb-4">Nenhum curso encontrado.</p>
          <Button onClick={openNew} variant="outline">
            Criar primeiro curso
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {courses.map((course) => (
              <Card key={course.id} className="max-w-none flex flex-col p-4 hover:shadow-md transition-shadow">
                <CardHeader className="mb-2 px-0">
                  <h3 className="font-semibold text-slate-900 truncate">{course.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{course.isActive ? 'Ativo' : 'Inativo'}</p>
                </CardHeader>
                <CardContent className="py-3 px-0 flex-1" />
                <div className="flex items-center gap-2 mt-3">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(course)} className="flex-1 text-xs">
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(course.id)} className="flex-1 text-xs" disabled={!course.isActive}>
                    {course.isActive ? 'Desativar' : 'Desativado'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button onClick={() => load(page - 1)} disabled={page === 1} variant="outline">
                ← Anterior
              </Button>
              <span className="text-sm text-slate-600">
                Página {page} de {pagination.pages} ({pagination.total} cursos)
              </span>
              <Button onClick={() => load(page + 1)} disabled={pagination && page === pagination.pages} variant="outline">
                Próxima →
              </Button>
            </div>
          )}
        </>
      )}

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="bg-white rounded p-6 shadow-xl">
          <h3 className="text-xl font-semibold mb-4 text-slate-900">
            {editing ? 'Editar Curso' : 'Criar Curso'}
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Nome do Curso</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Engenharia de Software"
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                id="course-is-active"
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="course-is-active" className="text-sm text-slate-700">
                Curso ativo
              </Label>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button onClick={() => setIsModalOpen(false)} variant="ghost">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                {editing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export { CoursesPage }
