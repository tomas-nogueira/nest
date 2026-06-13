import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	Download,
	Edit3,
	Flame,
	ImageIcon,
	Trash2,
	X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Modal } from '../components/ui/modal';
import { PostEditor } from '../components/posts/PostEditor';
import { PostCard, formatSize } from '../components/posts/PostCard';
import { UserAvatar } from '../components/UserAvatar';
import { useAuth } from '../hooks/useAuth';
import {
	fetchAttachmentDownload,
	fetchAttachmentPreview,
	fetchPostSubjects,
	deletePost,
	updatePost,
	voteOnPost,
	type AcademicPost,
	type PostAttachment,
	type RichTextNode,
	type Subject,
} from '../services/postsService';
import {
	fetchProfile,
	fetchProfilePosts,
	fetchProfileVotes,
	updateProfile,
	type Pagination,
	type ProfilePayload,
	type ProfileVote,
} from '../services/profileService';

type ProfileTab = 'overview' | 'posts' | 'votes' | 'comments';
type VoteFilter = 'all' | 'up' | 'down';
type OverviewItem =
	| { type: 'post'; id: string; createdAt: string; post: AcademicPost }
	| { type: 'vote'; id: string; createdAt: string; vote: ProfileVote };

const PAGE_SIZE = 10;

const emptyContent: RichTextNode = {
	type: 'doc',
	content: [{ type: 'paragraph' }],
};

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

const EmptyState = ({ title, description }: { title: string; description: string }) => (
	<div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
		<p className="text-sm font-medium text-slate-900">{title}</p>
		<p className="mt-1 text-sm text-slate-500">{description}</p>
	</div>
);

const getBannerStyle = (color: { r: number; g: number; b: number } | null) => {
	if (!color) {
		return {
			background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 45%, #06b6d4 100%)',
		};
	}

	const base = `rgb(${color.r}, ${color.g}, ${color.b})`;
	const dark = `rgb(${Math.max(0, color.r - 62)}, ${Math.max(0, color.g - 62)}, ${Math.max(0, color.b - 62)})`;
	const light = `rgb(${Math.min(255, color.r + 58)}, ${Math.min(255, color.g + 58)}, ${Math.min(255, color.b + 58)})`;

	return {
		background: `linear-gradient(135deg, ${dark} 0%, ${base} 52%, ${light} 100%)`,
	};
};

