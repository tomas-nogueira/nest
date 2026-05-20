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
	<main className="min-h-screen">
	  <div className="w-full max-w-3xl mx-auto px-4 py-8">
		<Outlet />
	  </div>
	</main>
  )
}

export { PublicLayout }
