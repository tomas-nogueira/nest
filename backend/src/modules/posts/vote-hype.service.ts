import type { Prisma } from "../../../generated/prisma/client";

type VoteType = 1 | -1 | 0;

type ApplyAuthorUpvoteHypeInput = {
	authorStudentId: string;
	voterStudentId: string;
	previousVoteType: VoteType;
	nextVoteType: VoteType;
};

type VoteTargetLockInput =
	| {
			targetType: "post";
			studentId: string;
			postId: string;
	  }
	| {
			targetType: "comment";
			studentId: string;
			commentId: string;
	  };

const getVoteTargetLockKey = (input: VoteTargetLockInput) => {
	const targetId = input.targetType === "post" ? input.postId : input.commentId;
	return `vote:${input.targetType}:${input.studentId}:${targetId}`;
};

const getUpvoteHypeDelta = (previousVoteType: VoteType, nextVoteType: VoteType) => {
	const previousUpvote = previousVoteType === 1 ? 1 : 0;
	const nextUpvote = nextVoteType === 1 ? 1 : 0;

	return nextUpvote - previousUpvote;
};

const acquireVoteTargetLock = async (tx: Prisma.TransactionClient, input: VoteTargetLockInput) => {
	await tx.$executeRaw`
		SELECT pg_advisory_xact_lock(hashtextextended(${getVoteTargetLockKey(input)}, 0))
	`;
};

const applyAuthorUpvoteHype = async (tx: Prisma.TransactionClient, input: ApplyAuthorUpvoteHypeInput) => {
	if (input.authorStudentId === input.voterStudentId) {
		return;
	}

	const hypeDelta = getUpvoteHypeDelta(input.previousVoteType, input.nextVoteType);

	if (hypeDelta === 0) {
		return;
	}

	await tx.$executeRaw`
		UPDATE "Student"
		SET "hype" = GREATEST(0, "hype" + ${hypeDelta}),
			"updatedAt" = CURRENT_TIMESTAMP
		WHERE "id" = ${input.authorStudentId}
	`;
};

export { acquireVoteTargetLock, applyAuthorUpvoteHype };
