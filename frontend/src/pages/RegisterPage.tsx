import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Card, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'
import { fetchCourses, type Course } from '../services/coursesService'

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
				setCourses(response.data)
				setCourseId(response.data[0]?.id ?? '')
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
							<select
								value={courseId}
								onChange={(e) => setCourseId(e.target.value)}
								disabled={isLoadingCourses || courses.length === 0}
								className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-rose-600"
							>
								{courses.length === 0 ? (
									<option value="">Carregando cursos...</option>
								) : (
									<>
										<option value="">Selecione um curso</option>
										{courses.map((course) => (
											<option key={course.id} value={course.id}>
												{course.name}
											</option>
										))}
									</>
								)}
							</select>
							{!isLoadingCourses && courses.length === 0 ? (
								<p className="mt-2 text-sm text-slate-500">
									Nenhum curso disponível. Peça para um administrador criar um curso antes de se registrar.
								</p>
							) : null}
						</div>

						<div>
							<Label>Senha</Label>
							<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
						</div>

						<Button type="submit" className="w-full" disabled={isLoading || isLoadingCourses || !courseId}>
							Criar conta
						</Button>

						<p className="text-center text-sm text-slate-500">
							Já tem uma conta? <Link to="/login" className="text-rose-600 hover:underline">Entrar</Link>
						</p>
					</form>
				</div>
			</Card>
		</div>
	)
}

export { RegisterPage }
