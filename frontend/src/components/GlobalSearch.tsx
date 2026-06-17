import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, FileText, ImageIcon, Layers3, Loader2, Search, UserRound } from 'lucide-react';
import { Button } from './ui/button';
import { HypeBadge } from './HypeBadge';
import { Input } from './ui/input';
import { UserAvatar } from './UserAvatar';
import { useAuth } from '../hooks/useAuth';
import { getRecentSearchSuggestions, normalizeSearchQuery, saveRecentSearch } from '../lib/recentSearches';
import { fetchSearchSuggestions, type RecentSearchSuggestion, type SearchSuggestion } from '../services/searchService';

type Suggestion = SearchSuggestion | RecentSearchSuggestion;

const typeLabels: Record<Suggestion['type'], string> = {
	post: 'Post',
	user: 'Usuario',
	course: 'Curso',
	subject: 'Disciplina',
	media: 'Midia',
	recent: 'Pesquisa recente',
};

const typeIcons: Record<Suggestion['type'], typeof Search> = {
	post: FileText,
	user: UserRound,
	course: BookOpen,
	subject: Layers3,
	media: ImageIcon,
	recent: Clock,
};

const getSuggestionScore = (query: string, suggestion: Suggestion) => {
	const normalizedQuery = query.toLocaleLowerCase('pt-BR');
	const title = suggestion.title.toLocaleLowerCase('pt-BR');
	const base = suggestion.type === 'recent' ? 8 : 0;

	if (title === normalizedQuery) {
		return 100 + base;
	}

	if (title.startsWith(normalizedQuery)) {
		return 80 + base;
	}

	if (title.includes(normalizedQuery)) {
		return 60 + base;
	}

	return base;
};

const mergeSuggestions = (query: string, remote: SearchSuggestion[], recent: RecentSearchSuggestion[]) => {
	const seen = new Set<string>();

	return [...remote, ...recent]
		.filter((suggestion) => {
			const key = `${suggestion.type}:${suggestion.title.toLocaleLowerCase('pt-BR')}`;

			if (seen.has(key)) {
				return false;
			}

			seen.add(key);
			return true;
		})
		.sort((left, right) => getSuggestionScore(query, right) - getSuggestionScore(query, left))
		.slice(0, 8);
};

