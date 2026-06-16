import { useEffect, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Download, Edit2, FileText, ImageIcon, MessageCircle, MoreHorizontal, Trash2, X } from 'lucide-react';
import { Button } from '../ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { UserAvatar } from '../UserAvatar';
import { fetchAttachmentPreview, type PostAttachment, type PostComment } from '../../services/postsService';

const formatCommentDate = (value: string) => {
	return new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
};

const CommentForm = ({
	initialValue = '',
	placeholder = 'Participe da conversa',
	submitLabel = 'Comentar',
	isSubmitting,
	compact = false,
	onSubmit,
	onCancel,
}: {
	initialValue?: string;
	placeholder?: string;
	submitLabel?: string;
	isSubmitting?: boolean;
	compact?: boolean;
	onSubmit(content: string, attachments: File[]): Promise<void> | void;
	onCancel?(): void;
}) => {
	const [content, setContent] = useState(initialValue);
	const [attachments, setAttachments] = useState<File[]>([]);
	const [isExpanded, setIsExpanded] = useState(Boolean(initialValue) || !compact);
	const trimmedContent = content.trim();
	const canSubmit = Boolean(trimmedContent) || attachments.length > 0;

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!canSubmit || isSubmitting) {
			return;
		}

		await onSubmit(trimmedContent, attachments);
		setContent('');
		setAttachments([]);
		if (compact) {
			setIsExpanded(false);
		}
	};

	if (!isExpanded) {
		return (
			<button
				type="button"
				className="flex h-11 w-full items-center rounded-full border border-slate-300 bg-white px-5 text-left text-sm text-slate-500 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
				onClick={() => setIsExpanded(true)}
			>
				{placeholder}
			</button>
		);
	}

	return (
		<form className="rounded-2xl border border-slate-300 bg-white px-4 py-3 focus-within:border-slate-400" onSubmit={handleSubmit}>
			<textarea
				value={content}
				rows={3}
				maxLength={4000}
				className="min-h-16 w-full resize-y border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-500"
				placeholder={placeholder}
				autoFocus={compact}
				onChange={(event) => setContent(event.target.value)}
			/>
			<div className="mt-3 flex items-center justify-between gap-3">
				<div className="flex items-center gap-3 text-xs font-medium text-slate-500">
					<label className="cursor-pointer rounded-md p-1 transition hover:bg-slate-100" aria-label="Adicionar midia">
						<ImageIcon className="size-4" />
						<input
							type="file"
							accept="image/png,image/jpeg,image/webp,application/pdf"
							multiple
							className="sr-only"
							onChange={(event) => {
								setAttachments(Array.from(event.target.files ?? []));
								event.target.value = '';
							}}
						/>
					</label>
				</div>
				<div className="flex items-center gap-2">
					{onCancel ? (
						<Button type="button" variant="ghost" size="sm" onClick={onCancel}>
							Cancelar
						</Button>
					) : null}
					{compact ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => {
								setContent('');
								setAttachments([]);
								setIsExpanded(false);
							}}
						>
							Cancelar
						</Button>
					) : null}
					<Button type="submit" size="sm" className="rounded-full bg-red-700 px-4 text-white hover:bg-red-800" disabled={!canSubmit || isSubmitting}>
						{isSubmitting ? 'Enviando...' : submitLabel}
					</Button>
				</div>
			</div>
			{attachments.length > 0 ? (
				<div className="mt-3 flex flex-wrap gap-2">
					{attachments.map((file) => (
						<span key={`${file.name}-${file.size}`} className="inline-flex max-w-full items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
							<span className="truncate">{file.name}</span>
							<button
								type="button"
								className="text-slate-400 hover:text-slate-700"
								aria-label={`Remover ${file.name}`}
								onClick={() => setAttachments((current) => current.filter((item) => item !== file))}
							>
								<X className="size-3.5" />
							</button>
						</span>
					))}
				</div>
			) : null}
		</form>
	);
};

