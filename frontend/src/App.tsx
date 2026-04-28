import heroImg from './assets/hero.png'

function App() {
  return (
    <main className="relative overflow-hidden text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.18),_transparent_28%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-8">
        <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
          <div>
            <p className="text-sm font-semibold tracking-[0.25em] text-violet-300 uppercase">
              Nest Backup
            </p>
            <p className="text-xs text-slate-300">Frontend em React + Tailwind</p>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Pronto para integrar
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-8">
            <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 shadow-lg shadow-violet-950/20 backdrop-blur">
              Nova base visual para o projeto
            </span>

            <div className="space-y-5">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Uma tela inicial moderna para começar o{' '}
                <span className="bg-gradient-to-r from-violet-300 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
                  dashboard
                </span>
                .
              </h1>

              <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                O frontend agora está configurado com Tailwind CSS para acelerar a
                criação de interfaces e deixar a base pronta para consumir a API
                do backend.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="#overview"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-medium text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Ver visão geral
              </a>
              <a
                href="https://tailwindcss.com/docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 font-medium text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Documentação Tailwind
              </a>
            </div>

            <div id="overview" className="grid gap-4 sm:grid-cols-3">
              {[
                ['UI pronta', 'Layout responsivo com utilitários Tailwind'],
                ['Integração', 'Preparado para consumir rotas do backend'],
                ['Escalável', 'Base limpa para novas páginas e componentes'],
              ].map(([title, description]) => (
                <article
                  key={title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/10 backdrop-blur"
                >
                  <h2 className="text-sm font-semibold text-white">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-10 h-24 w-24 rounded-full bg-sky-400/20 blur-3xl" />
            <div className="absolute -right-4 bottom-0 h-32 w-32 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-5">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Preview da interface</span>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-300">
                    Online
                  </span>
                </div>

                <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-800/60">
                  <img
                    src={heroImg}
                    alt="Preview da interface"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Stack</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      React + Vite + Tailwind
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Status</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      Pronto para evoluir
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