const GlobalSearch = () => {
	const { accessToken } = useAuth();
	const navigate = useNavigate();
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const [query, setQuery] = useState('');
	const [remoteSuggestions, setRemoteSuggestions] = useState<SearchSuggestion[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [hasError, setHasError] = useState(false);

	const normalizedQuery = normalizeSearchQuery(query);
	const recentSuggestions = useMemo(() => getRecentSearchSuggestions(normalizedQuery), [normalizedQuery]);
	const suggestions = useMemo(
		() => mergeSuggestions(normalizedQuery, remoteSuggestions, recentSuggestions),
		[normalizedQuery, recentSuggestions, remoteSuggestions],
	);

	useEffect(() => {
		const handlePointerDown = (event: PointerEvent) => {
			if (!wrapperRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('pointerdown', handlePointerDown);

		return () => document.removeEventListener('pointerdown', handlePointerDown);
	}, []);

	useEffect(() => {
		if (!accessToken || normalizedQuery.length < 2) {
			setRemoteSuggestions([]);
			setIsLoading(false);
			setHasError(false);
			return;
		}

		let isCurrent = true;
		setIsLoading(true);
		setHasError(false);

		const timeoutId = window.setTimeout(() => {
			void fetchSearchSuggestions(accessToken, normalizedQuery)
				.then((response) => {
					if (isCurrent) {
						setRemoteSuggestions(response.suggestions);
					}
				})
				.catch(() => {
					if (isCurrent) {
						setRemoteSuggestions([]);
						setHasError(true);
					}
				})
				.finally(() => {
					if (isCurrent) {
						setIsLoading(false);
					}
				});
		}, 300);

		return () => {
			isCurrent = false;
			window.clearTimeout(timeoutId);
		};
	}, [accessToken, normalizedQuery]);

	const runSearch = (value = normalizedQuery) => {
		const nextQuery = normalizeSearchQuery(value);

		if (!nextQuery) {
			return;
		}

		saveRecentSearch(nextQuery);
		setIsOpen(false);
		navigate(`/search?q=${encodeURIComponent(nextQuery)}`);
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		runSearch();
	};

	const handleSuggestionClick = (suggestion: Suggestion) => {
		if (suggestion.type === 'recent') {
			runSearch(suggestion.title);
			return;
		}

		saveRecentSearch(normalizedQuery || suggestion.title);
		setIsOpen(false);
		navigate(suggestion.url);
	};

	const renderSuggestionLabel = (suggestion: Suggestion) => {
		return (
			<span className="shrink-0 rounded-full border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600">
				{typeLabels[suggestion.type]}
			</span>
		);
	};

	return (
		<div ref={wrapperRef} className="relative w-full min-w-0 md:max-w-xl">
			<form className="relative" role="search" onSubmit={handleSubmit}>
				<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
				<Input
					value={query}
					type="search"
					placeholder="Pesquisar"
					aria-label="Pesquisa global"
					autoComplete="off"
					className="h-10 rounded-lg border-slate-200 bg-white pr-10 pl-9 text-sm shadow-sm"
					onFocus={() => setIsOpen(true)}
					onChange={(event) => {
						setQuery(event.target.value);
						setIsOpen(true);
					}}
				/>
				<Button
					type="submit"
					variant="ghost"
					size="icon-sm"
					title="Buscar"
					className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-500"
					disabled={!normalizedQuery}
				>
					<Search />
				</Button>
			</form>

			{isOpen ? (
				<div className="absolute top-full right-0 left-0 z-[80] mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-950/10">
					{!normalizedQuery ? (
						<div className="px-4 py-3 text-sm text-slate-500">
							{recentSuggestions.length > 0 ? 'Pesquisas recentes' : 'Digite para pesquisar usuarios, posts, cursos e midia.'}
						</div>
					) : null}

					{isLoading ? (
						<div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
							<Loader2 className="size-4 animate-spin" />
							Buscando sugestoes...
						</div>
					) : null}

					{hasError && !isLoading ? (
						<div className="px-4 py-3 text-sm text-red-700">Nao foi possivel carregar sugestoes.</div>
					) : null}

					{!isLoading && !hasError && suggestions.length === 0 && normalizedQuery ? (
						<div className="px-4 py-3 text-sm text-slate-500">Nenhuma sugestao encontrada.</div>
					) : null}

					{!isLoading && !hasError && suggestions.length > 0 ? (
						<ul className="max-h-96 overflow-y-auto py-1" role="listbox" aria-label="Sugestoes de pesquisa">
							{suggestions.map((suggestion) => {
								const Icon = typeIcons[suggestion.type];

								if (suggestion.type === 'course') {
									return (
										<li key={`${suggestion.type}-${suggestion.id}`} className="flex items-center gap-2 px-4 py-3 transition hover:bg-slate-50">
											<button
												type="button"
												className="flex min-w-0 flex-1 items-center gap-3 text-left focus:outline-none"
												onClick={() => handleSuggestionClick(suggestion)}
											>
												<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
													<Icon className="size-4" />
												</span>
												<span className="min-w-0 flex-1">
													<span className="block truncate text-sm font-medium text-slate-950">{suggestion.title}</span>
													<span className="block truncate text-xs text-slate-500">{suggestion.description}</span>
												</span>
												<span className="shrink-0 rounded-full border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600">
													Curso
												</span>
											</button>
											<Link
												to={suggestion.filterUrl ?? `/home?courseId=${suggestion.id}`}
												className="shrink-0 rounded-full border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
												onClick={() => {
													saveRecentSearch(normalizedQuery || suggestion.title);
													setIsOpen(false);
												}}
											>
												Filtro
											</Link>
										</li>
									);
								}

								return (
									<li key={`${suggestion.type}-${suggestion.id}`}>
										<button
											type="button"
											className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
											onClick={() => handleSuggestionClick(suggestion)}
										>
											{suggestion.type === 'user' ? (
												<UserAvatar
													name={suggestion.title}
													avatarUrl={'avatarUrl' in suggestion ? suggestion.avatarUrl : null}
													token={accessToken}
													className="size-8 shrink-0 text-xs"
												/>
											) : (
												<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
													<Icon className="size-4" />
												</span>
											)}
											<span className="min-w-0 flex-1">
												<span className="flex min-w-0 items-center gap-2">
													<span className="truncate text-sm font-medium text-slate-950">{suggestion.title}</span>
													{suggestion.type === 'user' && typeof suggestion.hype === 'number' ? (
														<HypeBadge hype={suggestion.hype} compact iconSize={14} animateNumber={false} className="gap-0.5 py-0 pr-1.5 pl-0.5 text-xs" />
													) : null}
												</span>
												<span className="block truncate text-xs text-slate-500">{suggestion.description}</span>
											</span>
											{renderSuggestionLabel(suggestion)}
										</button>
									</li>
								);
							})}
						</ul>
					) : null}
				</div>
			) : null}
		</div>
	);
};

export { GlobalSearch };
