import { Outlet } from 'react-router-dom';

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
