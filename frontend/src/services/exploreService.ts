import { request } from './api';
import type { AcademicPost } from './postsService';

export type TrendingCourse = {
	id: string;
	name: string;
	postsCount: number;
	recentPostsCount: number;
	interactionsCount: number;
	score: number;
	url: string;
};

export type RecentTheme = {
	id: string;
	label: string;
	count: number;
	url: string;
};

export type ExploreResponse = {
	popularNow: AcademicPost[];
	popularCourse: {
		course: {
			id: string;
			name: string;
		} | null;
		posts: AcademicPost[];
	};
	trendingCourses: TrendingCourse[];
	recentThemes: RecentTheme[];
};

export const fetchExplore = (token: string, limit = 6) => {
	const params = new URLSearchParams({ limit: String(limit) });
	return request<ExploreResponse>(`/explore?${params.toString()}`, {}, token);
};