const EditProfileModal = ({
	open,
	profile,
	token,
	onClose,
	onSaved,
}: {
	open: boolean;
	profile: ProfilePayload;
	token: string | null;
	onClose(): void;
	onSaved(profile: ProfilePayload['user']): void;
}) => {
	const [name, setName] = useState(profile.user.name);
	const [bio, setBio] = useState(profile.user.bio ?? '');
	const [password, setPassword] = useState('');
	const [passwordConfirmation, setPasswordConfirmation] = useState('');
	const [avatar, setAvatar] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	useEffect(() => {
		if (!avatar) {
			return;
		}

		const url = URL.createObjectURL(avatar);
		queueMicrotask(() => setAvatarPreview(url));

		return () => URL.revokeObjectURL(url);
	}, [avatar]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!token) {
			return;
		}

		if (password && password !== passwordConfirmation) {
			setFormError('As senhas nao coincidem.');
			return;
		}

		setIsSubmitting(true);
		setFormError(null);

		try {
			const response = await updateProfile(token, {
				name,
				bio,
				password: password || undefined,
				passwordConfirmation: password ? passwordConfirmation : undefined,
				avatar,
			});
			onSaved(response.user);
			toast.success('Perfil atualizado com sucesso.');
			onClose();
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal open={open} onClose={onClose}>
			<form className="w-[min(94vw,560px)] rounded-lg bg-white p-5 shadow-xl" onSubmit={handleSubmit}>
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="text-lg font-semibold text-slate-950">Editar perfil</h2>
						<p className="text-sm text-slate-500">Atualize os dados visiveis e, se quiser, defina uma nova senha.</p>
					</div>
					<Button type="button" variant="ghost" size="icon-sm" title="Fechar" onClick={onClose}>
						<X />
					</Button>
				</div>

				<div className="mt-5 flex items-center gap-4">
					{avatarPreview ? (
						<img className="size-20 rounded-full object-cover" src={avatarPreview} alt="Previa do avatar" />
					) : (
						<UserAvatar name={profile.user.name} avatarUrl={profile.user.avatarUrl} token={token} className="size-20 text-xl" />
					)}
					<div>
						<Label htmlFor="avatar">Foto/avatar</Label>
						<Input
							id="avatar"
							type="file"
							accept="image/png,image/jpeg,image/webp"
							className="mt-2 rounded-lg border-slate-200 bg-white px-3 py-2 text-sm"
							onChange={(event) => {
								const file = event.target.files?.[0] ?? null;
								setAvatar(file);
								if (!file) {
									setAvatarPreview(null);
								}
							}}
						/>
					</div>
				</div>

				<div className="mt-5 grid gap-4">
					<div>
						<Label htmlFor="name">Nome</Label>
						<Input
							id="name"
							value={name}
							required
							minLength={2}
							className="mt-1 rounded-lg border-slate-200 bg-white"
							onChange={(event) => setName(event.target.value)}
						/>
					</div>
					<div>
						<Label htmlFor="bio">Descricao/bio</Label>
						<textarea
							id="bio"
							value={bio}
							maxLength={280}
							rows={4}
							className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
							placeholder="Conte um pouco sobre voce, seus interesses e materiais favoritos."
							onChange={(event) => setBio(event.target.value)}
						/>
						<p className="mt-1 text-xs text-slate-500">{bio.length}/280</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<Label htmlFor="password">Nova senha</Label>
							<Input
								id="password"
								type="password"
								value={password}
								minLength={6}
								autoComplete="new-password"
								className="mt-1 rounded-lg border-slate-200 bg-white"
								onChange={(event) => setPassword(event.target.value)}
							/>
						</div>
						<div>
							<Label htmlFor="passwordConfirmation">Confirmacao</Label>
							<Input
								id="passwordConfirmation"
								type="password"
								value={passwordConfirmation}
								required={Boolean(password)}
								minLength={password ? 6 : undefined}
								autoComplete="new-password"
								className="mt-1 rounded-lg border-slate-200 bg-white"
								onChange={(event) => setPasswordConfirmation(event.target.value)}
							/>
						</div>
					</div>
				</div>

				{formError ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p> : null}

				<div className="mt-6 flex justify-end gap-2">
					<Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
						Cancelar
					</Button>
					<Button type="submit" className="bg-red-700 text-white hover:bg-red-800" disabled={isSubmitting}>
						{isSubmitting ? 'Salvando...' : 'Salvar perfil'}
					</Button>
				</div>
			</form>
		</Modal>
	);
};

