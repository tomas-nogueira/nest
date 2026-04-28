import { useAuth } from '../hooks/useAuth';

const DashboardPage = () => {
	const { user } = useAuth();

	return (
		<section className="grid w-full gap-8 lg:grid-cols-[1.4fr_0.9fr]">
			<div className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
				<p className="text-sm font-semibold tracking-[0.25em] text-cyan-300 uppercase">
					Dashboard
				</p>
				<h1 className="text-3xl font-semibold text-white">
					Bem-vindo, {user?.name ?? 'usuário'}
				</h1>
				<p className="max-w-2xl text-sm leading-6 text-slate-300">
					Essa área já está protegida por rota e pronta para receber as próximas
					features do backend, com login via JWT, bcrypt e carregamento do perfil
					autenticado.
				</p>
			</div>

			<div className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
				<p className="text-sm font-medium text-slate-400">Usuário atual</p>
				<div className="mt-4 space-y-2">
					<p className="text-xl font-semibold text-white">{user?.name}</p>
					<p className="text-sm text-slate-300">{user?.email}</p>
					<p className="text-sm text-slate-300">Telefone: {user?.phone ?? 'não informado'}</p>
				</div>
			</div>
		</section>
	);
};

export { DashboardPage };
