import { request, requestBlob } from './api';
import type { AcademicPost } from './postsService';
import type { AuthUser } from '../types/auth';

export type ProfileSummary = {
	postsCount: number;
	votesCount: number;
	upvotes: number;
	downvotes: number;
	commentsCount: number;
	commentsReady: boolean;
};

export type ProfileVote = {
	post: AcademicPost;
	voteType: 1 | -1 | 0;
	createdAt: string;
};

export type Pagination = {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
};

export type ProfilePayload = {
	user: AuthUser;
	summary: ProfileSummary;
	posts?: AcademicPost[];
	postsPagination?: Pagination;
	votes?: ProfileVote[];
	votesPagination?: Pagination;
	comments: [];
};

export type ProfilePostsPayload = {
	posts: AcademicPost[];
	pagination: Pagination;
};

export type ProfileVotesPayload = {
	votes: ProfileVote[];
	pagination: Pagination;
};

type UpdateProfileResponse = {
	user: AuthUser;
};

export type UpdateProfileInput = {
	name: string;
	bio?: string;
	password?: string;
	passwordConfirmation?: string;
	avatar?: File | null;
};

export const fetchProfile = (token: string, studentId?: string) => {
	return request<ProfilePayload>(studentId ? `/profile/${studentId}` : '/profile/me', {}, token);
};

export const fetchProfilePosts = (token: string, studentId: string, page: number, limit = 10) => {
	const params = new URLSearchParams({
		page: String(page),
		limit: String(limit),
	});

	return request<ProfilePostsPayload>(`/profile/${studentId}/posts?${params.toString()}`, {}, token);
};

export const fetchProfileVotes = (
	token: string,
	studentId: string,
	page: number,
	limit = 10,
	voteType?: 1 | -1,
) => {
	const params = new URLSearchParams({
		page: String(page),
		limit: String(limit),
	});

	if (voteType) {
		params.set('voteType', String(voteType));
	}

	return request<ProfileVotesPayload>(`/profile/${studentId}/votes?${params.toString()}`, {}, token);
};

export const updateProfile = (token: string, input: UpdateProfileInput) => {
	const formData = new FormData();
	formData.append('name', input.name);
	formData.append('bio', input.bio ?? '');

	if (input.password) {
		formData.append('password', input.password);
		formData.append('passwordConfirmation', input.passwordConfirmation ?? '');
	}

	if (input.avatar) {
		formData.append('avatar', input.avatar);
	}

	return request<UpdateProfileResponse>(
		'/profile/me',
		{
			method: 'PATCH',
			body: formData,
		},
		token,
	);
};

export const fetchProfileAvatar = (token: string, avatarUrl: string) => {
	return requestBlob(avatarUrl, {}, token);
};
