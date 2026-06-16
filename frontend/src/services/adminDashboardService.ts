import { request } from './api';

export type AdminDashboardPeriod = 7 | 14 | 30;

export type AdminDashboardSummary = {
	students: number;
	activeCourses: number;
	activeSubjects: number;
	posts: number;
	comments: number;
	votes: number;
	files: number;
};

export type RecentActivityItem = {
	days: AdminDashboardPeriod;
	posts: number;
	comments: number;
	votes: number;
	uploads: number;
};

export type RankedPost = {
	id: string;
	title: string;
	subtitle: string | null;
	createdAt: string;
	author: {
		id: string;
		name: string;
	};
	subject: {
		id: string;
		name: string;
	};
	commentCount: number;
	votes: {
		score: number;
		upvotes: number;
		recentVotes: number;
	};
	rankScore: number;
};

export type TrendingCourse = {
	id: string;
	name: string;
	postsCount: number;
	recentPostsCount: number;
	commentsCount: number;
	votesCount: number;
	voteScore: number;
	engagementScore: number;
};

export type ActiveSubject = {
	id: string;
	name: string;
	postsCount: number;
	recentPostsCount: number;
	commentsCount: number;
	attachmentsCount: number;
	votesCount: number;
	voteScore: number;
	engagementScore: number;
};

export type StudentEngagement = {
	id: string;
	name: string;
	email: string;
	hype: number;
	course: {
		id: string;
		name: string;
	} | null;
	postsCount: number;
	commentsCount: number;
	receivedVotesCount: number;
	receivedVoteScore: number;
	activityScore: number;
};

export type AdminDashboardCourseFilter = {
	id: string;
	name: string;
};

export type AdminDashboardResponse = {
	periodDays: AdminDashboardPeriod;
	summary: AdminDashboardSummary;
	recentActivity: RecentActivityItem[];
	relevantPosts: RankedPost[];
	trendingCourses: TrendingCourse[];
	activeSubjects: ActiveSubject[];
	studentEngagement: StudentEngagement[];
	filters: {
		courses: AdminDashboardCourseFilter[];
	};
};

export const fetchAdminDashboard = (params: { periodDays?: AdminDashboardPeriod; courseId?: string }, token?: string | null) => {
	const searchParams = new URLSearchParams();

	if (params.periodDays) {
		searchParams.set('periodDays', String(params.periodDays));
	}

	if (params.courseId) {
		searchParams.set('courseId', params.courseId);
	}

	const queryString = searchParams.toString();
	return request<AdminDashboardResponse>(`/admin/dashboard${queryString ? `?${queryString}` : ''}`, {}, token);
};
