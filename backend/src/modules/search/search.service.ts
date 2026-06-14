import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { mapPost, postInclude } from "../posts/posts.service";
import type { SearchType } from "./search.schemas";

type SearchInput = {
	studentId: string;
	query: string;
	type: SearchType;
	limit: number;
};

type SuggestionsInput = {
	query: string;
	limit: number;
};

type ScoredItem<T> = T & {
	score: number;
	createdAt?: Date;
};

const normalizeQuery = (value: string) => value.trim().replace(/\s+/g, " ").slice(0, 80);

const getTextScore = (query: string, fields: Array<string | null | undefined>) => {
	const normalizedQuery = query.toLocaleLowerCase("pt-BR");
	const normalizedFields = fields
		.filter((field): field is string => Boolean(field))
		.map((field) => field.toLocaleLowerCase("pt-BR"));

	if (normalizedFields.some((field) => field === normalizedQuery)) {
		return 100;
	}

	if (normalizedFields.some((field) => field.startsWith(normalizedQuery))) {
		return 80;
	}

	if (normalizedFields.some((field) => field.includes(normalizedQuery))) {
		return 60;
	}

	return 0;
};

const extractPlainText = (node: unknown): string => {
	if (!node || typeof node !== "object") {
		return "";
	}

	if ("text" in node && typeof node.text === "string") {
		return node.text;
	}

	if ("content" in node && Array.isArray(node.content)) {
		return node.content.map((child) => extractPlainText(child)).join(" ");
	}

	return "";
};

const getPostText = (post: { title: string; subtitle: string | null; content: Prisma.JsonValue | null }) => {
	return [post.title, post.subtitle, extractPlainText(post.content)].filter(Boolean).join(" ");
};

const sortByRelevance = <T>(items: Array<ScoredItem<T>>) => {
	return items
		.sort((left, right) => {
			if (right.score !== left.score) {
				return right.score - left.score;
			}

			return (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0);
		})
		.map(({ score: _score, ...item }) => item as T);
};

const getSearchItemKey = (item: { type: string; id: string }) => {
	return item.type === "post" || item.type === "media" ? `post:${item.id}` : `${item.type}:${item.id}`;
};

const dedupeSearchItems = <T extends { type: string; id: string }>(items: T[]) => {
	const seen = new Set<string>();

	return items.filter((item) => {
		const key = getSearchItemKey(item);

		if (seen.has(key)) {
			return false;
		}

		seen.add(key);
		return true;
	});
};

const searchUsers = async (query: string, limit: number) => {
	const students = await prisma.student.findMany({
		where: {
			name: {
				contains: query,
				mode: "insensitive",
			},
		},
		select: {
			id: true,
			name: true,
			bio: true,
			avatarFileId: true,
			hype: true,
			course: {
				select: {
					id: true,
					name: true,
				},
			},
			createdAt: true,
		},
		take: limit,
	});

	return students.map((student) => ({
		type: "user" as const,
		id: student.id,
		title: student.name,
		description: student.bio ?? student.course?.name ?? "Usuario",
		url: `/profile/${student.id}`,
		avatarUrl: student.avatarFileId ? `/files/${student.avatarFileId}/preview` : null,
		hype: student.hype,
		course: student.course,
		score: getTextScore(query, [student.name]) + Math.min(student.hype, 20),
		createdAt: student.createdAt,
	}));
};

const searchCourses = async (query: string, limit: number) => {
	const courses = await prisma.course.findMany({
		where: {
			isActive: true,
			name: {
				contains: query,
				mode: "insensitive",
			},
		},
		select: {
			id: true,
			name: true,
			createdAt: true,
			_count: {
				select: {
					students: true,
					subjects: true,
				},
			},
		},
		take: limit,
	});

	return courses.map((course) => ({
		type: "course" as const,
		id: course.id,
		title: course.name,
		description: `${course._count.subjects} disciplinas - ${course._count.students} estudantes`,
		url: `/home?courseId=${course.id}`,
		studentsCount: course._count.students,
		subjectsCount: course._count.subjects,
		score: getTextScore(query, [course.name]),
		createdAt: course.createdAt,
	}));
};

const searchSubjects = async (query: string, limit: number) => {
	const subjects = await prisma.subject.findMany({
		where: {
			isActive: true,
			name: {
				contains: query,
				mode: "insensitive",
			},
		},
		select: {
			id: true,
			name: true,
			createdAt: true,
			_count: {
				select: {
					posts: true,
					courses: true,
				},
			},
		},
		take: limit,
	});

	return subjects.map((subject) => ({
		type: "subject" as const,
		id: subject.id,
		title: subject.name,
		description: `${subject._count.posts} posts - ${subject._count.courses} cursos`,
		url: `/home?subjectId=${subject.id}`,
		postsCount: subject._count.posts,
		coursesCount: subject._count.courses,
		score: getTextScore(query, [subject.name]),
		createdAt: subject.createdAt,
	}));
};

