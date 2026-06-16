import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { scoreRelevantPost } from "../posts/post-ranking";

type AdminDashboardPeriod = 7 | 14 | 30;

type AdminDashboardInput = {
	periodDays: AdminDashboardPeriod;
	courseId?: string;
};

type VoteMetric = {
	score: number;
	upvotes: number;
	recentVotes: number;
	commentCount: number;
};

type RankedPostCandidate = {
	id: string;
	title: string;
	subtitle: string | null;
	createdAt: Date;
	student: {
		id: string;
		name: string;
	};
	subject: {
		id: string;
		name: string;
	};
	commentCount: number;
};

const RECENT_ACTIVITY_PERIODS = [7, 14, 30] as const;
const RANKING_LIMIT = 8;
const POST_CANDIDATE_LIMIT = 120;

const getCutoffDate = (days: number) => {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - days);
	return cutoff;
};

const toNumber = (value: bigint | number | null | undefined) => Number(value ?? 0);

const getPlatformSummary = async () => {
	const [students, activeCourses, activeSubjects, posts, comments, votes, files] = await prisma.$transaction([
		prisma.student.count(),
		prisma.course.count({ where: { isActive: true } }),
		prisma.subject.count({ where: { isActive: true } }),
		prisma.post.count(),
		prisma.comment.count(),
		prisma.vote.count(),
		prisma.storedFile.count(),
	]);

	return {
		students,
		activeCourses,
		activeSubjects,
		posts,
		comments,
		votes,
		files,
	};
};

const getRecentActivity = async () => {
	const oldestCutoff = getCutoffDate(Math.max(...RECENT_ACTIVITY_PERIODS));

	const [posts, comments, votes, uploads] = await Promise.all([
		prisma.post.groupBy({
			by: ["createdAt"],
			where: { createdAt: { gte: oldestCutoff } },
			_count: { _all: true },
		}),
		prisma.comment.groupBy({
			by: ["createdAt"],
			where: { createdAt: { gte: oldestCutoff } },
			_count: { _all: true },
		}),
		prisma.vote.groupBy({
			by: ["createdAt"],
			where: { createdAt: { gte: oldestCutoff } },
			_count: { _all: true },
		}),
		prisma.storedFile.groupBy({
			by: ["createdAt"],
			where: { createdAt: { gte: oldestCutoff } },
			_count: { _all: true },
		}),
	]);

	const countSince = (rows: Array<{ createdAt: Date; _count: { _all: number } }>, cutoff: Date) =>
		rows.reduce((total, row) => (row.createdAt >= cutoff ? total + row._count._all : total), 0);

	return RECENT_ACTIVITY_PERIODS.map((days) => {
		const cutoff = getCutoffDate(days);

		return {
			days,
			posts: countSince(posts, cutoff),
			comments: countSince(comments, cutoff),
			votes: countSince(votes, cutoff),
			uploads: countSince(uploads, cutoff),
		};
	});
};

