import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedLayout = () => {
  return (
	<main className="min-h-screen">
	  <div className="w-full max-w-4xl mx-auto px-4 py-8">
		<Outlet />
	  </div>
	</main>
  )
}

export { ProtectedLayout }
