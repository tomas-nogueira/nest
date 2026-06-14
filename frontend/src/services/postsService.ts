import { request, requestBlob } from './api';

export type RichTextMark = {
	type: 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'link';
	attrs?: {
		href?: string;
	};
};

export type RichTextNode = {
	type: string;
	text?: string;
	attrs?: {
		level?: number;
	};
	marks?: RichTextMark[];
	content?: RichTextNode[];
};

export type Subject = {
	id: string;
	name: string;
};

export type Course = {
	id: string;
	name: string;
	subjectIds: string[];
};

export type PostAttachment = {
	id: string;
	file: {
		id: string;
		originalName: string;
		mimeType: string;
		size: number;
		createdAt: string;
		previewUrl: string;
		downloadUrl: string;
	};
};

export type AcademicPost = {
	id: string;
	title: string;
	subtitle: string | null;
	content: RichTextNode | null;
	createdAt: string;
	updatedAt: string;
	author: {
		id: string;
		name: string;
		avatarUrl: string | null;
	};
	subject: Subject;
	attachments: PostAttachment[];
	votes: {
		score: number;
		userVote: 1 | -1 | 0;
	};
};

type ListPostsResponse = {
	posts: AcademicPost[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
};

type SubjectsResponse = {
	subjects: Subject[];
};

type PostFiltersResponse = {
	courses: Course[];
	currentCourseId: string | null;
	subjects: Subject[];
};

type CreatePostResponse = {
	post: AcademicPost;
};

type UpdatePostResponse = {
	post: AcademicPost;
};

type VoteResponse = {
	votes: AcademicPost['votes'];
};

export const fetchPostSubjects = (token: string) => {
	return request<SubjectsResponse>('/posts/subjects', {}, token);
};

export const fetchPostFilters = (token: string) => {
	return request<PostFiltersResponse>('/posts/filters', {}, token);
};

export const fetchPosts = (token: string, filters: { subjectId?: string; courseId?: string } = {}) => {
	const params = new URLSearchParams();

	if (filters.subjectId) {
		params.set('subjectId', filters.subjectId);
	}

	if (filters.courseId) {
		params.set('courseId', filters.courseId);
	}

	const query = params.toString();

	return request<ListPostsResponse>(`/posts${query ? `?${query}` : ''}`, {}, token);
};

export const createPost = (token: string, input: { title: string; subtitle?: string; subjectId: string; content: RichTextNode; attachments: File[] }) => {
	const formData = new FormData();
	formData.append('title', input.title);
	if (input.subtitle) {
		formData.append('subtitle', input.subtitle);
	}
	formData.append('subjectId', input.subjectId);
	formData.append('content', JSON.stringify(input.content));

	input.attachments.forEach((file) => {
		formData.append('attachments', file);
	});

	return request<CreatePostResponse>(
		'/posts',
		{
			method: 'POST',
			body: formData,
		},
		token,
	);
};

export const updatePost = (token: string, postId: string, input: { title: string; subtitle?: string; subjectId: string; content: RichTextNode }) => {
	return request<UpdatePostResponse>(
		`/posts/${postId}`,
		{
			method: 'PATCH',
			body: JSON.stringify(input),
		},
		token,
	);
};

export const deletePost = (token: string, postId: string) => {
	return request<void>(
		`/posts/${postId}`,
		{
			method: 'DELETE',
		},
		token,
	);
};

export const voteOnPost = (token: string, postId: string, voteType: 1 | -1 | 0) => {
	return request<VoteResponse>(
		`/posts/${postId}/vote`,
		{
			method: 'PUT',
			body: JSON.stringify({ voteType }),
		},
		token,
	);
};

export const fetchAttachmentPreview = (token: string, fileId: string) => {
	return requestBlob(`/files/${fileId}/preview`, {}, token);
};

export const fetchAttachmentDownload = (token: string, fileId: string) => {
	return requestBlob(`/files/${fileId}/download`, {}, token);
};
