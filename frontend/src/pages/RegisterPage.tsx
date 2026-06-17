import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Card, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'
import { fetchCourses, type Course } from '../services/coursesService'

type CourseComboboxProps = {
	courses: Course[]
	value: string
	disabled?: boolean
	onChange(value: string): void
}

const OUTROS_KEY = 'outros'

const CourseCombobox = ({ courses, value, disabled, onChange }: CourseComboboxProps) => {
	const [isOpen, setIsOpen] = useState(false)
	const [query, setQuery] = useState('')
	const wrapperRef = useRef<HTMLDivElement | null>(null)
	const selectedCourse = courses.find((course) => course.id === value)
	const outrosCourse = courses.find((course) => course.nameKey === OUTROS_KEY || course.name.trim().toLocaleLowerCase('pt-BR') === OUTROS_KEY)

	const filteredCourses = useMemo(() => {
		const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
		const matches = normalizedQuery
			? courses.filter((course) => course.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery))
			: courses
		const pinned = outrosCourse ? [outrosCourse] : []
		const rest = matches.filter((course) => course.id !== outrosCourse?.id)

		return [...pinned, ...rest]
	}, [courses, outrosCourse, query])

	useEffect(() => {
		if (!isOpen) {
			return
		}

		const handlePointerDown = (event: PointerEvent) => {
			if (!wrapperRef.current?.contains(event.target as Node)) {
				setIsOpen(false)
				setQuery('')
			}
		}

		document.addEventListener('pointerdown', handlePointerDown)

		return () => document.removeEventListener('pointerdown', handlePointerDown)
	}, [isOpen])

	return (
		<div ref={wrapperRef} className="relative mt-1">
			<button
				type="button"
				disabled={disabled}
				className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 text-left text-sm text-slate-900 outline-none transition hover:bg-slate-50 focus:border-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				onClick={() => setIsOpen((current) => !current)}
			>
				<span className={selectedCourse ? 'truncate' : 'truncate text-slate-500'}>{selectedCourse?.name ?? 'Selecione um curso'}</span>
				<ChevronDown className="size-4 shrink-0 text-slate-500" />
			</button>

			{isOpen ? (
				<div className="absolute right-0 left-0 z-30 mt-2 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
					<div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-2">
						<Search className="size-4 shrink-0 text-slate-400" />
						<input
							className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
							value={query}
							placeholder="Pesquisar curso"
							onChange={(event) => setQuery(event.target.value)}
							autoFocus
						/>
					</div>
					<div className="mt-2 max-h-60 overflow-y-auto" role="listbox">
						{filteredCourses.map((course) => (
							<button
								key={course.id}
								type="button"
								className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
								onClick={() => {
									onChange(course.id)
									setIsOpen(false)
									setQuery('')
								}}
							>
								<span className="truncate">{course.name}</span>
								{value === course.id ? <Check className="size-4 text-rose-700" /> : null}
							</button>
						))}
						{filteredCourses.length === 0 ? <div className="px-2 py-3 text-sm text-slate-500">Nenhum curso encontrado.</div> : null}
					</div>
				</div>
			) : null}
		</div>
	)
}

const RegisterPage = () => {
	const { signUp, isLoading } = useAuth()
	const navigate = useNavigate()
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [courses, setCourses] = useState<Course[]>([])
	const [courseId, setCourseId] = useState('')
	const [isLoadingCourses, setIsLoadingCourses] = useState(false)

	useEffect(() => {
		const loadCourses = async () => {
			setIsLoadingCourses(true)

			try {
				const response = await fetchCourses(1, 100)
				const activeCourses = response.data.filter((course) => course.isActive)
				const outrosCourse = activeCourses.find((course) => course.nameKey === OUTROS_KEY || course.name.trim().toLocaleLowerCase('pt-BR') === OUTROS_KEY)

				setCourses(activeCourses)
				setCourseId(outrosCourse?.id ?? activeCourses[0]?.id ?? '')
			} finally {
				setIsLoadingCourses(false)
			}
		}

		void loadCourses()
	}, [])

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		try {
			await signUp({ name, email, password, courseId })
			navigate('/dashboard', { replace: true })
		} catch {
			// Error toast is handled globally by request handler.
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<Card className="max-w-md">
				<CardHeader>
					<div className="flex flex-col items-center gap-2">
						<div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
							<span className="text-xl font-bold text-rose-600">N</span>
						</div>
						<h2 className="text-2xl font-semibold text-slate-900">Criar conta</h2>
						<p className="text-sm text-slate-500">Preencha os campos abaixo para criar sua conta</p>
					</div>
				</CardHeader>

				<div className="p-6">
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Label>Nome completo</Label>
							<Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
						</div>

						<div>
							<Label>E-mail</Label>
							<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@empresa.com" />
						</div>

						<div>
							<Label>Curso</Label>
							<CourseCombobox courses={courses} value={courseId} onChange={setCourseId} disabled={isLoadingCourses || courses.length === 0} />
							{!isLoadingCourses && courses.length === 0 ? (
								<p className="mt-2 text-sm text-slate-500">
									Nenhum curso disponivel. Peca para um administrador verificar os cursos antes de se registrar.
								</p>
							) : null}
						</div>

						<div>
							<Label>Senha</Label>
							<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" />
						</div>

						<Button type="submit" className="w-full" disabled={isLoading || isLoadingCourses || !courseId}>
							Criar conta
						</Button>

						<p className="text-center text-sm text-slate-500">
							Ja tem uma conta? <Link to="/login" className="text-rose-600 hover:underline">Entrar</Link>
						</p>
					</form>
				</div>
			</Card>
		</div>
	)
}

export { RegisterPage }
