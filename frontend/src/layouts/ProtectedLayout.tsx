import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedLayout = () => {
	const { user, signOut } = useAuth();

	return (
		<main className="min-h-screen text-slate-100">
			<div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.16),_transparent_28%)]" />

			<div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-8">
				<header className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-md">
					<Link to="/dashboard" className="space-y-0.5">
						<p className="text-sm font-semibold tracking-[0.25em] text-cyan-300 uppercase">
							Nest Backup
						</p>
						<p className="text-xs text-slate-300">Área autenticada</p>
					</Link>

					<div className="flex items-center gap-3">
						<div className="hidden text-right sm:block">
							<p className="text-sm font-medium text-white">{user?.name}</p>
							<p className="text-xs text-slate-400">{user?.email}</p>
						</div>

						<button
							type="button"
							onClick={signOut}
							className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
						>
							Sair
						</button>
					</div>
				</header>

				<div className="flex flex-1 py-10">
					<Outlet />
				</div>
			</div>
		</main>
	);
};

export { ProtectedLayout };
