import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RegisterPage = () => {
	const { signUp, isLoading } = useAuth();
	const navigate = useNavigate();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		setError(null);

		try {
			await signUp({ name, email, password });
			navigate('/dashboard', { replace: true });
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Falha ao criar a conta.');
		}
	};

	return (
		<section className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-2">
			<div className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
				<p className="text-sm font-semibold tracking-[0.25em] text-cyan-300 uppercase">
					Cadastro
				</p>
				<h1 className="text-3xl font-semibold text-white">Crie sua conta</h1>
				<p className="max-w-md text-sm leading-6 text-slate-300">
					O cadastro também já está conectado à API e devolve access token para
					persistir a sessão.
				</p>
			</div>

			<form
				onSubmit={handleSubmit}
				className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl"
			>
				<div className="space-y-5">
					<label className="block space-y-2">
						<span className="text-sm font-medium text-slate-200">Nome</span>
						<input
							type="text"
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="Seu nome"
							className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
						/>
					</label>

					<label className="block space-y-2">
						<span className="text-sm font-medium text-slate-200">E-mail</span>
						<input
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							placeholder="voce@exemplo.com"
							className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
						/>
					</label>

					<label className="block space-y-2">
						<span className="text-sm font-medium text-slate-200">Senha</span>
						<input
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder="••••••••"
							className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
						/>
					</label>

					{error ? (
						<p className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
							{error}
						</p>
					) : null}

					<button
						type="submit"
						disabled={isLoading}
						className="w-full rounded-2xl bg-white px-4 py-3 font-medium text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
					>
						{isLoading ? 'Criando...' : 'Criar conta'}
					</button>

					<p className="text-center text-sm text-slate-400">
						Já tem conta?{' '}
						<Link to="/login" className="text-cyan-300 hover:text-cyan-200">
							Entrar
						</Link>
					</p>
				</div>
			</form>
		</section>
	);
};

export { RegisterPage };
