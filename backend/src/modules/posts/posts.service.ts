import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import type { Prisma } from "../../../generated/prisma/client";
import { removeFile, removeStoredFilesFromProvider, uploadFile } from "../files/files.service";
import {
	PostAuthorizationError,
	PostNotFoundError,
	PostValidationError,
	StudentCourseRequiredError,
} from "./posts.errors";
import { acquireVoteTargetLock, applyAuthorUpvoteHype } from "./vote-hype.service";

type UploadedPostFile = {
	buffer: Buffer;
	originalName: string;
	mimeType: string;
};

type CreatePostInput = {
	studentId: string;
	title: string;
	subtitle?: string;
	subjectId: string;
	content: Prisma.InputJsonValue;
	files: UploadedPostFile[];
};

type ListPostsInput = {
	studentId: string;
	subjectId?: string;
	courseId?: string;
	page: number;
	limit: number;
};

type ListStudentPostsInput = {
	currentStudentId: string;
	profileStudentId: string;
	page: number;
	limit: number;
};

type ListStudentVotesInput = {
	currentStudentId: string;
	profileStudentId: string;
	page: number;
	limit: number;
	voteType?: 1 | -1;
};

type VoteInput = {
	studentId: string;
	postId: string;
	voteType: 1 | -1 | 0;
};

type UpdatePostInput = {
	studentId: string;
	postId: string;
	title: string;
	subtitle?: string;
	subjectId: string;
	content: Prisma.InputJsonValue;
};

type DeletePostInput = {
	studentId: string;
	postId: string;
};

const getStudentCourseId = async (studentId: string) => {
	const student = await prisma.student.findUnique({
		where: { id: studentId },
		select: {
			courseId: true,
			course: {
				select: {
					isActive: true,
				},
			},
		},
	});

	if (!student) {
		throw new Error("Usuario nao encontrado.");
	}

	if (!student.courseId || !student.course?.isActive) {
		throw new StudentCourseRequiredError();
	}

	return student.courseId;
};

const ensureStudentExists = async (studentId: string) => {
	const student = await prisma.student.findUnique({
		where: { id: studentId },
		select: { id: true },
	});

	if (!student) {
		throw new Error("Usuario nao encontrado.");
	}
};

const getStudentActiveCourseId = async (studentId: string) => {
	const student = await prisma.student.findUnique({
		where: { id: studentId },
		select: {
			courseId: true,
			course: {
				select: {
					isActive: true,
				},
			},
		},
	});

	if (!student) {
		throw new Error("Usuario nao encontrado.");
	}

	return student.course?.isActive ? student.courseId : null;
};

const ensureSubjectBelongsToCourse = async (subjectId: string, courseId: string) => {
	const subjectCourse = await prisma.subjectCourse.findUnique({
		where: {
			subjectId_courseId: {
				subjectId,
				courseId,
			},
		},
		select: {
			subject: {
				select: {
					isActive: true,
				},
			},
		},
	});

	if (!subjectCourse?.subject.isActive) {
		throw new PostValidationError("A disciplina selecionada nao pertence ao seu curso.");
	}
};

const ensureSubjectIsActive = async (subjectId: string) => {
	const subject = await prisma.subject.findUnique({
		where: { id: subjectId },
		select: { isActive: true },
	});

	if (!subject?.isActive) {
		throw new PostValidationError("Disciplina invalida.");
	}
};

