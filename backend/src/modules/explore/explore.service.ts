import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { mapPost, postInclude } from "../posts/posts.service";

type ExploreInput = {
	studentId: string;
	limit: number;
};

const RECENT_ACTIVITY_DAYS = 14;
const MAX_POST_CANDIDATES = 80;
const MAX_THEME_POSTS = 120;

const stopWords = new Set([
	"a",
	"ao",
	"aos",
	"as",
	"com",
	"como",
	"da",
	"das",
	"de",
	"do",
	"dos",
	"e",
	"em",
	"entre",
	"mais",
	"na",
	"nas",
	"no",
	"nos",
	"o",
	"os",
	"ou",
	"para",
	"por",
	"que",
	"sobre",
	"um",
	"uma",
]);

const getRecentCutoff = () => {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - RECENT_ACTIVITY_DAYS);
	return cutoff;
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

const getCurrentStudentCourse = async (studentId: string) => {
	const student = await prisma.student.findUnique({
		where: { id: studentId },
		select: {
			course: {
				select: {
					id: true,
					name: true,
					isActive: true,
				},
			},
		},
	});

	if (!student) {
		throw new Error("Usuário não encontrado.");
	}

	return student.course?.isActive ? { id: student.course.id, name: student.course.name } : null;
};

const getPostMetrics = async (postIds: string[], studentId: string) => {
	const [votes, userVotes] = await Promise.all([
		postIds.length
			? prisma.vote.findMany({
					where: {
						postId: {
							in: postIds,
						},
					},
					select: {
						postId: true,
						vote_type: true,
						createdAt: true,
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
					},
					select: {
						postId: true,
						vote_type: true,
					},
				})
			: [],
	]);

	const metrics = new Map<string, { score: number; upvotes: number; recentVotes: number }>();

	for (const postId of postIds) {
		metrics.set(postId, { score: 0, upvotes: 0, recentVotes: 0 });
	}

	const cutoff = getRecentCutoff();
	for (const vote of votes) {
		const current = metrics.get(vote.postId) ?? { score: 0, upvotes: 0, recentVotes: 0 };
		current.score += vote.vote_type;
		current.upvotes += vote.vote_type === 1 ? 1 : 0;
		current.recentVotes += vote.createdAt >= cutoff ? 1 : 0;
		metrics.set(vote.postId, current);
	}

	return {
		metrics,
		userVotes: new Map(userVotes.map((vote) => [vote.postId, vote.vote_type as 1 | -1])),
	};
};

const scorePost = (post: { createdAt: Date }, metric: { score: number; upvotes: number; recentVotes: number }) => {
	const ageHours = Math.max(1, (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60));
	const recencyBoost = Math.max(0, 48 - ageHours) / 12;
	return metric.upvotes * 3 + metric.recentVotes * 2 + metric.score + recencyBoost;
};

const listPopularPosts = async (studentId: string, limit: number, courseId?: string) => {
	const posts = await prisma.post.findMany({
		where: {
			subject: {
				isActive: true,
				...(courseId
					? {
							courses: {
								some: {
									courseId,
								},
							},
						}
					: {}),
			},
		},
		include: postInclude,
		orderBy: {
			createdAt: "desc",
		},
		take: MAX_POST_CANDIDATES,
	});

	const postIds = posts.map((post) => post.id);
	const { metrics, userVotes } = await getPostMetrics(postIds, studentId);

	return posts
		.map((post) => ({
			post,
			rank: scorePost(post, metrics.get(post.id) ?? { score: 0, upvotes: 0, recentVotes: 0 }),
		}))
		.sort((left, right) => {
			if (right.rank !== left.rank) {
				return right.rank - left.rank;
			}

			return right.post.createdAt.getTime() - left.post.createdAt.getTime();
		})
		.slice(0, limit)
		.map(({ post }) => {
			const metric = metrics.get(post.id);
			return mapPost(post, metric?.score ?? 0, userVotes.get(post.id) ?? 0);
		});
};

const normalizeKeyword = (value: string) => {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLocaleLowerCase("pt-BR");
};

