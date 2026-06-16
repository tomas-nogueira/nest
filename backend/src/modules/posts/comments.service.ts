import type { Prisma } from "../../../generated/prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { removeFile, removeStoredFilesFromProvider, uploadFile } from "../files/files.service";
import { PostAuthorizationError, PostNotFoundError, PostValidationError } from "./posts.errors";
import { ensurePostVisibleToStudent, mapPost, postInclude } from "./posts.service";
import { applyAuthorUpvoteHype } from "./vote-hype.service";

type UploadedCommentFile = {
	buffer: Buffer;
	originalName: string;
	mimeType: string;
};

type ListCommentsInput = {
	studentId: string;
	postId: string;
	page: number;
	limit: number;
};

type CreateCommentInput = {
	studentId: string;
	postId: string;
	parentId?: string;
	content: string;
	files: UploadedCommentFile[];
};

type UpdateCommentInput = {
	studentId: string;
	postId: string;
	commentId: string;
	content: string;
};

type DeleteCommentInput = {
	studentId: string;
	postId: string;
	commentId: string;
};

type VoteCommentInput = {
	studentId: string;
	postId: string;
	commentId: string;
	voteType: 1 | -1 | 0;
};

type CommentWithAuthor = {
	id: string;
	postId: string;
	studentId: string;
	parentId: string | null;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	student: {
		id: string;
		name: string;
		avatarFileId: string | null;
	};
	attachments: Array<{
		id: string;
		storedFile: {
			id: string;
			originalName: string;
			mimeType: string;
			size: number;
			createdAt: Date;
		};
	}>;
};

type CommentMetric = {
	score: number;
	userVote: 1 | -1 | 0;
};

type CommentResponse = {
	id: string;
	postId: string;
	parentId: string | null;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	author: {
		id: string;
		name: string;
		avatarUrl: string | null;
	};
	votes: CommentMetric;
	canEdit: boolean;
	canDelete: boolean;
	attachments: Array<{
		id: string;
		file: {
			id: string;
			originalName: string;
			mimeType: string;
			size: number;
			createdAt: Date;
			previewUrl: string;
			downloadUrl: string;
		};
	}>;
	replies: CommentResponse[];
};

const COMMENT_EDIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_COMMENT_TREE_ITEMS = 500;

const commentInclude = {
	student: {
		select: {
			id: true,
			name: true,
			avatarFileId: true,
		},
	},
	attachments: {
		include: {
			storedFile: {
				select: {
					id: true,
					originalName: true,
					mimeType: true,
					size: true,
					createdAt: true,
				},
			},
		},
		orderBy: {
			createdAt: "asc" as const,
		},
	},
};

const mapCommentAttachment = (attachment: CommentWithAuthor["attachments"][number]) => ({
	id: attachment.id,
	file: {
		id: attachment.storedFile.id,
		originalName: attachment.storedFile.originalName,
		mimeType: attachment.storedFile.mimeType,
		size: attachment.storedFile.size,
		createdAt: attachment.storedFile.createdAt,
		previewUrl: `/files/${attachment.storedFile.id}/preview`,
		downloadUrl: `/files/${attachment.storedFile.id}/download`,
	},
});

const getCanEditComment = (comment: { studentId: string; createdAt: Date }, studentId: string) => {
	return comment.studentId === studentId && Date.now() - comment.createdAt.getTime() <= COMMENT_EDIT_WINDOW_MS;
};

const mapComment = (
	comment: CommentWithAuthor,
	metrics: Map<string, CommentMetric>,
	currentStudentId: string,
	replies: CommentResponse[] = [],
): CommentResponse => {
	const metric = metrics.get(comment.id) ?? { score: 0, userVote: 0 };

	return {
		id: comment.id,
		postId: comment.postId,
		parentId: comment.parentId,
		content: comment.content,
		createdAt: comment.createdAt,
		updatedAt: comment.updatedAt,
		author: {
			id: comment.student.id,
			name: comment.student.name,
			avatarUrl: comment.student.avatarFileId ? `/files/${comment.student.avatarFileId}/preview` : null,
		},
		votes: metric,
		canEdit: getCanEditComment(comment, currentStudentId),
		canDelete: comment.studentId === currentStudentId,
		attachments: comment.attachments.map(mapCommentAttachment),
		replies,
	};
};

