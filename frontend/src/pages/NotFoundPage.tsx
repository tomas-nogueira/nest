import { Link } from 'react-router-dom';

const NotFoundPage = () => {
	return (
		<section className="mx-auto flex max-w-2xl flex-col items-start gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
			<p className="text-sm font-semibold tracking-[0.25em] text-violet-300 uppercase">
				404
			</p>
			<h1 className="text-3xl font-semibold text-white">Página não encontrada</h1>
			<p className="text-sm leading-6 text-slate-300">
				A rota solicitada não existe. Volte para a página inicial ou faça login.
			</p>
			<div className="flex gap-3">
				<Link
					to="/"
					className="rounded-full bg-white px-5 py-2.5 font-medium text-slate-950"
				>
					Início
				</Link>
				<Link
					to="/login"
					className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 font-medium text-white"
				>
					Entrar
				</Link>
			</div>
		</section>
	);
};

export { NotFoundPage };