const findMatchingPostIds = async (query: string, limit: number) => {
	const pattern = `%${query}%`;

	return prisma.$queryRaw<Array<{ id: string }>>`
		SELECT p.id
		FROM "Post" p
		INNER JOIN "Subject" s ON s.id = p."subjectId"
		WHERE s."isActive" = true
			AND (
				p.title ILIKE ${pattern}
				OR p.subtitle ILIKE ${pattern}
				OR p.content::text ILIKE ${pattern}
			)
		ORDER BY p."createdAt" DESC
		LIMIT ${limit}
	`;
};

const searchPosts = async (studentId: string, query: string, limit: number, onlyMedia = false) => {
	const rows = await findMatchingPostIds(query, Math.max(limit * 3, 20));
	const ids = rows.map((row) => row.id);

	if (ids.length === 0) {
		return [];
	}

	const posts = await prisma.post.findMany({
		where: {
			id: {
				in: ids,
			},
			...(onlyMedia
				? {
						attachments: {
							some: {
								storedFile: {
									mimeType: {
										startsWith: "image/",
									},
								},
							},
						},
					}
				: {}),
		},
		include: postInclude,
		take: Math.max(limit * 2, 20),
	});

	const postIds = posts.map((post) => post.id);
	const [voteStats, userVotes] = await Promise.all([
		postIds.length
			? prisma.vote.groupBy({
					by: ["postId"],
					where: {
						postId: {
							in: postIds,
						},
						commentId: null,
					},
					_sum: {
						vote_type: true,
					},
				})
			: [],
		postIds.length
			? prisma.vote.findMany({
					where: {
						postId: {
							in: postIds,
						},
						userId: studentId,
						commentId: null,
					},
					select: {
						postId: true,
						vote_type: true,
					},
				})
			: [],
	]);

	const scoresByPostId = new Map(voteStats.map((vote) => [vote.postId, vote._sum.vote_type ?? 0]));
	const userVotesByPostId = new Map(userVotes.map((vote) => [vote.postId, vote.vote_type as 1 | -1]));

	return posts.map((post) => ({
		type: onlyMedia ? ("media" as const) : ("post" as const),
		id: post.id,
		title: post.title,
		description: post.subtitle ?? getPostText(post).slice(0, 180),
		url: `/posts/${post.id}`,
		post: mapPost(post, scoresByPostId.get(post.id) ?? 0, userVotesByPostId.get(post.id) ?? 0),
		score: getTextScore(query, [post.title, post.subtitle, extractPlainText(post.content)]) + Math.max(0, scoresByPostId.get(post.id) ?? 0),
		createdAt: post.createdAt,
	}));
};

const searchAll = async (input: SearchInput) => {
	const query = normalizeQuery(input.query);

	if (!query) {
		return { query, results: [] };
	}

	const perTypeLimit = input.type === "top" ? Math.max(6, Math.ceil(input.limit / 2)) : input.limit;
	const [posts, users, media, courses, subjects] = await Promise.all([
		input.type === "top" || input.type === "posts" ? searchPosts(input.studentId, query, perTypeLimit) : [],
		input.type === "top" || input.type === "users" ? searchUsers(query, perTypeLimit) : [],
		input.type === "top" || input.type === "media" ? searchPosts(input.studentId, query, perTypeLimit, true) : [],
		input.type === "top" || input.type === "courses" ? searchCourses(query, perTypeLimit) : [],
		input.type === "top" ? searchSubjects(query, perTypeLimit) : [],
	]);

	return {
		query,
		results: dedupeSearchItems(sortByRelevance([...posts, ...users, ...media, ...courses, ...subjects])).slice(0, input.limit),
	};
};

const getSuggestions = async (input: SuggestionsInput) => {
	const query = normalizeQuery(input.query);

	if (!query) {
		return { query, suggestions: [] };
	}

	const [posts, users, media, courses, subjects] = await Promise.all([
		searchPosts("", query, 4),
		searchUsers(query, 4),
		searchPosts("", query, 4, true),
		searchCourses(query, 4),
		searchSubjects(query, 4),
	]);

	const suggestions = dedupeSearchItems(sortByRelevance([...posts, ...users, ...media, ...courses, ...subjects]))
		.slice(0, input.limit)
		.map((item) => ({
			type: item.type,
			id: item.id,
			title: item.title,
			description: item.description,
			url: item.url,
			...("avatarUrl" in item ? { avatarUrl: item.avatarUrl } : {}),
		}));

	return { query, suggestions };
};

export { getSuggestions, searchAll };
