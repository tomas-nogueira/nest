import bcrypt from "bcryptjs";
import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { removeFile, uploadFile } from "../files/files.service";
import { listStudentPosts, listStudentVotedPosts } from "../posts/posts.service";

type UploadedAvatarFile = {
	buffer: Buffer;
	originalName: string;
	mimeType: string;
};

type UpdateProfileInput = {
	studentId: string;
	name: string;
	bio?: string;
	password?: string;
	avatar?: UploadedAvatarFile;
};

type ProfileListInput = {
	currentStudentId: string;
	profileStudentId: string;
	page: number;
	limit: number;
};

type ProfileVotesInput = ProfileListInput & {
	voteType?: 1 | -1;
};

const mapProfileUser = (student: {
	id: string;
	name: string;
	email: string;
	bio: string | null;
	avatarFileId: string | null;
	hype: number;
	course: { id: string; name: string } | null;
}) => ({
	id: student.id,
	name: student.name,
	email: student.email,
	bio: student.bio,
	avatarUrl: student.avatarFileId ? `/files/${student.avatarFileId}/preview` : null,
	hype: student.hype,
	course: student.course,
});

const getProfile = async (studentId: string) => {
	const student = await prisma.student.findUnique({
		where: { id: studentId },
		select: {
			id: true,
			name: true,
			email: true,
			bio: true,
			avatarFileId: true,
			hype: true,
			course: {
				select: {
					id: true,
					name: true,
				},
			},
			_count: {
				select: {
					posts: true,
					votes: true,
				},
			},
		},
	});

	if (!student) {
		throw new Error("Usuario nao encontrado.");
	}

	const voteBreakdown = await prisma.vote.groupBy({
		by: ["vote_type"],
		where: {
			userId: studentId,
		},
		_count: {
			_all: true,
		},
	});

	const upvotes = voteBreakdown.find((vote) => vote.vote_type === 1)?._count._all ?? 0;
	const downvotes = voteBreakdown.find((vote) => vote.vote_type === -1)?._count._all ?? 0;

	return {
		user: mapProfileUser(student),
		summary: {
			postsCount: student._count.posts,
			votesCount: student._count.votes,
			upvotes,
			downvotes,
			commentsCount: 0,
			commentsReady: false,
		},
		comments: [],
	};
};

const getProfilePosts = async (input: ProfileListInput) => {
	return listStudentPosts(input);
};

const getProfileVotes = async (input: ProfileVotesInput) => {
	return listStudentVotedPosts(input);
};

const getOwnProfile = async (studentId: string) => {
	const [profile, posts, votes] = await Promise.all([
		getProfile(studentId),
		getProfilePosts({ currentStudentId: studentId, profileStudentId: studentId, page: 1, limit: 10 }),
		getProfileVotes({ currentStudentId: studentId, profileStudentId: studentId, page: 1, limit: 10 }),
	]);

	return {
		...profile,
		posts: posts.posts,
		postsPagination: posts.pagination,
		votes: votes.votes,
		votesPagination: votes.pagination,
	};
};

const updateProfile = async (input: UpdateProfileInput) => {
	const currentStudent = await prisma.student.findUnique({
		where: { id: input.studentId },
		select: {
			id: true,
			avatarFileId: true,
		},
	});

	if (!currentStudent) {
		throw new Error("Usuario nao encontrado.");
	}

	let uploadedAvatarId: string | null = null;
	let profileUpdated = false;

	try {
		if (input.avatar) {
			const file = await uploadFile(input.avatar);

			if (!file.mimeType.startsWith("image/")) {
				await removeFile(file.id);
				throw new Error("Envie uma imagem valida para o avatar.");
			}

			uploadedAvatarId = file.id;
		}

		const data: Prisma.StudentUpdateInput = {
			name: input.name.trim(),
			bio: input.bio?.trim() || null,
			...(uploadedAvatarId
				? {
						avatarFile: {
							connect: {
								id: uploadedAvatarId,
							},
						},
					}
				: {}),
			...(input.password
				? {
						passwordHash: await bcrypt.hash(input.password, 10),
					}
				: {}),
		};

		const student = await prisma.student.update({
			where: { id: input.studentId },
			data,
			select: {
				id: true,
				name: true,
				email: true,
				bio: true,
				avatarFileId: true,
				hype: true,
				course: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});
		profileUpdated = true;

		if (uploadedAvatarId && currentStudent.avatarFileId && currentStudent.avatarFileId !== uploadedAvatarId) {
			await removeFile(currentStudent.avatarFileId);
		}

		return mapProfileUser(student);
	} catch (error) {
		if (uploadedAvatarId && !profileUpdated) {
			await removeFile(uploadedAvatarId).catch(() => undefined);
		}

		throw error;
	}
};

export { getOwnProfile, getProfile, getProfilePosts, getProfileVotes, updateProfile };
export type { UploadedAvatarFile };
