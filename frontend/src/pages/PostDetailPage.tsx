import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Download, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { PostCard, formatSize } from '../components/posts/PostCard';
import { useAuth } from '../hooks/useAuth';
import {
	fetchAttachmentDownload,
	fetchAttachmentPreview,
	fetchPostById,
	voteOnPost,
	type AcademicPost,
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
	const [isLoading, setIsLoading] = useState(true);
	const [preview, setPreview] = useState<{ attachment: PostAttachment; url: string; gallery: PostAttachment[] } | null>(null);

	const loadPost = useCallback(async () => {
		if (!accessToken || !postId) {
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetchPostById(accessToken, postId);
			setPost(response.post);
		} finally {
			setIsLoading(false);
		}
	}, [accessToken, postId]);

	useEffect(() => {
		void loadPost();
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