const ensureCourseIsActive = async (courseId: string) => {
	const course = await prisma.course.findUnique({
		where: { id: courseId },
		select: { isActive: true },
	});

	if (!course?.isActive) {
		throw new PostValidationError("Curso invalido.");
	}
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

const mapAttachment = (attachment: {
	id: string;
	storedFile: {
		id: string;
		originalName: string;
		mimeType: string;
		size: number;
		createdAt: Date;
	};
}) => ({
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

const mapPost = (
	post: {
		id: string;
		title: string;
		subtitle: string | null;
		content: Prisma.JsonValue | null;
		createdAt: Date;
		updatedAt: Date;
		student: { id: string; name: string; avatarFileId: string | null; hype: number };
		subject: { id: string; name: string };
		attachments: Array<Parameters<typeof mapAttachment>[0]>;
		commentCount: number;
	},
	voteScore = 0,
	userVote: 1 | -1 | 0 = 0,
) => ({
	id: post.id,
	title: post.title,
	subtitle: post.subtitle,
	content: post.content,
	createdAt: post.createdAt,
	updatedAt: post.updatedAt,
	author: {
		id: post.student.id,
		name: post.student.name,
		avatarUrl: post.student.avatarFileId ? `/files/${post.student.avatarFileId}/preview` : null,
		hype: post.student.hype,
	},
	subject: post.subject,
	attachments: post.attachments.map(mapAttachment),
	votes: {
		score: voteScore,
		userVote,
	},
	commentCount: post.commentCount,
});

const getPostVoteState = async (postId: string, studentId: string) => {
	const [scoreResult, userVote] = await Promise.all([
		prisma.vote.aggregate({
			where: { postId, commentId: null },
			_sum: {
				vote_type: true,
			},
		}),
		prisma.vote.findUnique({
			where: {
				userId_postId: {
					userId: studentId,
					postId,
				},
			},
			select: {
				vote_type: true,
			},
		}),
	]);

	return {
		score: scoreResult._sum.vote_type ?? 0,
		userVote: (userVote?.vote_type ?? 0) as 1 | -1 | 0,
	};
};

const postInclude = {
	student: {
		select: {
			id: true,
			name: true,
			avatarFileId: true,
			hype: true,
		},
	},
	subject: {
		select: {
			id: true,
			name: true,
		},
	},
	attachments: {
		where: {
			commentId: null,
		},
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

const listCourseSubjects = async (studentId: string) => {
	const courseId = await getStudentCourseId(studentId);
	const subjects = await prisma.subjectCourse.findMany({
		where: {
			courseId,
			subject: {
				isActive: true,
			},
		},
		select: {
			subject: {
				select: {
					id: true,
					name: true,
				},
			},
		},
		orderBy: {
			subject: {
				name: "asc",
			},
		},
	});

	return subjects.map((item) => item.subject);
};

const listPostFilters = async (studentId: string) => {
	const currentCourseId = await getStudentActiveCourseId(studentId);
	const [courses, subjects] = await Promise.all([
		prisma.course.findMany({
			where: { isActive: true },
			select: {
				id: true,
				name: true,
				subjects: {
					select: {
						subjectId: true,
					},
				},
			},
			orderBy: {
				name: "asc",
			},
		}),
		prisma.subject.findMany({
			where: { isActive: true },
			select: {
				id: true,
				name: true,
			},
			orderBy: {
				name: "asc",
			},
		}),
	]);

	const mappedCourses = courses.map((course) => ({
		id: course.id,
		name: course.name,
		subjectIds: course.subjects.map((subject) => subject.subjectId),
	}));

	const sortedCourses = currentCourseId
		? [
				...mappedCourses.filter((course) => course.id === currentCourseId),
				...mappedCourses.filter((course) => course.id !== currentCourseId),
			]
		: mappedCourses;

	return { courses: sortedCourses, currentCourseId, subjects };
};

const listPosts = async (input: ListPostsInput) => {
	if (input.subjectId) {
		await ensureSubjectIsActive(input.subjectId);
	}

	if (input.courseId) {
		await ensureCourseIsActive(input.courseId);
	}

	const where: Prisma.PostWhereInput = {
		...(input.subjectId ? { subjectId: input.subjectId } : {}),
		subject: {
			isActive: true,
			...(input.courseId
				? {
						courses: {
							some: {
								courseId: input.courseId,
							},
						},
					}
				: {}),
		},
	};

	const [posts, total] = await prisma.$transaction([
		prisma.post.findMany({
			where,
			include: postInclude,
			orderBy: {
				createdAt: "desc",
			},
			skip: (input.page - 1) * input.limit,
			take: input.limit,
		}),
		prisma.post.count({ where }),
	]);

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
						userId: input.studentId,
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

	return {
		posts: posts.map((post) => mapPost(post, scoresByPostId.get(post.id) ?? 0, userVotesByPostId.get(post.id) ?? 0)),
		pagination: {
			page: input.page,
			limit: input.limit,
			total,
			totalPages: Math.ceil(total / input.limit),
		},
	};
};

const getPostById = async (postId: string, studentId: string) => {
	await ensurePostVisibleToStudent(postId, studentId);

	const post = await prisma.post.findUnique({
		where: { id: postId },
		include: postInclude,
	});

	if (!post) {
		throw new PostNotFoundError();
	}

	const votes = await getPostVoteState(post.id, studentId);

	return mapPost(post, votes.score, votes.userVote);
};

const mapPostsWithVoteState = async (
	posts: Array<Parameters<typeof mapPost>[0] & { id: string }>,
	currentStudentId: string,
) => {
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
						userId: currentStudentId,
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

	return posts.map((post) => mapPost(post, scoresByPostId.get(post.id) ?? 0, userVotesByPostId.get(post.id) ?? 0));
};

const listStudentPosts = async (input: ListStudentPostsInput) => {
	await ensureStudentExists(input.profileStudentId);

	const where: Prisma.PostWhereInput = {
		studentId: input.profileStudentId,
		subject: {
			isActive: true,
		},
	};

	const [posts, total] = await prisma.$transaction([
		prisma.post.findMany({
			where,
			include: postInclude,
			orderBy: {
				createdAt: "desc",
			},
			skip: (input.page - 1) * input.limit,
			take: input.limit,
		}),
		prisma.post.count({ where }),
	]);

	return {
		posts: await mapPostsWithVoteState(posts, input.currentStudentId),
		pagination: {
			page: input.page,
			limit: input.limit,
			total,
			totalPages: Math.ceil(total / input.limit),
		},
	};
};

const listStudentVotedPosts = async (input: ListStudentVotesInput) => {
	await ensureStudentExists(input.profileStudentId);

	const where: Prisma.VoteWhereInput = {
		userId: input.profileStudentId,
		commentId: null,
		...(input.voteType ? { vote_type: input.voteType } : {}),
		post: {
			subject: {
				isActive: true,
			},
		},
	};

	const [votes, total] = await prisma.$transaction([
		prisma.vote.findMany({
			where,
			select: {
				createdAt: true,
				vote_type: true,
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
		prisma.vote.count({ where }),
	]);

	const votesWithPosts = votes.filter(
		(vote): vote is typeof vote & { post: NonNullable<(typeof vote)["post"]> } => Boolean(vote.post),
	);

	const posts = await mapPostsWithVoteState(
		votesWithPosts.map((vote) => vote.post),
		input.currentStudentId,
	);

	const voteTypeByPostId = new Map(votesWithPosts.map((vote) => [vote.post.id, vote.vote_type as 1 | -1]));
	const voteCreatedAtByPostId = new Map(votesWithPosts.map((vote) => [vote.post.id, vote.createdAt]));

	return {
		votes: posts.map((post) => ({
			post,
			voteType: voteTypeByPostId.get(post.id) ?? 0,
			createdAt: voteCreatedAtByPostId.get(post.id) ?? post.createdAt,
		})),
		pagination: {
			page: input.page,
			limit: input.limit,
			total,
			totalPages: Math.ceil(total / input.limit),
		},
	};
};

const createPost = async (input: CreatePostInput) => {
	const courseId = await getStudentCourseId(input.studentId);
	await ensureSubjectBelongsToCourse(input.subjectId, courseId);

	if (input.files.length > env.MAX_POST_ATTACHMENTS) {
		throw new PostValidationError(`Envie no maximo ${env.MAX_POST_ATTACHMENTS} anexos por post.`);
	}

	const hasText = extractPlainText(input.content).trim().length > 0;

	if (!hasText && input.files.length === 0) {
		throw new PostValidationError("Escreva um conteudo ou envie pelo menos um anexo.");
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

		const post = await prisma.post.create({
			data: {
				title: input.title.trim(),
				subtitle: input.subtitle?.trim() || null,
				content: input.content,
				studentId: input.studentId,
				subjectId: input.subjectId,
				attachments: {
					create: uploadedFiles.map((file) => ({
						storedFileId: file.id,
					})),
				},
			},
			include: postInclude,
		});

		return mapPost(post);
	} catch (error) {
		await Promise.all(uploadedFiles.map((file) => removeFile(file.id).catch(() => undefined)));
		throw error;
	}
};

const ensurePostVisibleToStudent = async (postId: string, studentId: string) => {
	await ensureStudentExists(studentId);
	const post = await prisma.post.findUnique({
		where: { id: postId },
		select: {
			id: true,
			subject: {
				select: {
					isActive: true,
				},
			},
		},
	});

	if (!post) {
		throw new PostNotFoundError();
	}

	if (!post.subject.isActive) {
		throw new PostAuthorizationError("Voce nao tem permissao para acessar este post.");
	}
};

const ensurePostOwnedByStudent = async (postId: string, studentId: string) => {
	const post = await prisma.post.findUnique({
		where: { id: postId },
		select: {
			id: true,
			studentId: true,
		},
	});

	if (!post) {
		throw new PostNotFoundError();
	}

	if (post.studentId !== studentId) {
		throw new PostAuthorizationError("Apenas o autor pode alterar este post.");
	}
};

const updatePost = async (input: UpdatePostInput) => {
	await ensurePostOwnedByStudent(input.postId, input.studentId);
	const courseId = await getStudentCourseId(input.studentId);
	await ensureSubjectBelongsToCourse(input.subjectId, courseId);

	const hasText = extractPlainText(input.content).trim().length > 0;
	const attachmentsCount = await prisma.attachment.count({
		where: { postId: input.postId },
	});

	if (!hasText && attachmentsCount === 0) {
		throw new PostValidationError("Escreva um conteudo ou mantenha pelo menos um anexo no post.");
	}

	const post = await prisma.post.update({
		where: { id: input.postId },
		data: {
			title: input.title.trim(),
			subtitle: input.subtitle?.trim() || null,
			content: input.content,
			subjectId: input.subjectId,
		},
		include: postInclude,
	});

	const votes = await getPostVoteState(post.id, input.studentId);

	return mapPost(post, votes.score, votes.userVote);
};

const deletePost = async (input: DeletePostInput) => {
	await ensurePostOwnedByStudent(input.postId, input.studentId);

	const attachments = await prisma.attachment.findMany({
		where: { postId: input.postId },
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
		await tx.post.delete({
			where: { id: input.postId },
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
	});

	const cleanupResults = await removeStoredFilesFromProvider(storedFiles.map((file) => file.storedName));
	const failedCleanups = cleanupResults.filter((result) => result.status === "rejected");

	if (failedCleanups.length > 0) {
		console.warn(
			{ postId: input.postId, failedCleanups: failedCleanups.length },
			"Falha ao remover arquivos fisicos de post excluido",
		);
	}
};

const voteOnPost = async (input: VoteInput) => {
	await ensurePostVisibleToStudent(input.postId, input.studentId);

	const result = await prisma.$transaction(async (tx) => {
		const post = await tx.post.findUnique({
			where: { id: input.postId },
			select: { studentId: true },
		});

		if (!post) {
			throw new PostNotFoundError("Post nao encontrado.");
		}

		await acquireVoteTargetLock(tx, {
			targetType: "post",
			studentId: input.studentId,
			postId: input.postId,
		});

		const previousVote = await tx.vote.findUnique({
			where: {
				userId_postId: {
					userId: input.studentId,
					postId: input.postId,
				},
			},
			select: { vote_type: true },
		});
		const previousVoteType = (previousVote?.vote_type ?? 0) as 1 | -1 | 0;

		if (input.voteType === 0) {
			await tx.vote.deleteMany({
				where: {
					userId: input.studentId,
					postId: input.postId,
					commentId: null,
				},
			});
		} else {
			await tx.vote.upsert({
				where: {
					userId_postId: {
						userId: input.studentId,
						postId: input.postId,
					},
				},
				update: {
					vote_type: input.voteType,
				},
				create: {
					userId: input.studentId,
					postId: input.postId,
					commentId: null,
					vote_type: input.voteType,
				},
			});
		}

		await applyAuthorUpvoteHype(tx, {
			authorStudentId: post.studentId,
			voterStudentId: input.studentId,
			previousVoteType,
			nextVoteType: input.voteType,
		});

		return tx.vote.aggregate({
			where: {
				postId: input.postId,
				commentId: null,
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

export {
	createPost,
	deletePost,
	getPostById,
	listCourseSubjects,
	listPostFilters,
	listPosts,
	mapPost,
	postInclude,
	ensurePostVisibleToStudent,
	listStudentPosts,
	listStudentVotedPosts,
	updatePost,
	voteOnPost,
};
export type { UploadedPostFile };
