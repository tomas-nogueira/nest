import { useAuth } from '../hooks/useAuth';

const DashboardPage = () => {
	const { user } = useAuth();

	return (
		<section className="grid w-full gap-8 lg:grid-cols-[1.4fr_0.9fr]">
			<div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
				<p className="text-sm font-semibold tracking-[0.25em] text-slate-500 uppercase">
					Home
				</p>
				<h1 className="text-3xl font-semibold text-slate-900">
					Bem-vindo, {user?.name ?? 'usuário'}
				</h1>
				<p className="max-w-2xl text-sm leading-6 text-slate-600">
					Essa é a área inicial depois do login. A navegação ficou reduzida a uma
					única entrada para manter o fluxo simples enquanto o restante das
					features é conectado.
				</p>
			</div>

			<div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
				<p className="text-sm font-medium text-slate-500">Usuário atual</p>
				<div className="mt-4 space-y-2">
					<p className="text-xl font-semibold text-slate-900">{user?.name}</p>
					<p className="text-sm text-slate-600">{user?.email}</p>
					<p className="text-sm text-slate-600">Telefone: {user?.phone ?? 'não informado'}</p>
				</div>
			</div>
		</section>
	);
};

export { DashboardPage };