const getCommentMetrics = async (commentIds: string[], studentId: string) => {
	const [voteStats, userVotes] = await Promise.all([
		commentIds.length
			? prisma.vote.groupBy({
					by: ["commentId"],
					where: {
						commentId: {
							in: commentIds,
						},
						postId: null,
					},
					_sum: {
						vote_type: true,
					},
				})
			: [],
		commentIds.length
			? prisma.vote.findMany({
					where: {
						commentId: {
							in: commentIds,
						},
						userId: studentId,
						postId: null,
					},
					select: {
						commentId: true,
						vote_type: true,
					},
				})
			: [],
	]);

	const metrics = new Map<string, CommentMetric>();
	for (const commentId of commentIds) {
		metrics.set(commentId, { score: 0, userVote: 0 });
	}

	for (const vote of voteStats) {
		if (!vote.commentId) {
			continue;
		}

		metrics.set(vote.commentId, {
			score: vote._sum.vote_type ?? 0,
			userVote: 0,
		});
	}

	for (const vote of userVotes) {
		if (!vote.commentId) {
			continue;
		}

		const current = metrics.get(vote.commentId) ?? { score: 0, userVote: 0 };
		metrics.set(vote.commentId, {
			...current,
			userVote: vote.vote_type as 1 | -1 | 0,
		});
	}

	return metrics;
};

const compareComments = (metrics: Map<string, CommentMetric>) => (left: CommentWithAuthor, right: CommentWithAuthor) => {
	const leftScore = metrics.get(left.id)?.score ?? 0;
	const rightScore = metrics.get(right.id)?.score ?? 0;

	if (rightScore !== leftScore) {
		return rightScore - leftScore;
	}

	return right.createdAt.getTime() - left.createdAt.getTime();
};

const buildCommentTree = (comments: CommentWithAuthor[], metrics: Map<string, CommentMetric>, currentStudentId: string) => {
	const childrenByParentId = new Map<string | null, CommentWithAuthor[]>();

	for (const comment of comments) {
		const key = comment.parentId ?? null;
		childrenByParentId.set(key, [...(childrenByParentId.get(key) ?? []), comment]);
	}

	const mapBranch = (parentId: string | null): CommentResponse[] => {
		const children = [...(childrenByParentId.get(parentId) ?? [])].sort(compareComments(metrics));
		return children.map((comment) => mapComment(comment, metrics, currentStudentId, mapBranch(comment.id)));
	};

	return mapBranch(null);
};

const ensureParentCommentBelongsToPost = async (parentId: string, postId: string) => {
	const parent = await prisma.comment.findUnique({
		where: { id: parentId },
		select: {
			id: true,
			postId: true,
		},
	});

	if (!parent || parent.postId !== postId) {
		throw new PostValidationError("Comentario pai invalido.");
	}
};

const ensureCommentOwnedByStudent = async (commentId: string, postId: string, studentId: string) => {
	const comment = await prisma.comment.findUnique({
		where: { id: commentId },
		select: {
			id: true,
			postId: true,
			studentId: true,
			createdAt: true,
		},
	});

	if (!comment || comment.postId !== postId) {
		throw new PostNotFoundError("Comentario nao encontrado.");
	}

	if (comment.studentId !== studentId) {
		throw new PostAuthorizationError("Apenas o autor pode alterar este comentario.");
	}

	return comment;
};