const getRelevantPosts = async (periodDays: AdminDashboardPeriod) => {
	const cutoff = getCutoffDate(periodDays);
	const posts = await prisma.post.findMany({
		where: {
			subject: {
				isActive: true,
			},
		},
		select: {
			id: true,
			title: true,
			subtitle: true,
			createdAt: true,
			commentCount: true,
			student: {
				select: {
					id: true,
					name: true,
				},
			},
			subject: {
				select: {
					id: true,
					name: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		take: POST_CANDIDATE_LIMIT,
	});

	const postIds = posts.map((post) => post.id);
	const votes = postIds.length
		? await prisma.vote.findMany({
				where: {
					postId: {
						in: postIds,
					},
					commentId: null,
				},
				select: {
					postId: true,
					vote_type: true,
					createdAt: true,
				},
			})
		: [];

	const metrics = new Map<string, VoteMetric>();

	for (const post of posts) {
		metrics.set(post.id, {
			score: 0,
			upvotes: 0,
			recentVotes: 0,
			commentCount: post.commentCount,
		});
	}

	for (const vote of votes) {
		if (!vote.postId) {
			continue;
		}

		const current = metrics.get(vote.postId);
		if (!current) {
			continue;
		}

		current.score += vote.vote_type;
		current.upvotes += vote.vote_type === 1 ? 1 : 0;
		current.recentVotes += vote.createdAt >= cutoff ? 1 : 0;
	}

	return posts
		.map((post: RankedPostCandidate) => {
			const metric = metrics.get(post.id) ?? { score: 0, upvotes: 0, recentVotes: 0, commentCount: 0 };
			return {
				id: post.id,
				title: post.title,
				subtitle: post.subtitle,
				createdAt: post.createdAt,
				author: post.student,
				subject: post.subject,
				commentCount: post.commentCount,
				votes: {
					score: metric.score,
					upvotes: metric.upvotes,
					recentVotes: metric.recentVotes,
				},
				rankScore: scoreRelevantPost(post, metric),
			};
		})
		.sort((left, right) => {
			if (right.rankScore !== left.rankScore) {
				return right.rankScore - left.rankScore;
			}

			return right.createdAt.getTime() - left.createdAt.getTime();
		})
		.slice(0, RANKING_LIMIT);
};

const getTrendingCourses = async (periodDays: AdminDashboardPeriod) => {
	const cutoff = getCutoffDate(periodDays);
	const rows = await prisma.$queryRaw<
		Array<{
			id: string;
			name: string;
			posts_count: bigint;
			recent_posts_count: bigint;
			comments_count: bigint;
			votes_count: bigint;
			vote_score: bigint | null;
			engagement_score: bigint | null;
		}>
	>`
		WITH course_posts AS (
			SELECT
				sc."courseId" AS course_id,
				COUNT(DISTINCT p.id) AS posts_count,
				COUNT(DISTINCT CASE WHEN p."createdAt" >= ${cutoff} THEN p.id END) AS recent_posts_count
			FROM "SubjectCourse" sc
			INNER JOIN "Subject" s ON s.id = sc."subjectId" AND s."isActive" = true
			LEFT JOIN "Post" p ON p."subjectId" = s.id
			GROUP BY sc."courseId"
		),
		course_comments AS (
			SELECT
				sc."courseId" AS course_id,
				COUNT(DISTINCT cm.id) AS comments_count
			FROM "SubjectCourse" sc
			INNER JOIN "Subject" s ON s.id = sc."subjectId" AND s."isActive" = true
			INNER JOIN "Post" p ON p."subjectId" = s.id
			INNER JOIN "Comment" cm ON cm."postId" = p.id AND cm."createdAt" >= ${cutoff}
			GROUP BY sc."courseId"
		),
		course_votes AS (
			SELECT
				sc."courseId" AS course_id,
				COUNT(DISTINCT v.id) AS votes_count,
				COALESCE(SUM(v.vote_type), 0) AS vote_score
			FROM "SubjectCourse" sc
			INNER JOIN "Subject" s ON s.id = sc."subjectId" AND s."isActive" = true
			INNER JOIN "Post" p ON p."subjectId" = s.id
			INNER JOIN "Vote" v ON v."postId" = p.id AND v."createdAt" >= ${cutoff}
			GROUP BY sc."courseId"
		)
		SELECT
			c.id,
			c.name,
			COALESCE(cp.posts_count, 0) AS posts_count,
			COALESCE(cp.recent_posts_count, 0) AS recent_posts_count,
			COALESCE(cc.comments_count, 0) AS comments_count,
			COALESCE(cv.votes_count, 0) AS votes_count,
			COALESCE(cv.vote_score, 0) AS vote_score,
			(
				COALESCE(cp.recent_posts_count, 0) * 4
				+ COALESCE(cc.comments_count, 0) * 2
				+ COALESCE(cv.votes_count, 0) * 2
				+ COALESCE(cv.vote_score, 0)
			) AS engagement_score
		FROM "Course" c
		LEFT JOIN course_posts cp ON cp.course_id = c.id
		LEFT JOIN course_comments cc ON cc.course_id = c.id
		LEFT JOIN course_votes cv ON cv.course_id = c.id
		WHERE c."isActive" = true
			AND COALESCE(cp.posts_count, 0) > 0
		ORDER BY engagement_score DESC, c.name ASC
		LIMIT ${RANKING_LIMIT}
	`;

	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		postsCount: toNumber(row.posts_count),
		recentPostsCount: toNumber(row.recent_posts_count),
		commentsCount: toNumber(row.comments_count),
		votesCount: toNumber(row.votes_count),
		voteScore: toNumber(row.vote_score),
		engagementScore: toNumber(row.engagement_score),
	}));
};

