import { Link, NavLink, Outlet } from 'react-router-dom';

const linkClassName = ({ isActive }: { isActive: boolean }) =>
	[
		'rounded-full px-4 py-2 text-sm font-medium transition',
		isActive
			? 'bg-white text-slate-950'
			: 'text-slate-300 hover:bg-white/10 hover:text-white',
	].join(' ');

const PublicLayout = () => {
	return (
		<main className="min-h-screen text-slate-100">
			<div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.18),_transparent_28%)]" />

			<div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-8">
				<header className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
					<Link to="/" className="space-y-0.5">
						<p className="text-sm font-semibold tracking-[0.25em] text-violet-300 uppercase">
							Nest Backup
						</p>
						<p className="text-xs text-slate-300">Frontend em React + Router</p>
					</Link>

					<nav className="flex items-center gap-2">
						<NavLink to="/" className={linkClassName} end>
							Início
						</NavLink>
						<NavLink to="/login" className={linkClassName}>
							Entrar
						</NavLink>
						<NavLink to="/register" className={linkClassName}>
							Criar conta
						</NavLink>
					</nav>
				</header>

				<div className="flex flex-1 items-center py-10">
					<Outlet />
				</div>
			</div>
		</main>
	);
};

export { PublicLayout };
