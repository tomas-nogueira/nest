import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Card, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'

const LoginPage = () => {
	const { signIn, isLoading } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()
	const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard'
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setError(null)

		try {
			await signIn({ email, password })
			navigate(redirectTo, { replace: true })
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Falha ao entrar.')
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<Card className="max-w-md">
				<CardHeader>
					<div className="flex flex-col items-center gap-2">
						<div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
							{/* TODO: trocar por logo real */}
							<span className="text-xl font-bold text-rose-600">N</span>
						</div>
						<h1 className="text-2xl font-semibold text-slate-900">Bem-vindo de volta</h1>
						<p className="text-sm text-slate-500">Digite suas credenciais para acessar sua conta</p>
					</div>
				</CardHeader>

				<form onSubmit={handleSubmit} className="mt-6">
					<div className="space-y-4">
						<div>
							<div className="flex items-center justify-between">
								<Label>Endereço de e-mail</Label>
							</div>
							<Input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="nome@empresa.com"
							/>
						</div>

						<div>
							<div className="flex items-center justify-between">
								<Label>Senha</Label>
							</div>
							<Input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
							/>
						</div>

						{error ? (
							<p className="rounded-2xl border border-red-400/20 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
						) : null}

						<Button
							type="submit"
							className="h-11 w-full rounded-lg px-6 text-base bg-rose-600 text-white hover:bg-rose-700"
							disabled={isLoading}
						>
							{isLoading ? 'Entrando...' : 'Entrar'}
						</Button>

						<p className="text-center text-sm text-slate-500">
							Não tem uma conta? <Link to="/register" className="text-rose-600 hover:underline">Cadastre-se</Link>
						</p>
					</div>
				</form>

			</Card>
		</div>
	)
}

export { LoginPage }