const getActiveSubjects = async (periodDays: AdminDashboardPeriod) => {
	const cutoff = getCutoffDate(periodDays);
	const rows = await prisma.$queryRaw<
		Array<{
			id: string;
			name: string;
			posts_count: bigint;
			recent_posts_count: bigint;
			comments_count: bigint;
			attachments_count: bigint;
			votes_count: bigint;
			vote_score: bigint | null;
			engagement_score: bigint | null;
		}>
	>`
		WITH subject_posts AS (
			SELECT
				s.id AS subject_id,
				COUNT(DISTINCT p.id) AS posts_count,
				COUNT(DISTINCT CASE WHEN p."createdAt" >= ${cutoff} THEN p.id END) AS recent_posts_count
			FROM "Subject" s
			LEFT JOIN "Post" p ON p."subjectId" = s.id
			WHERE s."isActive" = true
			GROUP BY s.id
		),
		subject_comments AS (
			SELECT
				p."subjectId" AS subject_id,
				COUNT(DISTINCT cm.id) AS comments_count
			FROM "Post" p
			INNER JOIN "Comment" cm ON cm."postId" = p.id AND cm."createdAt" >= ${cutoff}
			GROUP BY p."subjectId"
		),
		subject_attachments AS (
			SELECT
				p."subjectId" AS subject_id,
				COUNT(DISTINCT a.id) AS attachments_count
			FROM "Post" p
			INNER JOIN "Attachment" a ON a."postId" = p.id AND a."createdAt" >= ${cutoff}
			GROUP BY p."subjectId"
		),
		subject_votes AS (
			SELECT
				p."subjectId" AS subject_id,
				COUNT(DISTINCT v.id) AS votes_count,
				COALESCE(SUM(v.vote_type), 0) AS vote_score
			FROM "Post" p
			INNER JOIN "Vote" v ON v."postId" = p.id AND v."createdAt" >= ${cutoff}
			GROUP BY p."subjectId"
		)
		SELECT
			s.id,
			s.name,
			COALESCE(sp.posts_count, 0) AS posts_count,
			COALESCE(sp.recent_posts_count, 0) AS recent_posts_count,
			COALESCE(sc.comments_count, 0) AS comments_count,
			COALESCE(sa.attachments_count, 0) AS attachments_count,
			COALESCE(sv.votes_count, 0) AS votes_count,
			COALESCE(sv.vote_score, 0) AS vote_score,
			(
				COALESCE(sp.recent_posts_count, 0) * 4
				+ COALESCE(sc.comments_count, 0) * 2
				+ COALESCE(sa.attachments_count, 0)
				+ COALESCE(sv.votes_count, 0) * 2
				+ COALESCE(sv.vote_score, 0)
			) AS engagement_score
		FROM "Subject" s
		LEFT JOIN subject_posts sp ON sp.subject_id = s.id
		LEFT JOIN subject_comments sc ON sc.subject_id = s.id
		LEFT JOIN subject_attachments sa ON sa.subject_id = s.id
		LEFT JOIN subject_votes sv ON sv.subject_id = s.id
		WHERE s."isActive" = true
			AND COALESCE(sp.posts_count, 0) > 0
		ORDER BY engagement_score DESC, s.name ASC
		LIMIT ${RANKING_LIMIT}
	`;

	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		postsCount: toNumber(row.posts_count),
		recentPostsCount: toNumber(row.recent_posts_count),
		commentsCount: toNumber(row.comments_count),
		attachmentsCount: toNumber(row.attachments_count),
		votesCount: toNumber(row.votes_count),
		voteScore: toNumber(row.vote_score),
		engagementScore: toNumber(row.engagement_score),
	}));
};