const listComments = async (input: ListCommentsInput) => {
	await ensurePostVisibleToStudent(input.postId, input.studentId);

	const [comments, totalRootComments] = await prisma.$transaction([
		prisma.comment.findMany({
			where: { postId: input.postId },
			include: commentInclude,
			orderBy: { createdAt: "desc" },
			take: MAX_COMMENT_TREE_ITEMS,
		}),
		prisma.comment.count({
			where: {
				postId: input.postId,
				parentId: null,
			},
		}),
	]);

	const metrics = await getCommentMetrics(
		comments.map((comment) => comment.id),
		input.studentId,
	);

	const tree = buildCommentTree(comments, metrics, input.studentId);
	const start = (input.page - 1) * input.limit;
	const paginatedTree = tree.slice(start, start + input.limit);

	return {
		comments: paginatedTree,
		pagination: {
			page: input.page,
			limit: input.limit,
			total: totalRootComments,
			totalPages: Math.ceil(totalRootComments / input.limit),
		},
	};
};

const createComment = async (input: CreateCommentInput) => {
	await ensurePostVisibleToStudent(input.postId, input.studentId);

	if (input.parentId) {
		await ensureParentCommentBelongsToPost(input.parentId, input.postId);
	}

	if (input.files.length > env.MAX_POST_ATTACHMENTS) {
		throw new PostValidationError(`Envie no maximo ${env.MAX_POST_ATTACHMENTS} anexos por comentario.`);
	}

	if (!input.content.trim() && input.files.length === 0) {
		throw new PostValidationError("Escreva um comentario ou envie pelo menos um anexo.");
	}

	const uploadedFiles: Array<{ id: string }> = [];

	try {
		for (const file of input.files) {
			const uploadedFile = await uploadFile({
				buffer: file.buffer,
				originalName: file.originalName,
				mimeType: file.mimeType,
			});

			uploadedFiles.push({ id: uploadedFile.id });
		}

		const comment = await prisma.$transaction(async (tx) => {
			const created = await tx.comment.create({
				data: {
					postId: input.postId,
					studentId: input.studentId,
					parentId: input.parentId ?? null,
					content: input.content.trim(),
					attachments: {
						create: uploadedFiles.map((file) => ({
							storedFileId: file.id,
						})),
					},
				},
				include: commentInclude,
			});

			await tx.post.update({
				where: { id: input.postId },
				data: {
					commentCount: {
						increment: 1,
					},
				},
			});

			return created;
		});

		return mapComment(comment, new Map([[comment.id, { score: 0, userVote: 0 }]]), input.studentId);
	} catch (error) {
		await Promise.all(uploadedFiles.map((file) => removeFile(file.id).catch(() => undefined)));
		throw error;
	}
};

const updateComment = async (input: UpdateCommentInput) => {
	const existing = await ensureCommentOwnedByStudent(input.commentId, input.postId, input.studentId);

	if (!getCanEditComment(existing, input.studentId)) {
		throw new PostAuthorizationError("Comentarios so podem ser editados ate 1 hora apos a publicacao.");
	}

	const comment = await prisma.comment.update({
		where: { id: input.commentId },
		data: { content: input.content.trim() },
		include: commentInclude,
	});

	const metrics = await getCommentMetrics([comment.id], input.studentId);
	return mapComment(comment, metrics, input.studentId);
};

const getCommentSubtreeIds = async (commentId: string) => {
	const ids = [commentId];
	let frontier = [commentId];

	while (frontier.length > 0) {
		const children = await prisma.comment.findMany({
			where: {
				parentId: {
					in: frontier,
				},
			},
			select: {
				id: true,
			},
		});

		frontier = children.map((comment) => comment.id);
		ids.push(...frontier);
	}

	return ids;
};

