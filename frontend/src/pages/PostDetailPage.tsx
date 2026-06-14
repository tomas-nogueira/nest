import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Download, Trash2, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { CommentsThread } from '../components/posts/CommentsThread';
import { PostCard, formatSize } from '../components/posts/PostCard';
import { useAuth } from '../hooks/useAuth';
import {
	createComment,
	deleteComment,
	fetchAttachmentDownload,
	fetchAttachmentPreview,
	fetchPostById,
	fetchPostComments,
	updateComment,
	voteOnPost,
	voteOnComment,
	type AcademicPost,
	type PostComment,
	type PostAttachment,
} from '../services/postsService';

const downloadBlob = (blob: Blob, filename: string) => {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
};

const PostDetailPage = () => {
	const { postId } = useParams();
	const { accessToken } = useAuth();
	const [post, setPost] = useState<AcademicPost | null>(null);
	const [comments, setComments] = useState<PostComment[]>([]);
	const [commentsPagination, setCommentsPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isCommentsLoading, setIsCommentsLoading] = useState(false);
	const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
	const [commentToDelete, setCommentToDelete] = useState<PostComment | null>(null);
	const [isDeletingComment, setIsDeletingComment] = useState(false);
	const [preview, setPreview] = useState<{ attachment: PostAttachment; url: string; gallery: PostAttachment[] } | null>(null);

	const loadComments = useCallback(async (page: number) => {
		if (!accessToken || !postId) {
			return;
		}

		setIsCommentsLoading(true);

		try {
			const response = await fetchPostComments(accessToken, postId, page, 20);
			setComments((current) => (page === 1 ? response.comments : [...current, ...response.comments]));
			setCommentsPagination(response.pagination);
		} finally {
			setIsCommentsLoading(false);
		}
	}, [accessToken, postId]);

	const loadPost = useCallback(async () => {
		if (!accessToken || !postId) {
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetchPostById(accessToken, postId);
			setPost(response.post);
			await loadComments(1);
		} finally {
			setIsLoading(false);
		}
	}, [accessToken, loadComments, postId]);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			void loadPost();
		}, 0);

		return () => window.clearTimeout(timeoutId);
	}, [loadPost]);

	useEffect(() => {
		return () => {
			if (preview?.url) {
				URL.revokeObjectURL(preview.url);
			}
		};
	}, [preview?.url]);

	const handleVote = async (currentPost: AcademicPost, direction: 1 | -1) => {
		if (!accessToken) {
			return;
		}

		const nextVote = currentPost.votes.userVote === direction ? 0 : direction;
		const response = await voteOnPost(accessToken, currentPost.id, nextVote);
		setPost({ ...currentPost, votes: response.votes });
	};

	const replaceComment = (items: PostComment[], nextComment: PostComment): PostComment[] => {
		return items.map((comment) => {
			if (comment.id === nextComment.id) {
				return { ...nextComment, replies: comment.replies };
			}

			return { ...comment, replies: replaceComment(comment.replies, nextComment) };
		});
	};

	const updateCommentVotes = (items: PostComment[], commentId: string, votes: PostComment['votes']): PostComment[] => {
		return items.map((comment) => {
			if (comment.id === commentId) {
				return { ...comment, votes };
			}

			return { ...comment, replies: updateCommentVotes(comment.replies, commentId, votes) };
		});
	};

	const handleCreateComment = async (content: string, attachments: File[]) => {
		if (!accessToken || !postId) {
			return;
		}

		setIsCommentSubmitting(true);

		try {
			await createComment(accessToken, postId, { content, attachments });
			await loadComments(1);
			setPost((current) => (current ? { ...current, commentCount: current.commentCount + 1 } : current));
		} finally {
			setIsCommentSubmitting(false);
		}
	};

	const handleReplyComment = async (parentId: string, content: string, attachments: File[]) => {
		if (!accessToken || !postId) {
			return;
		}

		await createComment(accessToken, postId, { content, parentId, attachments });
		await loadComments(1);
		setPost((current) => (current ? { ...current, commentCount: current.commentCount + 1 } : current));
	};

	const handleEditComment = async (comment: PostComment, content: string) => {
		if (!accessToken || !postId) {
			return;
		}

		const response = await updateComment(accessToken, postId, comment.id, { content });
		setComments((current) => replaceComment(current, response.comment));
	};

	const handleVoteComment = async (comment: PostComment, direction: 1 | -1) => {
		if (!accessToken || !postId) {
			return;
		}

		const nextVote = comment.votes.userVote === direction ? 0 : direction;
		const response = await voteOnComment(accessToken, postId, comment.id, nextVote);
		setComments((current) => updateCommentVotes(current, comment.id, response.votes));
	};

	const handleConfirmDeleteComment = async () => {
		if (!accessToken || !postId || !commentToDelete) {
			return;
		}

		setIsDeletingComment(true);

		try {
			const response = await deleteComment(accessToken, postId, commentToDelete.id);
			await loadComments(1);
			setPost((current) =>
				current ? { ...current, commentCount: Math.max(0, current.commentCount - response.deletedCount) } : current,
			);
			setCommentToDelete(null);
		} finally {
			setIsDeletingComment(false);
		}
	};

	const handlePreview = async (attachment: PostAttachment, gallery: PostAttachment[] = [attachment]) => {
		if (!accessToken) {
			return;
		}

		const blob = await fetchAttachmentPreview(accessToken, attachment.file.id);
		const url = URL.createObjectURL(blob);
		setPreview((current) => {
			if (current?.url) {
				URL.revokeObjectURL(current.url);
			}

			return { attachment, url, gallery };
		});
	};

	const handleDownload = async (attachment: PostAttachment) => {
		if (!accessToken) {
			return;
		}

		const blob = await fetchAttachmentDownload(accessToken, attachment.file.id);
		downloadBlob(blob, attachment.file.originalName);
	};

	const handlePreviewNavigation = async (direction: 1 | -1) => {
		if (!preview || !accessToken || preview.gallery.length <= 1) {
			return;
		}

		const currentIndex = preview.gallery.findIndex((attachment) => attachment.id === preview.attachment.id);
		const nextIndex = (currentIndex + direction + preview.gallery.length) % preview.gallery.length;
		await handlePreview(preview.gallery[nextIndex], preview.gallery);
	};

	return (
		<section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
			<div>
				<p className="text-sm font-medium text-slate-500">Post</p>
				<h1 className="text-2xl font-semibold text-slate-950">Detalhe do post</h1>
			</div>

			{isLoading ? (
				<div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Carregando post...</div>
			) : null}

			{!isLoading && !post ? (
				<div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Post nao encontrado.</div>
			) : null}

			{post ? (
				<PostCard
					post={post}
					accessToken={accessToken}
					currentUserId={undefined}
					onEdit={() => undefined}
					onDelete={() => undefined}
					onVote={handleVote}
					onPreview={handlePreview}
					onDownload={handleDownload}
				/>
			) : null}

			{post ? (
				<div className="space-y-4">
					{isCommentsLoading && comments.length === 0 ? (
						<div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Carregando comentarios...</div>
					) : null}
					<CommentsThread
						comments={comments}
						token={accessToken}
						isSubmitting={isCommentSubmitting}
						onCreate={handleCreateComment}
						onReply={handleReplyComment}
						onVote={handleVoteComment}
						onEdit={handleEditComment}
						onDelete={setCommentToDelete}
						onPreview={handlePreview}
						onDownload={handleDownload}
					/>
					{commentsPagination && commentsPagination.page < commentsPagination.totalPages ? (
						<div className="flex justify-center">
							<Button type="button" variant="outline" onClick={() => loadComments(commentsPagination.page + 1)} disabled={isCommentsLoading}>
								{isCommentsLoading ? 'Carregando...' : 'Carregar mais comentarios'}
							</Button>
						</div>
					) : null}
				</div>
			) : null}

			<Modal open={Boolean(commentToDelete)} onClose={() => setCommentToDelete(null)}>
				{commentToDelete ? (
					<div className="w-[min(92vw,420px)] rounded-lg bg-white p-5 shadow-xl">
						<div className="flex items-start gap-3">
							<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
								<Trash2 className="size-5" />
							</span>
							<div>
								<h2 className="text-base font-semibold text-slate-950">Excluir comentario</h2>
								<p className="mt-1 text-sm leading-6 text-slate-600">
									Esta acao remove o comentario e todas as respostas vinculadas a ele.
								</p>
							</div>
						</div>
						<div className="mt-5 flex justify-end gap-2">
							<Button type="button" variant="outline" onClick={() => setCommentToDelete(null)} disabled={isDeletingComment}>
								Cancelar
							</Button>
							<Button type="button" variant="destructive" onClick={handleConfirmDeleteComment} disabled={isDeletingComment}>
								{isDeletingComment ? 'Excluindo...' : 'Excluir'}
							</Button>
						</div>
					</div>
				) : null}
			</Modal>

			<Modal
				open={Boolean(preview)}
				onClose={() => {
					setPreview((current) => {
						if (current?.url) {
							URL.revokeObjectURL(current.url);
						}

						return null;
					});
				}}
			>
				{preview ? (
					<div className="max-h-[90vh] w-[min(92vw,960px)] overflow-hidden rounded-lg bg-white shadow-xl">
						<div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
							<div className="min-w-0">
								<p className="truncate text-sm font-medium text-slate-900">{preview.attachment.file.originalName}</p>
								<p className="text-xs text-slate-500">{formatSize(preview.attachment.file.size)}</p>
							</div>
							<div className="flex items-center gap-2">
								<Button type="button" variant="ghost" size="icon-sm" title="Download" onClick={() => handleDownload(preview.attachment)}>
									<Download />
								</Button>
								<Button type="button" variant="ghost" size="icon-sm" title="Fechar" onClick={() => setPreview(null)}>
									<X />
								</Button>
							</div>
						</div>
						<div className="relative h-[70vh] bg-slate-100">
							{preview.attachment.file.mimeType === 'application/pdf' ? (
								<iframe className="h-full w-full" src={preview.url} title={preview.attachment.file.originalName} />
							) : (
								<img className="h-full w-full object-contain" src={preview.url} alt={preview.attachment.file.originalName} />
							)}
							{preview.attachment.file.mimeType.startsWith('image/') && preview.gallery.length > 1 ? (
								<>
									<Button
										type="button"
										variant="secondary"
										size="icon-lg"
										title="Imagem anterior"
										className="absolute top-1/2 left-3 -translate-y-1/2 bg-white/90 text-slate-800 shadow-sm"
										onClick={() => handlePreviewNavigation(-1)}
									>
										<ArrowLeft />
									</Button>
									<Button
										type="button"
										variant="secondary"
										size="icon-lg"
										title="Proxima imagem"
										className="absolute top-1/2 right-3 -translate-y-1/2 bg-white/90 text-slate-800 shadow-sm"
										onClick={() => handlePreviewNavigation(1)}
									>
										<ArrowRight />
									</Button>
								</>
							) : null}
						</div>
					</div>
				) : null}
			</Modal>
		</section>
	);
};

export { PostDetailPage };
