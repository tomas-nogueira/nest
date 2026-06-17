import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BookOpen, Plus, Search } from 'lucide-react'
import { Card, CardHeader, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import Modal from '../components/ui/modal'
import {
  fetchCoursesList,
  createCourse,
  updateCourse,
  deactivateCourse,
  type CourseWithSubjects,
  type CourseSubject,
  type PaginatedResponse,
} from '../services/coursesService'
import { createSubject, deleteSubject, updateSubject } from '../services/subjectsService'

type CourseModalState = {
  mode: 'create' | 'edit'
  course?: CourseWithSubjects
}

type SubjectModalState = {
  mode: 'create' | 'edit'
  course: CourseWithSubjects
  subjectLink?: CourseSubject
}

const LIMIT = 20

const CoursesPage = () => {
  const [searchParams] = useSearchParams()
  const highlightedCourseId = searchParams.get('courseId')
  const [courses, setCourses] = useState<CourseWithSubjects[]>([])
  const [loading, setLoading] = useState(false)
  const [courseModal, setCourseModal] = useState<CourseModalState | null>(null)
  const [subjectModal, setSubjectModal] = useState<SubjectModalState | null>(null)
  const [courseName, setCourseName] = useState('')
  const [courseIsActive, setCourseIsActive] = useState(true)
  const [subjectName, setSubjectName] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginatedResponse<CourseWithSubjects> | null>(null)

  const load = useCallback(async (pageNum: number, searchValue = '') => {
    setLoading(true)

    try {
      const data = await fetchCoursesList({ page: pageNum, limit: LIMIT, search: searchValue, includeSubjects: true })
      setCourses(data.data)
      setPagination(data)
      setPage(pageNum)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load(1, search)
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [load, search])

  const totalSubjects = useMemo(() => courses.reduce((total, course) => total + course.subjects.length, 0), [courses])

  const openNewCourse = () => {
    setCourseModal({ mode: 'create' })
    setCourseName('')
    setCourseIsActive(true)
  }

  const openEditCourse = (course: CourseWithSubjects) => {
    setCourseModal({ mode: 'edit', course })
    setCourseName(course.name)
    setCourseIsActive(course.isActive)
  }

  const openNewSubject = (course: CourseWithSubjects) => {
    setSubjectModal({ mode: 'create', course })
    setSubjectName('')
  }

  const openEditSubject = (course: CourseWithSubjects, subjectLink: CourseSubject) => {
    setSubjectModal({ mode: 'edit', course, subjectLink })
    setSubjectName(subjectLink.subject.name)
  }

  const handleSaveCourse = async () => {
    try {
      if (courseModal?.mode === 'edit' && courseModal.course) {
        await updateCourse(courseModal.course.id, { name: courseName, isActive: courseIsActive })
      } else {
        await createCourse({ name: courseName, isActive: courseIsActive })
      }
      setCourseModal(null)
      await load(1, search)
    } catch {
      // error handled globally by request
    }
  }

  const handleDeactivateCourse = async (course: CourseWithSubjects) => {
    if (!confirm('Desativar este curso? Estudantes vinculados nao perderao seus dados.')) return

    try {
      await deactivateCourse(course.id)
      await load(page, search)
    } catch {
      // error handled globally by request
    }
  }

  const handleSaveSubject = async () => {
    if (!subjectModal) {
      return
    }

    try {
      if (subjectModal.mode === 'edit' && subjectModal.subjectLink) {
        await updateSubject(subjectModal.subjectLink.subject.id, { name: subjectName })
      } else {
        await createSubject({ name: subjectName, courseIds: [subjectModal.course.id] })
      }

      setSubjectModal(null)
      await load(page, search)
    } catch {
      // error handled globally by request
    }
  }

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Excluir esta materia? Posts vinculados tambem podem ser afetados.')) return

    try {
      await deleteSubject(subjectId)
      await load(page, search)
    } catch {
      // error handled globally by request
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Cursos</h1>
          <p className="mt-1 text-sm text-slate-500">
            {pagination?.total ?? 0} cursos, {totalSubjects} materias nesta pagina
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="relative min-w-0 sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar curso ou materia"
              className="h-10 rounded-lg border-slate-200 bg-white py-2 pr-3 pl-9 text-sm"
            />
          </div>
          <Button onClick={openNewCourse} className="bg-blue-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md">
            <Plus className="size-4" />
            Novo Curso
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <p className="text-slate-600">Carregando cursos...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="py-12 text-center">
          <p className="mb-4 text-slate-600">Nenhum curso encontrado.</p>
          <Button onClick={openNewCourse} variant="outline" className="hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
            Criar curso
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {courses.map((course) => (
              <Card
                key={course.id}
                className={`max-w-none bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  highlightedCourseId === course.id ? 'border-red-300 ring-2 ring-red-500/20' : ''
                }`}
              >
                <CardHeader className="mb-4 px-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <h3 className="truncate font-semibold text-slate-900">{course.name}</h3>
                        {course.isSystem ? (
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Sistema</span>
                        ) : null}
                      </div>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          course.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {course.isActive ? 'Ativo' : 'Desativado'}
                      </span>
                    </div>
                    {!course.isSystem ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <Button asChild size="sm" variant="outline" className="hover:border-red-200 hover:bg-red-50 hover:text-red-700">
                          <Link to={`/courses/${course.id}`}>Perfil</Link>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEditCourse(course)} className="hover:bg-blue-50 hover:text-blue-700">
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeactivateCourse(course)} disabled={!course.isActive} className="hover:bg-red-100 hover:text-red-800">
                          {course.isActive ? 'Desativar' : 'Desativado'}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="px-0 pb-0">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <BookOpen className="size-4 text-slate-500" />
                      Materias
                    </div>
                    {!course.isSystem ? (
                      <Button size="sm" variant="outline" onClick={() => openNewSubject(course)} disabled={!course.isActive} className="hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                        <Plus className="size-4" />
                        Nova Materia
                      </Button>
                    ) : null}
                  </div>

                  {course.subjects.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">Nenhuma materia vinculada.</div>
                  ) : (
                    <div className="space-y-2">
                      {course.subjects.map((subjectLink) => (
                        <div key={subjectLink.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <span className="min-w-0 truncate text-sm text-slate-800">{subjectLink.subject.name}</span>
                          {!course.isSystem && course.isActive ? (
                            <div className="flex shrink-0 items-center gap-2">
                              <Button size="sm" variant="ghost" onClick={() => openEditSubject(course, subjectLink)} className="hover:bg-blue-50 hover:text-blue-700">
                                Editar
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteSubject(subjectLink.subject.id)} className="hover:bg-red-100 hover:text-red-800">
                                Excluir
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button onClick={() => load(page - 1, search)} disabled={page === 1} variant="outline" className="hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                Anterior
              </Button>
              <span className="text-sm text-slate-600">
                Pagina {page} de {pagination.pages} ({pagination.total} cursos)
              </span>
              <Button onClick={() => load(page + 1, search)} disabled={page === pagination.pages} variant="outline" className="hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                Proxima
              </Button>
            </div>
          )}
        </>
      )}

      <Modal open={Boolean(courseModal)} onClose={() => setCourseModal(null)}>
        <div className="rounded bg-white p-6 shadow-xl">
          <h3 className="mb-4 text-xl font-semibold text-slate-900">
            {courseModal?.mode === 'edit' ? 'Editar Curso' : 'Criar Curso'}
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Nome do Curso</Label>
              <Input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="Ex: Engenharia de Software" className="mt-1" />
            </div>
            <div className="flex items-center gap-3">
              <input
                id="course-is-active"
                type="checkbox"
                checked={courseIsActive}
                onChange={(event) => setCourseIsActive(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="course-is-active" className="text-sm text-slate-700">
                Curso ativo
              </Label>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button onClick={() => setCourseModal(null)} variant="ghost" className="hover:bg-slate-100 hover:text-slate-900">
                Cancelar
              </Button>
              <Button onClick={handleSaveCourse} className="bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md">
                {courseModal?.mode === 'edit' ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(subjectModal)} onClose={() => setSubjectModal(null)}>
        <div className="rounded bg-white p-6 shadow-xl">
          <h3 className="mb-4 text-xl font-semibold text-slate-900">
            {subjectModal?.mode === 'edit' ? 'Editar Materia' : 'Criar Materia'}
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Curso</Label>
              <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{subjectModal?.course.name}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Nome da Materia</Label>
              <Input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="Ex: Calculo I" className="mt-1" />
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button onClick={() => setSubjectModal(null)} variant="ghost" className="hover:bg-slate-100 hover:text-slate-900">
                Cancelar
              </Button>
              <Button onClick={handleSaveSubject} className="bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md">
                {subjectModal?.mode === 'edit' ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export { CoursesPage }