const deleteComment = async (input: DeleteCommentInput) => {
	await ensureCommentOwnedByStudent(input.commentId, input.postId, input.studentId);
	const subtreeIds = await getCommentSubtreeIds(input.commentId);
	const attachments = await prisma.attachment.findMany({
		where: {
			commentId: {
				in: subtreeIds,
			},
		},
		select: {
			storedFile: {
				select: {
					id: true,
					storedName: true,
				},
			},
		},
	});
	const storedFiles = attachments.map((attachment) => attachment.storedFile);

	await prisma.$transaction(async (tx) => {
		await tx.comment.delete({
			where: { id: input.commentId },
		});

		if (storedFiles.length > 0) {
			await tx.storedFile.deleteMany({
				where: {
					id: {
						in: storedFiles.map((file) => file.id),
					},
				},
			});
		}

		await tx.post.update({
			where: { id: input.postId },
			data: {
				commentCount: {
					decrement: subtreeIds.length,
				},
			},
		});
	});

	const cleanupResults = await removeStoredFilesFromProvider(storedFiles.map((file) => file.storedName));
	const failedCleanups = cleanupResults.filter((result) => result.status === "rejected");

	if (failedCleanups.length > 0) {
		console.warn(
			{ commentId: input.commentId, failedCleanups: failedCleanups.length },
			"Falha ao remover arquivos fisicos de comentario excluido",
		);
	}

	return { deletedCount: subtreeIds.length };
};

const voteOnComment = async (input: VoteCommentInput) => {
	await ensurePostVisibleToStudent(input.postId, input.studentId);

	const result = await prisma.$transaction(async (tx) => {
		const comment = await tx.comment.findUnique({
			where: { id: input.commentId },
			select: {
				id: true,
				postId: true,
				studentId: true,
			},
		});

		if (!comment || comment.postId !== input.postId) {
			throw new PostNotFoundError("Comentario nao encontrado.");
		}

		const previousVote = await tx.vote.findUnique({
			where: {
				userId_commentId: {
					userId: input.studentId,
					commentId: input.commentId,
				},
			},
			select: { vote_type: true },
		});
		const previousVoteType = (previousVote?.vote_type ?? 0) as 1 | -1 | 0;

		if (input.voteType === 0) {
			await tx.vote.deleteMany({
				where: {
					userId: input.studentId,
					commentId: input.commentId,
					postId: null,
				},
			});
		} else {
			await tx.vote.upsert({
				where: {
					userId_commentId: {
						userId: input.studentId,
						commentId: input.commentId,
					},
				},
				update: {
					vote_type: input.voteType,
				},
				create: {
					userId: input.studentId,
					postId: null,
					commentId: input.commentId,
					vote_type: input.voteType,
				},
			});
		}

		await applyAuthorUpvoteHype(tx, {
			authorStudentId: comment.studentId,
			voterStudentId: input.studentId,
			previousVoteType,
			nextVoteType: input.voteType,
		});

		return tx.vote.aggregate({
			where: {
				commentId: input.commentId,
				postId: null,
			},
			_sum: {
				vote_type: true,
			},
		});
	});

	return {
		score: result._sum.vote_type ?? 0,
		userVote: input.voteType,
	};
};

const listStudentComments = async (input: {
	currentStudentId: string;
	profileStudentId: string;
	page: number;
	limit: number;
}) => {
	const student = await prisma.student.findUnique({
		where: { id: input.profileStudentId },
		select: { id: true },
	});

	if (!student) {
		throw new Error("Usuario nao encontrado.");
	}

	const where: Prisma.CommentWhereInput = {
		studentId: input.profileStudentId,
		post: {
			subject: {
				isActive: true,
			},
		},
	};

	const [comments, total] = await prisma.$transaction([
		prisma.comment.findMany({
			where,
			include: {
				...commentInclude,
				post: {
					include: postInclude,
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			skip: (input.page - 1) * input.limit,
			take: input.limit,
		}),
		prisma.comment.count({ where }),
	]);

	const commentMetrics = await getCommentMetrics(
		comments.map((comment) => comment.id),
		input.currentStudentId,
	);

	return {
		comments: comments.map((comment) => ({
			comment: mapComment(comment, commentMetrics, input.currentStudentId),
			post: mapPost(comment.post),
			createdAt: comment.createdAt,
		})),
		pagination: {
			page: input.page,
			limit: input.limit,
			total,
			totalPages: Math.ceil(total / input.limit),
		},
	};
};

export { createComment, deleteComment, listComments, listStudentComments, updateComment, voteOnComment };
export type { UploadedCommentFile };
