import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Download, Edit2, FileText, ImageIcon, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { RichTextRenderer } from './RichTextRenderer';
import { UserAvatar } from '../UserAvatar';
import { fetchAttachmentPreview, type AcademicPost, type PostAttachment, type RichTextNode } from '../../services/postsService';

const CONTENT_COLLAPSE_HEIGHT = 260;

const formatDate = (value: string) => {
	return new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
};

const formatSize = (size: number) => {
	if (size < 1024 * 1024) {
		return `${Math.max(1, Math.round(size / 1024))} KB`;
	}

	return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const AttachmentImage = ({
	attachment,
	token,
	className,
	onClick,
}: {
	attachment: PostAttachment;
	token: string;
	className?: string;
	onClick(): void;
}) => {
	const [url, setUrl] = useState<string | null>(null);

	useEffect(() => {
		let objectUrl: string | null = null;
		let isMounted = true;

		const loadImage = async () => {
			const blob = await fetchAttachmentPreview(token, attachment.file.id);
			objectUrl = URL.createObjectURL(blob);

			if (isMounted) {
				setUrl(objectUrl);
			}
		};

		void loadImage();

		return () => {
			isMounted = false;
			if (objectUrl) {
				URL.revokeObjectURL(objectUrl);
			}
		};
	}, [attachment.file.id, token]);

	return (
		<button type="button" className={`relative overflow-hidden bg-slate-100 ${className ?? ''}`} onClick={onClick}>
			{url ? (
				<img className="h-full w-full object-cover" src={url} alt={attachment.file.originalName} />
			) : (
				<span className="flex h-full w-full items-center justify-center text-slate-400">
					<ImageIcon className="size-6" />
				</span>
			)}
		</button>
	);
};

const ImageGallery = ({
	attachments,
	token,
	onPreview,
	onDownload,
}: {
	attachments: PostAttachment[];
	token: string;
	onPreview(attachment: PostAttachment, gallery: PostAttachment[]): void;
	onDownload(attachment: PostAttachment): void;
}) => {
	const visibleImages = attachments.slice(0, 4);
	const remainingCount = Math.max(attachments.length - 4, 0);

	if (attachments.length === 0) {
		return null;
	}

	return (
		<div className={`mt-4 grid overflow-hidden rounded-lg border border-slate-200 ${attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
			{visibleImages.map((attachment, index) => {
				const isLargeFirst = attachments.length === 3 && index === 0;
				const showMore = remainingCount > 0 && index === 3;

				return (
					<div key={attachment.id} className={`group relative ${isLargeFirst ? 'row-span-2' : ''}`}>
						<AttachmentImage
							attachment={attachment}
							token={token}
							className={`aspect-video w-full ${attachments.length === 1 ? 'max-h-[520px]' : 'h-full min-h-40'} ${isLargeFirst ? 'min-h-80' : ''}`}
							onClick={() => onPreview(attachment, attachments)}
						/>
						{showMore ? (
							<button
								type="button"
								className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-3xl font-semibold text-white"
								onClick={() => onPreview(attachment, attachments)}
							>
								+{remainingCount}
							</button>
						) : null}
						<Button
							type="button"
							variant="secondary"
							size="icon-sm"
							title="Download"
							className="absolute right-2 bottom-2 bg-white/90 text-slate-800 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
							onClick={(event) => {
								event.stopPropagation();
								onDownload(attachment);
							}}
						>
							<Download />
						</Button>
					</div>
				);
			})}
		</div>
	);
};

const CollapsiblePostContent = ({ content }: { content: RichTextNode | null }) => {
	const contentRef = useRef<HTMLDivElement | null>(null);
	const [isExpanded, setIsExpanded] = useState(false);
	const [canCollapse, setCanCollapse] = useState(false);

	useLayoutEffect(() => {
		const element = contentRef.current;

		if (!element) {
			return;
		}

		setCanCollapse(element.scrollHeight > CONTENT_COLLAPSE_HEIGHT);
		setIsExpanded(false);
	}, [content]);

	if (!content) {
		return null;
	}

	return (
		<div className="mt-4">
			<div
				ref={contentRef}
				className="relative overflow-hidden"
				style={{ maxHeight: canCollapse && !isExpanded ? CONTENT_COLLAPSE_HEIGHT : undefined }}
			>
				<RichTextRenderer content={content} />
				{canCollapse && !isExpanded ? <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-white/0" /> : null}
			</div>
			{canCollapse ? (
				<button
					type="button"
					className="mt-2 text-sm font-medium text-cyan-700 hover:text-cyan-900"
					onClick={() => setIsExpanded((current) => !current)}
				>
					{isExpanded ? 'Mostrar menos' : 'Ler mais...'}
				</button>
			) : null}
		</div>
	);
};

type PostCardProps = {
	post: AcademicPost;
	accessToken: string | null;
	currentUserId?: string;
	onEdit(post: AcademicPost): void;
	onDelete(post: AcademicPost): void;
	onVote(post: AcademicPost, direction: 1 | -1): void;
	onPreview(attachment: PostAttachment, gallery: PostAttachment[]): void;
	onDownload(attachment: PostAttachment): void;
};

const PostCard = ({ post, accessToken, currentUserId, onEdit, onDelete, onVote, onPreview, onDownload }: PostCardProps) => {
	const imageAttachments = post.attachments.filter((attachment) => attachment.file.mimeType.startsWith('image/'));
	const documentAttachments = post.attachments.filter((attachment) => !attachment.file.mimeType.startsWith('image/'));

	return (
		<article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
			<header className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<Link
							to={`/profile/${post.author.id}`}
							className="inline-flex min-w-0 items-center gap-2 rounded-md pr-1 text-sm font-semibold text-slate-950 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
						>
							<UserAvatar
								name={post.author.name}
								avatarUrl={post.author.avatarUrl}
								token={accessToken}
								className="size-7 shrink-0 text-[11px]"
							/>
							<span className="truncate">{post.author.name}</span>
						</Link>
						<span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
							{post.subject.name}
						</span>
					</div>
					<time className="text-xs text-slate-500">{formatDate(post.createdAt)}</time>
				</div>

				{post.author.id === currentUserId ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button type="button" variant="ghost" size="icon-sm" title="Opcoes do post">
								<MoreHorizontal />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg shadow-slate-950/5">
							<DropdownMenuItem
								className="cursor-pointer rounded-md px-2 py-2 text-slate-700 transition-colors hover:bg-cyan-50 hover:text-cyan-800 focus:bg-cyan-50 focus:text-cyan-800"
								onClick={() => onEdit(post)}
							>
								<Edit2 />
								Editar
							</DropdownMenuItem>
							<DropdownMenuItem
								variant="destructive"
								className="cursor-pointer rounded-md px-2 py-2 transition-colors hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700"
								onClick={() => onDelete(post)}
							>
								<Trash2 />
								Excluir
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
			</header>

			<div className="mt-4 space-y-2">
				<h2 className="text-2xl font-semibold leading-tight text-slate-950">{post.title}</h2>
				{post.subtitle ? <p className="max-w-3xl text-sm leading-6 text-slate-600">{post.subtitle}</p> : null}
			</div>

			<CollapsiblePostContent content={post.content} />

			{accessToken ? (
				<ImageGallery
					attachments={imageAttachments}
					token={accessToken}
					onPreview={onPreview}
					onDownload={onDownload}
				/>
			) : null}

			{documentAttachments.length > 0 ? (
				<div className="mt-4 grid gap-3 sm:grid-cols-2">
					{documentAttachments.map((attachment) => {
						const isPdf = attachment.file.mimeType === 'application/pdf';

						return (
							<div key={attachment.id} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
								<button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => onPreview(attachment, [attachment])} disabled={!isPdf}>
									<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
										<FileText className="size-5" />
									</span>
									<span className="min-w-0">
										<span className="block truncate text-sm font-medium text-slate-800">{attachment.file.originalName}</span>
										<span className="block text-xs text-slate-500">{formatSize(attachment.file.size)}</span>
									</span>
								</button>
								<Button type="button" variant="ghost" size="icon-sm" title="Download" onClick={() => onDownload(attachment)}>
									<Download />
								</Button>
							</div>
						);
					})}
				</div>
			) : null}

			<footer className="mt-4 flex items-center border-t border-slate-100 pt-3">
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
						<Button
							type="button"
							variant={post.votes.userVote === 1 ? 'secondary' : 'ghost'}
							size="icon-sm"
							title="Votar positivo"
							className={post.votes.userVote === 1 ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100' : undefined}
							aria-pressed={post.votes.userVote === 1}
							onClick={() => onVote(post, 1)}
						>
							<ArrowUp className={post.votes.userVote === 1 ? 'text-emerald-700' : undefined} />
						</Button>
						<span className="min-w-8 text-center text-sm font-semibold text-slate-800">{post.votes.score}</span>
						<Button
							type="button"
							variant={post.votes.userVote === -1 ? 'secondary' : 'ghost'}
							size="icon-sm"
							title="Votar negativo"
							className={post.votes.userVote === -1 ? 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100' : undefined}
							aria-pressed={post.votes.userVote === -1}
							onClick={() => onVote(post, -1)}
						>
							<ArrowDown className={post.votes.userVote === -1 ? 'text-red-700' : undefined} />
						</Button>
					</div>
					<Link
						to={`/posts/${post.id}`}
						className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
					>
						<MessageCircle className="size-4" />
						{post.commentCount}
					</Link>
				</div>
			</footer>
		</article>
	);
};

export { PostCard, formatSize };
