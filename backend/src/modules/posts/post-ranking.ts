type PostRankingMetric = {
	score: number;
	upvotes: number;
	recentVotes: number;
	commentCount: number;
};

const scoreRelevantPost = (post: { createdAt: Date }, metric: PostRankingMetric) => {
	const ageHours = Math.max(1, (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60));
	const recencyBoost = Math.max(0, 48 - ageHours) / 12;
	return metric.upvotes * 3 + metric.commentCount * 2 + metric.recentVotes * 2 + metric.score + recencyBoost;
};

export { scoreRelevantPost };
export type { PostRankingMetric };