const extractKeywords = (text: string) => {
	return text
		.split(/[^\p{L}\p{N}]+/u)
		.map((word) => word.trim())
		.filter((word) => word.length >= 4)
		.map((word) => ({
			label: word,
			key: normalizeKeyword(word),
		}))
		.filter((word) => !stopWords.has(word.key) && !/^\d+$/.test(word.key));
};

const listRecentThemes = async (limit: number) => {
	const posts = await prisma.post.findMany({
		where: {
			createdAt: {
				gte: getRecentCutoff(),
			},
			subject: {
				isActive: true,
			},
		},
		select: {
			title: true,
			subtitle: true,
			content: true,
		},
		orderBy: {
			createdAt: "desc",
		},
		take: MAX_THEME_POSTS,
	});

	const keywords = new Map<string, { label: string; count: number }>();

	for (const post of posts) {
		const seenInPost = new Set<string>();

		for (const keyword of extractKeywords(getPostText(post))) {
			if (seenInPost.has(keyword.key)) {
				continue;
			}

			seenInPost.add(keyword.key);
			const current = keywords.get(keyword.key);
			keywords.set(keyword.key, {
				label: current?.label ?? keyword.label,
				count: (current?.count ?? 0) + 1,
			});
		}
	}

	return [...keywords.entries()]
		.sort((left, right) => {
			if (right[1].count !== left[1].count) {
				return right[1].count - left[1].count;
			}

			return left[1].label.localeCompare(right[1].label, "pt-BR");
		})
		.slice(0, limit)
		.map(([key, value]) => ({
			id: key,
			label: value.label,
			count: value.count,
			url: `/search?q=${encodeURIComponent(value.label)}`,
		}));
};

const listTrendingCourses = async (limit: number) => {
	const rows = await prisma.$queryRaw<
		Array<{
			id: string;
			name: string;
			posts_count: bigint;
			votes_count: bigint;
			vote_score: bigint | null;
			recent_posts_count: bigint;
		}>
	>`
		SELECT
			c.id,
			c.name,
			COUNT(DISTINCT p.id) AS posts_count,
			COUNT(v.id) AS votes_count,
			COALESCE(SUM(v.vote_type), 0) AS vote_score,
			COUNT(DISTINCT CASE WHEN p."createdAt" >= ${getRecentCutoff()} THEN p.id END) AS recent_posts_count
		FROM "Course" c
		INNER JOIN "SubjectCourse" sc ON sc."courseId" = c.id
		INNER JOIN "Subject" s ON s.id = sc."subjectId" AND s."isActive" = true
		LEFT JOIN "Post" p ON p."subjectId" = s.id
		LEFT JOIN "Vote" v ON v."postId" = p.id AND v."createdAt" >= ${getRecentCutoff()}
		WHERE c."isActive" = true
		GROUP BY c.id, c.name
		HAVING COUNT(DISTINCT p.id) > 0
		ORDER BY (COUNT(DISTINCT CASE WHEN p."createdAt" >= ${getRecentCutoff()} THEN p.id END) * 4 + COUNT(v.id) * 2 + COALESCE(SUM(v.vote_type), 0)) DESC,
			c.name ASC
		LIMIT ${limit}
	`;

	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		postsCount: Number(row.posts_count),
		recentPostsCount: Number(row.recent_posts_count),
		interactionsCount: Number(row.votes_count),
		score: Number(row.vote_score ?? 0),
		url: `/home?courseId=${row.id}`,
	}));
};

const listExplore = async (input: ExploreInput) => {
	const currentCourse = await getCurrentStudentCourse(input.studentId);
	const [popularNow, popularCourse, trendingCourses, recentThemes] = await Promise.all([
		listPopularPosts(input.studentId, input.limit),
		currentCourse ? listPopularPosts(input.studentId, input.limit, currentCourse.id) : Promise.resolve([]),
		listTrendingCourses(input.limit),
		listRecentThemes(input.limit),
	]);

	return {
		popularNow,
		popularCourse: {
			course: currentCourse,
			posts: popularCourse,
		},
		trendingCourses,
		recentThemes,
	};
};

export { listExplore };
