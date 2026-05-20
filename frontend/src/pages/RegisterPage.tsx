import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Card, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'

const RegisterPage = () => {
	const { signUp, isLoading } = useAuth()
	const navigate = useNavigate()
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		setError(null)

		try {
			await signUp({ name, email, password })
			navigate('/dashboard', { replace: true })
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Falha ao criar a conta.')
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

				<form onSubmit={handleSubmit} className="mt-6">
					<div className="space-y-4">
						<div>
							<Label>Nome completo</Label>
							<Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
						</div>

						<div>
							<Label>E-mail</Label>
							<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@empresa.com" />
						</div>

						<div>
							<Label>Senha</Label>
							<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
						</div>

						{error ? <p className="rounded-2xl border border-red-400/20 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

						<Button type="submit" className="h-11 w-full rounded-lg px-6 text-base bg-rose-600 text-white hover:bg-rose-700" disabled={isLoading}>
							{isLoading ? 'Criando...' : 'Criar conta'}
						</Button>

						<p className="text-center text-sm text-slate-500">
							Já tem uma conta? <Link to="/login" className="text-rose-600 hover:underline">Entrar</Link>
						</p>
					</div>
				</form>

			</Card>
		</div>
	)
}

export { RegisterPage }