const getStudentEngagement = async (input: AdminDashboardInput) => {
	const cutoff = getCutoffDate(input.periodDays);
	const courseFilter = input.courseId ? Prisma.sql`AND st."courseId" = ${input.courseId}` : Prisma.empty;
	const rows = await prisma.$queryRaw<
		Array<{
			id: string;
			name: string;
			email: string;
			hype: number;
			course_id: string | null;
			course_name: string | null;
			posts_count: bigint;
			comments_count: bigint;
			received_votes_count: bigint;
			received_vote_score: bigint | null;
			activity_score: bigint | null;
		}>
	>`
		WITH student_posts AS (
			SELECT
				p."studentId" AS student_id,
				COUNT(DISTINCT p.id) AS posts_count
			FROM "Post" p
			WHERE p."createdAt" >= ${cutoff}
			GROUP BY p."studentId"
		),
		student_comments AS (
			SELECT
				cm."studentId" AS student_id,
				COUNT(DISTINCT cm.id) AS comments_count
			FROM "Comment" cm
			WHERE cm."createdAt" >= ${cutoff}
			GROUP BY cm."studentId"
		),
		student_received_votes AS (
			SELECT
				p."studentId" AS student_id,
				COUNT(DISTINCT v.id) AS received_votes_count,
				COALESCE(SUM(v.vote_type), 0) AS received_vote_score
			FROM "Post" p
			INNER JOIN "Vote" v ON v."postId" = p.id AND v."createdAt" >= ${cutoff}
			GROUP BY p."studentId"
		)
		SELECT
			st.id,
			st.name,
			st.email,
			st.hype,
			c.id AS course_id,
			c.name AS course_name,
			COALESCE(sp.posts_count, 0) AS posts_count,
			COALESCE(sc.comments_count, 0) AS comments_count,
			COALESCE(srv.received_votes_count, 0) AS received_votes_count,
			COALESCE(srv.received_vote_score, 0) AS received_vote_score,
			(
				COALESCE(sp.posts_count, 0) * 4
				+ COALESCE(sc.comments_count, 0) * 2
				+ COALESCE(srv.received_votes_count, 0) * 2
				+ COALESCE(srv.received_vote_score, 0)
				+ st.hype
			) AS activity_score
		FROM "Student" st
		LEFT JOIN "Course" c ON c.id = st."courseId"
		LEFT JOIN student_posts sp ON sp.student_id = st.id
		LEFT JOIN student_comments sc ON sc.student_id = st.id
		LEFT JOIN student_received_votes srv ON srv.student_id = st.id
		WHERE TRUE
			${courseFilter}
			AND (
				COALESCE(sp.posts_count, 0) > 0
				OR COALESCE(sc.comments_count, 0) > 0
				OR COALESCE(srv.received_votes_count, 0) > 0
				OR st.hype > 0
			)
		ORDER BY activity_score DESC, st.name ASC
		LIMIT ${RANKING_LIMIT}
	`;

	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		email: row.email,
		hype: row.hype,
		course: row.course_id ? { id: row.course_id, name: row.course_name ?? "Curso sem nome" } : null,
		postsCount: toNumber(row.posts_count),
		commentsCount: toNumber(row.comments_count),
		receivedVotesCount: toNumber(row.received_votes_count),
		receivedVoteScore: toNumber(row.received_vote_score),
		activityScore: toNumber(row.activity_score),
	}));
};

const getAdminDashboardFilters = async () => {
	const courses = await prisma.course.findMany({
		where: { isActive: true },
		select: {
			id: true,
			name: true,
		},
		orderBy: {
			name: "asc",
		},
	});

	return { courses };
};

const getAdminDashboard = async (input: AdminDashboardInput) => {
	const [summary, recentActivity, relevantPosts, trendingCourses, activeSubjects, studentEngagement, filters] =
		await Promise.all([
			getPlatformSummary(),
			getRecentActivity(),
			getRelevantPosts(input.periodDays),
			getTrendingCourses(input.periodDays),
			getActiveSubjects(input.periodDays),
			getStudentEngagement(input),
			getAdminDashboardFilters(),
		]);

	return {
		periodDays: input.periodDays,
		summary,
		recentActivity,
		relevantPosts,
		trendingCourses,
		activeSubjects,
		studentEngagement,
		filters,
	};
};

export { getAdminDashboard };
export type { AdminDashboardInput, AdminDashboardPeriod };