const CommentAttachments = ({
	attachments,
	token,
	onPreview,
	onDownload,
}: {
	attachments: PostAttachment[];
	token: string | null;
	onPreview(attachment: PostAttachment, gallery: PostAttachment[]): void;
	onDownload(attachment: PostAttachment): void;
}) => {
	if (attachments.length === 0) {
		return null;
	}

	const imageAttachments = attachments.filter((attachment) => attachment.file.mimeType.startsWith('image/'));
	const documentAttachments = attachments.filter((attachment) => !attachment.file.mimeType.startsWith('image/'));

	const CommentImage = ({ attachment }: { attachment: PostAttachment }) => {
		const [url, setUrl] = useState<string | null>(null);

		useEffect(() => {
			if (!token) {
				return;
			}

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

		return url ? (
			<img src={url} alt={attachment.file.originalName} className="max-h-72 w-full object-cover" />
		) : (
			<span className="flex h-32 items-center justify-center text-slate-400">
				<ImageIcon className="size-5" />
			</span>
		);
	};

	return (
		<div className="mt-3 space-y-3">
			{imageAttachments.length > 0 ? (
				<div className="grid gap-2 sm:grid-cols-2">
					{imageAttachments.map((attachment) => (
						<button
							key={attachment.id}
							type="button"
							className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-left"
							onClick={() => onPreview(attachment, imageAttachments)}
						>
							<CommentImage attachment={attachment} />
						</button>
					))}
				</div>
			) : null}

			{documentAttachments.length > 0 ? (
				<div className="grid gap-2">
					{documentAttachments.map((attachment) => (
						<div key={attachment.id} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
							<button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => onPreview(attachment, [attachment])}>
								<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
									<FileText className="size-4" />
								</span>
								<span className="truncate text-sm font-medium text-slate-800">{attachment.file.originalName}</span>
							</button>
							<Button type="button" variant="ghost" size="icon-sm" title="Download" onClick={() => onDownload(attachment)}>
								<Download />
							</Button>
						</div>
					))}
				</div>
			) : null}
		</div>
	);
};

const CommentItem = ({
	comment,
	token,
	depth = 0,
	onReply,
	onVote,
	onEdit,
	onDelete,
	onPreview,
	onDownload,
}: {
	comment: PostComment;
	token: string | null;
	depth?: number;
	onReply(parentId: string, content: string, attachments: File[]): Promise<void> | void;
	onVote(comment: PostComment, direction: 1 | -1): Promise<void> | void;
	onEdit(comment: PostComment, content: string): Promise<void> | void;
	onDelete(comment: PostComment): void;
	onPreview(attachment: PostAttachment, gallery: PostAttachment[]): void;
	onDownload(attachment: PostAttachment): void;
}) => {
	const [isReplying, setIsReplying] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleReply = async (content: string, attachments: File[]) => {
		setIsSubmitting(true);
		try {
			await onReply(comment.id, content, attachments);
			setIsReplying(false);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEdit = async (content: string) => {
		setIsSubmitting(true);
		try {
			await onEdit(comment, content);
			setIsEditing(false);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className={depth > 0 ? 'border-l border-slate-200 pl-4' : undefined}>
			<article className="rounded-lg border border-slate-200 bg-white p-4">
				<header className="flex items-start justify-between gap-3">
					<div className="flex min-w-0 items-center gap-2">
						<UserAvatar
							name={comment.author.name}
							avatarUrl={comment.author.avatarUrl}
							token={token}
							className="size-7 shrink-0 text-[11px]"
						/>
						<div className="min-w-0">
							<p className="truncate text-sm font-semibold text-slate-900">{comment.author.name}</p>
							<time className="text-xs text-slate-500">{formatCommentDate(comment.createdAt)}</time>
						</div>
					</div>

					{comment.canEdit || comment.canDelete ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button type="button" variant="ghost" size="icon-sm" title="Opcoes do comentario">
									<MoreHorizontal />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg shadow-slate-950/5">
								{comment.canEdit ? (
									<DropdownMenuItem
										className="cursor-pointer rounded-md px-2 py-2 text-slate-700 transition-colors hover:bg-cyan-50 hover:text-cyan-800 focus:bg-cyan-50 focus:text-cyan-800"
										onClick={() => setIsEditing(true)}
									>
										<Edit2 />
										Editar
									</DropdownMenuItem>
								) : null}
								{comment.canDelete ? (
									<DropdownMenuItem
										variant="destructive"
										className="cursor-pointer rounded-md px-2 py-2 transition-colors hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700"
										onClick={() => onDelete(comment)}
									>
										<Trash2 />
										Excluir
									</DropdownMenuItem>
								) : null}
							</DropdownMenuContent>
						</DropdownMenu>
					) : null}
				</header>

				{isEditing ? (
					<div className="mt-3">
						<CommentForm
							initialValue={comment.content}
							submitLabel="Salvar"
							isSubmitting={isSubmitting}
							onSubmit={handleEdit}
							onCancel={() => setIsEditing(false)}
						/>
					</div>
				) : (
					<p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.content}</p>
				)}

				<CommentAttachments attachments={comment.attachments} token={token} onPreview={onPreview} onDownload={onDownload} />

				<div className="mt-3 flex flex-wrap items-center gap-2">
					<div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
						<Button
							type="button"
							variant={comment.votes.userVote === 1 ? 'secondary' : 'ghost'}
							size="icon-sm"
							title="Votar positivo"
							className={comment.votes.userVote === 1 ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100' : undefined}
							aria-pressed={comment.votes.userVote === 1}
							onClick={() => onVote(comment, 1)}
						>
							<ArrowUp className={comment.votes.userVote === 1 ? 'text-emerald-700' : undefined} />
						</Button>
						<span className="min-w-8 text-center text-sm font-semibold text-slate-800">{comment.votes.score}</span>
						<Button
							type="button"
							variant={comment.votes.userVote === -1 ? 'secondary' : 'ghost'}
							size="icon-sm"
							title="Votar negativo"
							className={comment.votes.userVote === -1 ? 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100' : undefined}
							aria-pressed={comment.votes.userVote === -1}
							onClick={() => onVote(comment, -1)}
						>
							<ArrowDown className={comment.votes.userVote === -1 ? 'text-red-700' : undefined} />
						</Button>
					</div>
					<Button type="button" variant="ghost" size="sm" className="gap-1.5 text-slate-600" onClick={() => setIsReplying((current) => !current)}>
						<MessageCircle className="size-4" />
						Responder
					</Button>
				</div>

				{isReplying ? (
					<div className="mt-3">
						<CommentForm
							placeholder="Escreva uma resposta..."
							submitLabel="Responder"
							isSubmitting={isSubmitting}
							onSubmit={handleReply}
							onCancel={() => setIsReplying(false)}
						/>
					</div>
				) : null}
			</article>

			{comment.replies.length > 0 ? (
				<div className="mt-3 space-y-3">
					{comment.replies.map((reply) => (
						<CommentItem
							key={reply.id}
							comment={reply}
							token={token}
							depth={depth + 1}
							onReply={onReply}
							onVote={onVote}
							onEdit={onEdit}
							onDelete={onDelete}
							onPreview={onPreview}
							onDownload={onDownload}
						/>
					))}
				</div>
			) : null}
		</div>
	);
};

const CommentsThread = ({
	comments,
	token,
	isSubmitting,
	onCreate,
	onReply,
	onVote,
	onEdit,
	onDelete,
	onPreview,
	onDownload,
}: {
	comments: PostComment[];
	token: string | null;
	isSubmitting?: boolean;
	onCreate(content: string, attachments: File[]): Promise<void> | void;
	onReply(parentId: string, content: string, attachments: File[]): Promise<void> | void;
	onVote(comment: PostComment, direction: 1 | -1): Promise<void> | void;
	onEdit(comment: PostComment, content: string): Promise<void> | void;
	onDelete(comment: PostComment): void;
	onPreview(attachment: PostAttachment, gallery: PostAttachment[]): void;
	onDownload(attachment: PostAttachment): void;
}) => {
	return (
		<section className="space-y-4" aria-label="Comentarios do post">
			<CommentForm compact isSubmitting={isSubmitting} onSubmit={onCreate} />

			{comments.length === 0 ? (
				<div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
					<p className="text-sm font-medium text-slate-900">Nenhum comentario ainda</p>
					<p className="mt-1 text-sm text-slate-500">Seja a primeira pessoa a comentar neste post.</p>
				</div>
			) : (
				<div className="space-y-3">
					{comments.map((comment) => (
						<CommentItem
							key={comment.id}
							comment={comment}
							token={token}
							onReply={onReply}
							onVote={onVote}
							onEdit={onEdit}
							onDelete={onDelete}
							onPreview={onPreview}
							onDownload={onDownload}
						/>
					))}
				</div>
			)}
		</section>
	);
};

export { CommentsThread };
