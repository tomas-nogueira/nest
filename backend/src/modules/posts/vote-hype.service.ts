import type { Prisma } from "../../../generated/prisma/client";

type VoteType = 1 | -1 | 0;

type ApplyAuthorUpvoteHypeInput = {
	authorStudentId: string;
	voterStudentId: string;
	previousVoteType: VoteType;
	nextVoteType: VoteType;
};

const getUpvoteHypeDelta = (previousVoteType: VoteType, nextVoteType: VoteType) => {
	const previousUpvote = previousVoteType === 1 ? 1 : 0;
	const nextUpvote = nextVoteType === 1 ? 1 : 0;

	return nextUpvote - previousUpvote;
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

export { applyAuthorUpvoteHype };
