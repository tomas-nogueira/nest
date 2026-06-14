import type { RecentSearchSuggestion } from '../services/searchService';

const STORAGE_KEY = 'nest-backup:recent-searches';
const MAX_RECENT_SEARCHES = 8;

const normalizeSearchQuery = (value: string) => value.trim().replace(/\s+/g, ' ').slice(0, 80);

const readRecentSearches = () => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		const parsed = raw ? (JSON.parse(raw) as unknown) : [];

		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed
			.filter((item): item is string => typeof item === 'string')
			.map(normalizeSearchQuery)
			.filter(Boolean)
			.slice(0, MAX_RECENT_SEARCHES);
	} catch {
		return [];
	}
};

const saveRecentSearch = (query: string) => {
	const normalized = normalizeSearchQuery(query);

	if (!normalized) {
		return;
	}

	const nextSearches = [
		normalized,
		...readRecentSearches().filter((item) => item.toLocaleLowerCase('pt-BR') !== normalized.toLocaleLowerCase('pt-BR')),
	].slice(0, MAX_RECENT_SEARCHES);

	localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSearches));
};

const getRecentSearchSuggestions = (query: string): RecentSearchSuggestion[] => {
	const normalized = normalizeSearchQuery(query).toLocaleLowerCase('pt-BR');

	return readRecentSearches()
		.filter((item) => !normalized || item.toLocaleLowerCase('pt-BR').includes(normalized))
		.map((item) => ({
			type: 'recent' as const,
			id: item.toLocaleLowerCase('pt-BR'),
			title: item,
			description: 'Pesquisa recente',
			url: `/search?q=${encodeURIComponent(item)}`,
		}));
};

export { getRecentSearchSuggestions, normalizeSearchQuery, readRecentSearches, saveRecentSearch };

