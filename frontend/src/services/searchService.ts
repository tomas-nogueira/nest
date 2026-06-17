import { request } from './api';
import type { AcademicPost } from './postsService';

export type SearchResultType = 'post' | 'user' | 'course' | 'subject' | 'media' | 'recent';
export type SearchTab = 'top' | 'posts' | 'users' | 'media' | 'courses';

export type SearchSuggestion = {
	type: Exclude<SearchResultType, 'recent'>;
	id: string;
	title: string;
	description: string;
	url: string;
	filterUrl?: string;
	avatarUrl?: string | null;
	hype?: number;
};

export type RecentSearchSuggestion = {
	type: 'recent';
	id: string;
	title: string;
	description: string;
	url: string;
};

export type SearchResult =
	| (SearchSuggestion & { type: 'user'; avatarUrl?: string | null; hype?: number })
	| (SearchSuggestion & { type: 'course'; filterUrl?: string; studentsCount?: number; subjectsCount?: number })
	| (SearchSuggestion & { type: 'subject'; postsCount?: number; coursesCount?: number })
	| (SearchSuggestion & { type: 'post' | 'media'; post: AcademicPost });

type SuggestionsResponse = {
	query: string;
	suggestions: SearchSuggestion[];
};

type SearchResponse = {
	query: string;
	results: SearchResult[];
};

const buildParams = (params: Record<string, string | number | undefined>) => {
	const searchParams = new URLSearchParams();

	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== '') {
			searchParams.set(key, String(value));
		}
	});

	return searchParams.toString();
};

export const fetchSearchSuggestions = (token: string, query: string, limit = 8) => {
	return request<SuggestionsResponse>(`/search/suggestions?${buildParams({ q: query, limit })}`, {}, token);
};

export const fetchSearchResults = (token: string, query: string, type: SearchTab = 'top', limit = 20) => {
	return request<SearchResponse>(`/search?${buildParams({ q: query, type, limit })}`, {}, token);
};