const ProfilePage = () => {
	const { studentId } = useParams();
	const { accessToken, user, updateUser } = useAuth();
	const [profile, setProfile] = useState<ProfilePayload | null>(null);
	const [posts, setPosts] = useState<AcademicPost[]>([]);
	const [postsPagination, setPostsPagination] = useState<Pagination | null>(null);
	const [votes, setVotes] = useState<ProfileVote[]>([]);
	const [votesPagination, setVotesPagination] = useState<Pagination | null>(null);
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
	const [voteFilter, setVoteFilter] = useState<VoteFilter>('all');
	const [bannerColor, setBannerColor] = useState<{ r: number; g: number; b: number } | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isPostsLoading, setIsPostsLoading] = useState(false);
	const [isVotesLoading, setIsVotesLoading] = useState(false);
	const [isEditingPost, setIsEditingPost] = useState(false);
	const [isDeletingPost, setIsDeletingPost] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [editingPost, setEditingPost] = useState<AcademicPost | null>(null);
	const [postToDelete, setPostToDelete] = useState<AcademicPost | null>(null);
	const [preview, setPreview] = useState<{ attachment: PostAttachment; url: string; gallery: PostAttachment[] } | null>(null);
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const isPostsLoadingRef = useRef(false);
	const isVotesLoadingRef = useRef(false);

	const isOwnProfile = !studentId || studentId === user?.id;
	const targetStudentId = profile?.user.id;
	const currentVoteType = voteFilter === 'up' ? 1 : voteFilter === 'down' ? -1 : undefined;

	const loadProfile = useCallback(async (resetLists = true) => {
		if (!accessToken) {
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetchProfile(accessToken, studentId);
			setProfile(response);
			if (resetLists) {
				setBannerColor(null);
				setPosts([]);
				setPostsPagination(null);
				setVotes([]);
				setVotesPagination(null);
				setVoteFilter('all');
				setActiveTab('overview');
			}
		} finally {
			setIsLoading(false);
		}
	}, [accessToken, studentId]);

	const loadPosts = useCallback(
		async (page: number) => {
			if (!accessToken || !targetStudentId || isPostsLoadingRef.current) {
				return;
			}

			isPostsLoadingRef.current = true;
			setIsPostsLoading(true);

			try {
				const response = await fetchProfilePosts(accessToken, targetStudentId, page, PAGE_SIZE);
				setPosts((current) => (page === 1 ? response.posts : [...current, ...response.posts]));
				setPostsPagination(response.pagination);
			} finally {
				isPostsLoadingRef.current = false;
				setIsPostsLoading(false);
			}
		},
		[accessToken, targetStudentId],
	);

	const loadVotes = useCallback(
		async (page: number) => {
			if (!accessToken || !targetStudentId || isVotesLoadingRef.current) {
				return;
			}

			isVotesLoadingRef.current = true;
			setIsVotesLoading(true);

			try {
				const response = await fetchProfileVotes(accessToken, targetStudentId, page, PAGE_SIZE, currentVoteType);
				setVotes((current) => (page === 1 ? response.votes : [...current, ...response.votes]));
				setVotesPagination(response.pagination);
			} finally {
				isVotesLoadingRef.current = false;
				setIsVotesLoading(false);
			}
		},
		[accessToken, currentVoteType, targetStudentId],
	);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			void loadProfile();
		}, 0);

		return () => window.clearTimeout(timeoutId);
	}, [loadProfile]);

	useEffect(() => {
		if (!accessToken || !isOwnProfile) {
			const timeoutId = window.setTimeout(() => setSubjects([]), 0);
			return () => window.clearTimeout(timeoutId);
		}

		const timeoutId = window.setTimeout(() => {
			void fetchPostSubjects(accessToken).then((response) => setSubjects(response.subjects));
		}, 0);

		return () => window.clearTimeout(timeoutId);
	}, [accessToken, isOwnProfile]);

	useEffect(() => {
		if (!targetStudentId) {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			void loadPosts(1);
		}, 0);

		return () => window.clearTimeout(timeoutId);
	}, [loadPosts, targetStudentId]);

	useEffect(() => {
		if (!targetStudentId) {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setVotes([]);
			setVotesPagination(null);
			void loadVotes(1);
		}, 0);

		return () => window.clearTimeout(timeoutId);
	}, [loadVotes, targetStudentId, voteFilter]);

	useEffect(() => {
		const sentinel = sentinelRef.current;

		if (!sentinel) {
			return;
		}

		const observer = new IntersectionObserver((entries) => {
			if (!entries[0]?.isIntersecting) {
				return;
			}

			if ((activeTab === 'posts' || activeTab === 'overview') && postsPagination && postsPagination.page < postsPagination.totalPages) {
				void loadPosts(postsPagination.page + 1);
			}

			if ((activeTab === 'votes' || activeTab === 'overview') && votesPagination && votesPagination.page < votesPagination.totalPages) {
				void loadVotes(votesPagination.page + 1);
			}
		}, { rootMargin: '360px 0px' });

		observer.observe(sentinel);

		return () => observer.disconnect();
	}, [activeTab, loadPosts, loadVotes, postsPagination, votesPagination]);

	useEffect(() => {
		return () => {
			if (preview?.url) {
				URL.revokeObjectURL(preview.url);
			}
		};
	}, [preview?.url]);

	const handleVote = async (post: AcademicPost, direction: 1 | -1) => {
		if (!accessToken) {
			return;
		}

		const nextVote = post.votes.userVote === direction ? 0 : direction;
		const response = await voteOnPost(accessToken, post.id, nextVote);
		const updatePostVote = (item: AcademicPost) => (item.id === post.id ? { ...item, votes: response.votes } : item);

		setPosts((current) => current.map(updatePostVote));
		setVotes((current) =>
			current
				.map((vote) => ({ ...vote, post: updatePostVote(vote.post) }))
				.filter((vote) => !(vote.post.id === post.id && nextVote === 0)),
		);
	};

	const replacePostInLists = (nextPost: AcademicPost) => {
		setPosts((current) => current.map((post) => (post.id === nextPost.id ? nextPost : post)));
		setVotes((current) => current.map((vote) => (vote.post.id === nextPost.id ? { ...vote, post: nextPost } : vote)));
	};

	const removePostFromLists = (postId: string) => {
		setPosts((current) => current.filter((post) => post.id !== postId));
		setVotes((current) => current.filter((vote) => vote.post.id !== postId));
		setProfile((current) =>
			current
				? {
						...current,
						summary: {
							...current.summary,
							postsCount: Math.max(0, current.summary.postsCount - 1),
						},
					}
				: current,
		);
	};

	const handleUpdatePost = async (input: { title: string; subtitle?: string; subjectId: string; content: RichTextNode }) => {
		if (!accessToken || !editingPost) {
			return;
		}

		setIsEditingPost(true);

		try {
			const response = await updatePost(accessToken, editingPost.id, input);
			replacePostInLists(response.post);
			setEditingPost(null);
		} finally {
			setIsEditingPost(false);
		}
	};

	const handleConfirmDeletePost = async () => {
		if (!accessToken || !postToDelete) {
			return;
		}

		setIsDeletingPost(true);

		try {
			await deletePost(accessToken, postToDelete.id);
			removePostFromLists(postToDelete.id);
			setPostToDelete(null);
		} finally {
			setIsDeletingPost(false);
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

	const handlePreviewNavigation = async (direction: 1 | -1) => {
		if (!preview || !accessToken || preview.gallery.length <= 1) {
			return;
		}

		const currentIndex = preview.gallery.findIndex((attachment) => attachment.id === preview.attachment.id);
		const nextIndex = (currentIndex + direction + preview.gallery.length) % preview.gallery.length;
		const nextAttachment = preview.gallery[nextIndex];

		await handlePreview(nextAttachment, preview.gallery);
	};

	const handleDownload = async (attachment: PostAttachment) => {
		if (!accessToken) {
			return;
		}

		const blob = await fetchAttachmentDownload(accessToken, attachment.file.id);
		downloadBlob(blob, attachment.file.originalName);
	};

	const handleSavedProfile = (nextUser: ProfilePayload['user']) => {
		if (isOwnProfile) {
			updateUser(nextUser);
		}
		setProfile((current) => (current ? { ...current, user: nextUser } : current));
	};

	const handleDominantColor = useCallback((color: { r: number; g: number; b: number } | null) => {
		setBannerColor(color);
	}, []);

	const tabs: Array<{ id: ProfileTab; label: string }> = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'posts', label: 'Posts' },
		{ id: 'votes', label: 'Votes' },
		{ id: 'comments', label: 'Comentarios' },
	];

	const canLoadMore = useMemo(() => {
		if (activeTab === 'posts') {
			return Boolean(postsPagination && postsPagination.page < postsPagination.totalPages);
		}

		if (activeTab === 'votes') {
			return Boolean(votesPagination && votesPagination.page < votesPagination.totalPages);
		}

		if (activeTab === 'overview') {
			return Boolean(
				(postsPagination && postsPagination.page < postsPagination.totalPages) ||
				(votesPagination && votesPagination.page < votesPagination.totalPages),
			);
		}

		return false;
	}, [activeTab, postsPagination, votesPagination]);

	const overviewItems = useMemo<OverviewItem[]>(() => {
		if (!profile) {
			return [];
		}

		return [
			...posts.map((post) => ({
				type: 'post' as const,
				id: post.id,
				createdAt: post.createdAt,
				post,
			})),
			...votes
				.filter((vote) => vote.post.author.id !== profile.user.id)
				.map((vote) => ({
					type: 'vote' as const,
					id: vote.post.id,
					createdAt: vote.createdAt,
					vote,
				})),
		].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
	}, [posts, profile, votes]);

	if (isLoading) {
		return (
			<section className="mx-auto flex w-full max-w-5xl flex-col gap-4">
				<div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Carregando perfil...</div>
			</section>
		);
	}

	if (!profile) {
		return (
			<section className="mx-auto flex w-full max-w-5xl flex-col gap-4">
				<EmptyState title="Perfil indisponivel" description="Nao foi possivel carregar os dados do perfil agora." />
			</section>
		);
	}

	return (
		<section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
			<div className="rounded-lg border border-slate-200 bg-white shadow-sm">
				<div className="h-36 rounded-t-lg" style={getBannerStyle(bannerColor)} />
				<div className="px-5 pb-5 sm:px-6">
					<div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
						<UserAvatar
							name={profile.user.name}
							avatarUrl={profile.user.avatarUrl}
							token={accessToken}
							className="relative z-10 size-24 border-4 border-white text-2xl shadow-sm"
							onDominantColor={handleDominantColor}
						/>
						{isOwnProfile ? (
							<Button type="button" variant="outline" className="gap-2 self-start sm:self-auto" onClick={() => setIsEditOpen(true)}>
								<Edit3 className="size-4" />
								Editar perfil
							</Button>
						) : null}
					</div>

					<div className="mt-4">
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="text-2xl font-semibold text-slate-950">{profile.user.name}</h1>
							<span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
								<Flame className="size-3.5" />
								Hype {profile.user.hype}
							</span>
						</div>
						<p className="mt-1 text-sm text-slate-500">{profile.user.email}</p>
						<p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
							{profile.user.bio || 'Sem bio por enquanto.'}
						</p>
						<div className="mt-4 flex flex-wrap gap-2 text-sm">
							<span className="rounded-full border border-slate-200 px-3 py-1 text-slate-700">
								Curso: {profile.user.course?.name ?? 'Nao informado'}
							</span>
							<span className="rounded-full border border-slate-200 px-3 py-1 text-slate-700">
								{profile.summary.postsCount} posts
							</span>
							<span className="rounded-full border border-slate-200 px-3 py-1 text-slate-700">
								{profile.summary.votesCount} votos
							</span>
						</div>
					</div>
				</div>

				<nav className="flex overflow-x-auto border-t border-slate-200" aria-label="Abas do perfil">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							type="button"
							className={`min-w-28 flex-1 border-b-2 px-4 py-3 text-sm font-medium transition ${
								activeTab === tab.id
									? 'border-red-700 text-red-700'
									: 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
							}`}
							aria-pressed={activeTab === tab.id}
							onClick={() => setActiveTab(tab.id)}
						>
							{tab.label}
						</button>
					))}
				</nav>
			</div>

			{activeTab === 'overview' ? (
				<div className="space-y-4">
					{overviewItems.length === 0 && !isPostsLoading && !isVotesLoading ? (
						<EmptyState
							title="Nenhuma atividade encontrada"
							description="Posts, votos e comentarios aparecerao aqui em ordem cronologica."
						/>
					) : (
						overviewItems.map((item) => {
							if (item.type === 'post') {
								return (
									<div key={`overview-post-${item.id}`} className="space-y-2">
										<div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
											Post publicado
										</div>
										<PostCard
											post={item.post}
											accessToken={accessToken}
											currentUserId={isOwnProfile ? user?.id : undefined}
											onEdit={setEditingPost}
											onDelete={setPostToDelete}
											onVote={handleVote}
											onPreview={handlePreview}
											onDownload={handleDownload}
										/>
									</div>
								);
							}

							return (
								<div key={`overview-vote-${item.id}-${item.vote.voteType}`} className="space-y-2">
									<div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
										{item.vote.voteType === 1 ? <ArrowUp className="size-3.5 text-emerald-700" /> : <ArrowDown className="size-3.5 text-red-700" />}
										{item.vote.voteType === 1 ? 'Upvote' : 'Downvote'}
									</div>
									<PostCard
										post={item.vote.post}
										accessToken={accessToken}
										currentUserId={isOwnProfile ? user?.id : undefined}
										onEdit={setEditingPost}
										onDelete={setPostToDelete}
										onVote={handleVote}
										onPreview={handlePreview}
										onDownload={handleDownload}
									/>
								</div>
							);
						})
					)}

					{profile.summary.commentsCount === 0 ? (
						<div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
							Comentarios serao intercalados nesta timeline quando o modulo for implementado.
						</div>
					) : null}
				</div>
			) : null}

			{activeTab === 'posts' ? (
				<div className="space-y-4">
					{posts.length === 0 && !isPostsLoading ? (
						<EmptyState title="Nenhum post publicado" description="Os posts desse perfil aparecerao aqui." />
					) : (
						posts.map((post) => (
							<PostCard
								key={post.id}
								post={post}
								accessToken={accessToken}
								currentUserId={isOwnProfile ? user?.id : undefined}
								onEdit={setEditingPost}
								onDelete={setPostToDelete}
								onVote={handleVote}
								onPreview={handlePreview}
								onDownload={handleDownload}
							/>
						))
					)}
				</div>
			) : null}

			{activeTab === 'votes' ? (
				<div className="space-y-4">
					<div className="flex flex-wrap gap-2">
						{[
							{ id: 'all', label: 'Todos' },
							{ id: 'up', label: 'Upvotes' },
							{ id: 'down', label: 'Downvotes' },
						].map((filter) => (
							<Button
								key={filter.id}
								type="button"
								variant={voteFilter === filter.id ? 'secondary' : 'outline'}
								onClick={() => setVoteFilter(filter.id as VoteFilter)}
							>
								{filter.label}
							</Button>
						))}
					</div>
					{votes.length === 0 && !isVotesLoading ? (
						<EmptyState title="Nenhum voto encontrado" description="Os posts votados serao listados conforme o filtro selecionado." />
					) : (
						votes.map((vote) => (
							<div key={`${vote.post.id}-${vote.voteType}`} className="space-y-2">
								<div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
									{vote.voteType === 1 ? <ArrowUp className="size-3.5 text-emerald-700" /> : <ArrowDown className="size-3.5 text-red-700" />}
									{vote.voteType === 1 ? 'Upvote' : 'Downvote'}
								</div>
								<PostCard
									post={vote.post}
									accessToken={accessToken}
									currentUserId={isOwnProfile ? user?.id : undefined}
									onEdit={setEditingPost}
									onDelete={setPostToDelete}
									onVote={handleVote}
									onPreview={handlePreview}
									onDownload={handleDownload}
								/>
							</div>
						))
					)}
				</div>
			) : null}

			{activeTab === 'comments' ? (
				<EmptyState
					title="Comentarios em preparacao"
					description="A estrutura da aba ja esta reservada para exibir os comentarios quando o modulo for implementado."
				/>
			) : null}

			<div ref={sentinelRef} className="h-1" aria-hidden="true" />
			{activeTab !== 'comments' && (isPostsLoading || isVotesLoading) ? (
				<div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Carregando mais itens...</div>
			) : null}
			{activeTab !== 'comments' && !canLoadMore && (posts.length > 0 || votes.length > 0) ? (
				<p className="pb-2 text-center text-xs text-slate-400">Voce chegou ao fim da lista.</p>
			) : null}

			{isEditOpen && isOwnProfile ? (
				<EditProfileModal
					key={profile.user.id}
					open={isEditOpen}
					profile={profile}
					token={accessToken}
					onClose={() => setIsEditOpen(false)}
					onSaved={handleSavedProfile}
				/>
			) : null}

			<Modal open={Boolean(editingPost)} onClose={() => setEditingPost(null)}>
				{editingPost ? (
					<div className="w-[min(92vw,760px)] rounded-lg bg-white p-4 shadow-xl">
						<div className="mb-4 flex items-center justify-between">
							<div>
								<h2 className="text-lg font-semibold text-slate-950">Editar post</h2>
								<p className="text-sm text-slate-500">Atualize o conteudo e a disciplina.</p>
							</div>
							<Button type="button" variant="ghost" size="icon-sm" title="Fechar" onClick={() => setEditingPost(null)}>
								<X />
							</Button>
						</div>
						<PostEditor
							key={editingPost.id}
							subjects={subjects}
							isSubmitting={isEditingPost}
							allowAttachments={false}
							initialTitle={editingPost.title}
							initialSubtitle={editingPost.subtitle}
							initialSubjectId={editingPost.subject.id}
							initialContent={editingPost.content ?? emptyContent}
							submitLabel="Salvar"
							onSubmit={handleUpdatePost}
						/>
					</div>
				) : null}
			</Modal>

			<Modal open={Boolean(postToDelete)} onClose={() => setPostToDelete(null)}>
				{postToDelete ? (
					<div className="w-[min(92vw,420px)] rounded-lg bg-white p-5 shadow-xl">
						<div className="flex items-start gap-3">
							<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
								<Trash2 className="size-5" />
							</span>
							<div>
								<h2 className="text-base font-semibold text-slate-950">Excluir post</h2>
								<p className="mt-1 text-sm leading-6 text-slate-600">
									Esta acao remove o post e seus anexos. Nao sera possivel desfazer.
								</p>
							</div>
						</div>
						<div className="mt-5 flex justify-end gap-2">
							<Button type="button" variant="outline" onClick={() => setPostToDelete(null)} disabled={isDeletingPost}>
								Cancelar
							</Button>
							<Button type="button" variant="destructive" onClick={handleConfirmDeletePost} disabled={isDeletingPost}>
								{isDeletingPost ? 'Excluindo...' : 'Excluir'}
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
							) : preview.attachment.file.mimeType.startsWith('image/') ? (
								<img className="h-full w-full object-contain" src={preview.url} alt={preview.attachment.file.originalName} />
							) : (
								<div className="flex h-full items-center justify-center text-slate-400">
									<ImageIcon className="size-8" />
								</div>
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

export { ProfilePage };
