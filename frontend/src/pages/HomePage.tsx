import { Link } from 'react-router-dom';

const HomePage = () => {
	return (
		<section className="grid flex-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
			<div className="space-y-8">
				<span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 shadow-lg shadow-violet-950/20 backdrop-blur">
					Base de navegação pronta
				</span>

				<div className="space-y-5">
					<h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
						Uma estrutura de páginas moderna para o seu {
							<span className="bg-gradient-to-r from-violet-300 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
								dashboard
							</span>
						}.
					</h1>

					<p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
						As rotas agora estão separadas por responsabilidade: páginas públicas,
						área autenticada e guard de acesso, usando React Router DOM.
					</p>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row">
					<Link
						to="/login"
						className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-medium text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100"
					>
						Entrar
					</Link>
					<Link
						to="/dashboard"
						className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 font-medium text-white transition hover:-translate-y-0.5 hover:bg-white/10"
					>
						Ir para dashboard
					</Link>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
				{[
					['Rotas', 'Públicas e privadas separadas em layouts próprios'],
					['Auth Context', 'Estado do usuário centralizado no front'],
					['Hook customizado', 'Consumo simples com useAuth()'],
				].map(([title, description]) => (
					<article
						key={title}
						className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/10 backdrop-blur"
					>
						<h2 className="text-sm font-semibold text-white">{title}</h2>
						<p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
					</article>
				))}
			</div>
		</section>
	);
};

export { HomePage };
