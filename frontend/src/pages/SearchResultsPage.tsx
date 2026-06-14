import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Clock, FileText, ImageIcon, Layers3, Search, UserRound } from 'lucide-react';
import { UserAvatar } from '../components/UserAvatar';
import { useAuth } from '../hooks/useAuth';
import { normalizeSearchQuery, readRecentSearches, saveRecentSearch } from '../lib/recentSearches';
import { fetchSearchResults, type SearchResult, type SearchTab } from '../services/searchService';

type ResultsTab = SearchTab | 'recent';

const tabs: Array<{ id: ResultsTab; label: string }> = [
	{ id: 'top', label: 'Principais' },
	{ id: 'posts', label: 'Posts' },
	{ id: 'users', label: 'Usuarios' },
	{ id: 'media', label: 'Midia' },
	{ id: 'courses', label: 'Cursos' },
	{ id: 'recent', label: 'Recentes' },
];

const tabIcons: Record<SearchResult['type'] | 'recent', typeof Search> = {
	post: FileText,
	user: UserRound,
	course: BookOpen,
	subject: Layers3,
	media: ImageIcon,
	recent: Clock,
};

const tabLabels: Record<SearchResult['type'], string> = {
	post: 'Post',
	user: 'Usuario',
	course: 'Curso',
	subject: 'Disciplina',
	media: 'Midia',
};

const normalizeTab = (value: string | null): ResultsTab => {
	return tabs.some((tab) => tab.id === value) ? (value as ResultsTab) : 'top';
};

const ResultCard = ({ result, token }: { result: SearchResult; token: string | null }) => {
	const Icon = tabIcons[result.type];

	return (
		<Link
			to={result.url}
			className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-red-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
		>
			{result.type === 'user' ? (
				<UserAvatar
					name={result.title}
					avatarUrl={'avatarUrl' in result ? result.avatarUrl : null}
					token={token}
					className="size-11 shrink-0 text-sm"
				/>
			) : (
				<span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
					<Icon className="size-5" />
				</span>
			)}
			<span className="min-w-0 flex-1">
				<span className="flex flex-wrap items-center gap-2">
					<span className="truncate text-base font-semibold text-slate-950">{result.title}</span>
					<span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
						{tabLabels[result.type]}
					</span>
				</span>
				<span className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{result.description}</span>
				{(result.type === 'post' || result.type === 'media') && result.post.attachments.length > 0 ? (
					<span className="mt-2 block text-xs text-slate-500">
						{result.post.attachments.length} anexo{result.post.attachments.length === 1 ? '' : 's'}
					</span>
				) : null}
			</span>
		</Link>
	);
};

const SearchResultsPage = () => {
	const { accessToken } = useAuth();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const query = normalizeSearchQuery(searchParams.get('q') ?? '');
	const activeTab = normalizeTab(searchParams.get('type'));
	const [results, setResults] = useState<SearchResult[]>([]);
	const [recentSearches, setRecentSearches] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [hasError, setHasError] = useState(false);

	const loadResults = useCallback(async () => {
		if (!accessToken || !query || activeTab === 'recent') {
			setResults([]);
			return;
		}

		setIsLoading(true);
		setHasError(false);

		try {
			const response = await fetchSearchResults(accessToken, query, activeTab, 20);
			setResults(response.results);
			saveRecentSearch(query);
			setRecentSearches(readRecentSearches());
		} catch {
			setResults([]);
			setHasError(true);
		} finally {
			setIsLoading(false);
		}
	}, [accessToken, activeTab, query]);

	useEffect(() => {
		setRecentSearches(readRecentSearches());
	}, [activeTab, query]);

	useEffect(() => {
		if ((searchParams.get('q') ?? '') !== query) {
			const nextParams = new URLSearchParams(searchParams);
			if (query) {
				nextParams.set('q', query);
			} else {
				nextParams.delete('q');
			}
			navigate(`/search?${nextParams.toString()}`, { replace: true });
			return;
		}

		void loadResults();
	}, [loadResults, navigate, query, searchParams]);

	const tabHref = (tab: ResultsTab) => {
		const params = new URLSearchParams();
		params.set('q', query);
		if (tab !== 'top') {
			params.set('type', tab);
		}

		return `/search?${params.toString()}`;
	};

	return (
		<section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
			<div>
				<p className="text-sm font-medium text-slate-500">Pesquisa global</p>
				<h1 className="text-2xl font-semibold text-slate-950">{query ? `Resultados para "${query}"` : 'Pesquisar'}</h1>
			</div>

			<nav className="flex overflow-x-auto rounded-lg border border-slate-200 bg-white" aria-label="Filtros de pesquisa">
				{tabs.map((tab) => (
					<Link
						key={tab.id}
						to={tabHref(tab.id)}
						className={`min-w-28 flex-1 border-b-2 px-4 py-3 text-center text-sm font-medium transition ${
							activeTab === tab.id
								? 'border-red-700 text-red-700'
								: 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
						}`}
					>
						{tab.label}
					</Link>
				))}
			</nav>

			{!query ? (
				<div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
					Digite uma busca no header para encontrar posts, usuarios, cursos e midia.
				</div>
			) : null}

			{query && activeTab === 'recent' ? (
				<div className="space-y-3">
					{recentSearches.length === 0 ? (
						<div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Nenhuma pesquisa recente encontrada.</div>
					) : (
						recentSearches.map((item) => (
							<button
								key={item}
								type="button"
								className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-red-200"
								onClick={() => navigate(`/search?q=${encodeURIComponent(item)}`)}
							>
								<span className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
									<Clock className="size-5" />
								</span>
								<span className="font-medium text-slate-900">{item}</span>
							</button>
						))
					)}
				</div>
			) : null}

			{query && activeTab !== 'recent' ? (
				<div className="space-y-3">
					{isLoading ? (
						<div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Carregando resultados...</div>
					) : null}

					{hasError && !isLoading ? (
						<div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">Nao foi possivel carregar os resultados.</div>
					) : null}

					{!hasError && !isLoading && results.length === 0 ? (
						<div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Nenhum resultado encontrado.</div>
					) : null}

					{results.map((result) => (
						<ResultCard key={`${result.type}-${result.id}`} result={result} token={accessToken} />
					))}
				</div>
			) : null}
		</section>
	);
};

export { SearchResultsPage };
