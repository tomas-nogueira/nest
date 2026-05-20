import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
	<section className="min-h-[60vh] flex items-center justify-center">
	  <div className="text-center">
		<h1 className="text-2xl font-semibold text-slate-900">Welcome</h1>
		<p className="mt-2 text-sm text-slate-500">Please sign in to access the dashboard.</p>
		<div className="mt-4 flex justify-center gap-3">
		  <Link to="/login" className="px-4 py-2 rounded-md bg-rose-600 text-white">Sign in</Link>
		</div>
	  </div>
	</section>
  )
}

export { HomePage }
