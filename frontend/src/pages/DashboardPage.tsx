import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Download, Filter, Trash2, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { PostEditor } from '../components/posts/PostEditor';
import { PostCard, formatSize } from '../components/posts/PostCard';
import { SearchableFilter } from '../components/posts/SearchableFilter';
import { useAuth } from '../hooks/useAuth';
import {
	createPost,
	deletePost,
	fetchAttachmentDownload,
	fetchAttachmentPreview,
	fetchPostFilters,
	fetchPosts,
	fetchPostSubjects,
	updatePost,
	voteOnPost,
	type AcademicPost,
	type Course,
	type PostAttachment,
	type RichTextNode,
	type Subject,
} from '../services/postsService';

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

const DashboardPage = () => {
	const { accessToken, user } = useAuth();
	const [searchParams, setSearchParams] = useSearchParams();
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [allFilterSubjects, setAllFilterSubjects] = useState<Subject[]>([]);
	const [courses, setCourses] = useState<Course[]>([]);
	const [posts, setPosts] = useState<AcademicPost[]>([]);
	const [selectedSubjectId, setSelectedSubjectId] = useState(() => searchParams.get('subjectId') ?? '');
	const [selectedCourseId, setSelectedCourseId] = useState(() => searchParams.get('courseId') ?? '');
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editingPost, setEditingPost] = useState<AcademicPost | null>(null);
	const [postToDelete, setPostToDelete] = useState<AcademicPost | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [preview, setPreview] = useState<{ attachment: PostAttachment; url: string; gallery: PostAttachment[] } | null>(null);

	const selectedCourse = useMemo(() => {
		return courses.find((course) => course.id === selectedCourseId);
	}, [selectedCourseId, courses]);

	const filterSubjects = useMemo(() => {
		if (!selectedCourse) {
			return allFilterSubjects;
		}

		const courseSubjectIds = new Set(selectedCourse.subjectIds);
		return allFilterSubjects.filter((subject) => courseSubjectIds.has(subject.id));
	}, [allFilterSubjects, selectedCourse]);

	const selectedSubject = useMemo(() => {
		return filterSubjects.find((subject) => subject.id === selectedSubjectId);
	}, [selectedSubjectId, filterSubjects]);

	const loadFeed = useCallback(async () => {
		if (!accessToken) {
			return;
		}

		setIsLoading(true);

		try {
			const [subjectsResponse, filtersResponse, postsResponse] = await Promise.all([
				fetchPostSubjects(accessToken),
				fetchPostFilters(accessToken),
				fetchPosts(accessToken, {
					subjectId: selectedSubjectId || undefined,
					courseId: selectedCourseId || undefined,
				}),
			]);

			setSubjects(subjectsResponse.subjects);
			setAllFilterSubjects(filtersResponse.subjects);
			setCourses(filtersResponse.courses);
			setPosts(postsResponse.posts);
		} finally {
			setIsLoading(false);
		}
	}, [accessToken, selectedCourseId, selectedSubjectId]);

	useEffect(() => {
		void loadFeed();
	}, [loadFeed]);

	useEffect(() => {
		const nextCourseId = searchParams.get('courseId') ?? '';
		const nextSubjectId = searchParams.get('subjectId') ?? '';

		setSelectedCourseId(nextCourseId);
		setSelectedSubjectId(nextSubjectId);
	}, [searchParams]);

	useEffect(() => {
		if (allFilterSubjects.length === 0) {
			return;
		}

		if (selectedSubjectId && !filterSubjects.some((subject) => subject.id === selectedSubjectId)) {
			setSelectedSubjectId('');
		}
	}, [allFilterSubjects.length, filterSubjects, selectedSubjectId]);

	const updateFilterParams = (filters: { courseId?: string; subjectId?: string }) => {
		const nextParams = new URLSearchParams(searchParams);

		if (filters.courseId !== undefined) {
			if (filters.courseId) {
				nextParams.set('courseId', filters.courseId);
			} else {
				nextParams.delete('courseId');
			}
		}

		if (filters.subjectId !== undefined) {
			if (filters.subjectId) {
				nextParams.set('subjectId', filters.subjectId);
			} else {
				nextParams.delete('subjectId');
			}
		}

		setSearchParams(nextParams, { replace: true });
	};

	const handleCourseFilterChange = (courseId: string) => {
		setSelectedCourseId(courseId);
		updateFilterParams({ courseId });
	};

	const handleSubjectFilterChange = (subjectId: string) => {
		setSelectedSubjectId(subjectId);
		updateFilterParams({ subjectId });
	};

	useEffect(() => {
		return () => {
			if (preview?.url) {
				URL.revokeObjectURL(preview.url);
			}
		};
	}, [preview?.url]);

	const handleCreatePost = async (input: Parameters<typeof createPost>[1]) => {
		if (!accessToken) {
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await createPost(accessToken, input);
			setPosts((current) => [response.post, ...current]);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleUpdatePost = async (input: { title: string; subtitle?: string; subjectId: string; content: RichTextNode }) => {
		if (!accessToken || !editingPost) {
			return;
		}

		setIsEditing(true);

		try {
			const response = await updatePost(accessToken, editingPost.id, input);
			setPosts((current) => current.map((post) => (post.id === editingPost.id ? response.post : post)));
			setEditingPost(null);
		} finally {
			setIsEditing(false);
		}
	};

	const handleConfirmDeletePost = async () => {
		if (!accessToken || !postToDelete) {
			return;
		}

		setIsDeleting(true);

		try {
			await deletePost(accessToken, postToDelete.id);
			setPosts((current) => current.filter((item) => item.id !== postToDelete.id));
			setPostToDelete(null);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleVote = async (post: AcademicPost, direction: 1 | -1) => {
		if (!accessToken) {
			return;
		}

		const nextVote = post.votes.userVote === direction ? 0 : direction;
		const response = await voteOnPost(accessToken, post.id, nextVote);

		setPosts((current) =>
			current.map((item) => (item.id === post.id ? { ...item, votes: response.votes } : item)),
		);
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

	return (
		<section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-sm font-medium text-slate-500">Materiais academicos</p>
					<h1 className="text-2xl font-semibold text-slate-950">Feed academico</h1>
					<p className="mt-1 text-sm text-slate-600">Compartilhe materiais com estudantes de todos os cursos.</p>
				</div>

				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					<Filter className="size-4 text-slate-500" />
					<SearchableFilter
						label="Todos os cursos"
						value={selectedCourseId}
						options={courses}
						placeholder="Pesquisar curso"
						onChange={handleCourseFilterChange}
					/>
					<SearchableFilter
						label="Todas as disciplinas"
						value={selectedSubjectId}
						options={filterSubjects}
						placeholder="Pesquisar disciplina"
						onChange={handleSubjectFilterChange}
					/>
				</div>
			</div>

			<PostEditor subjects={subjects} isSubmitting={isSubmitting} onSubmit={handleCreatePost} />

			<div className="space-y-4">
				{selectedCourse || selectedSubject ? (
					<div className="rounded-lg border border-cyan-700/20 bg-cyan-50 px-4 py-2 text-sm text-cyan-900">
						Filtrando por {[selectedCourse?.name, selectedSubject?.name].filter(Boolean).join(' / ')}
					</div>
				) : null}

				{isLoading ? (
					<div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Carregando posts...</div>
				) : null}

				{!isLoading && posts.length === 0 ? (
					<div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
						Nenhum material publicado ainda.
					</div>
				) : null}

				{posts.map((post) => (
					<PostCard
						key={post.id}
						post={post}
						accessToken={accessToken}
						currentUserId={user?.id}
						onEdit={setEditingPost}
						onDelete={setPostToDelete}
						onVote={handleVote}
						onPreview={handlePreview}
						onDownload={handleDownload}
					/>
				))}
			</div>

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

			<Modal open={Boolean(editingPost)} onClose={() => setEditingPost(null)}>
				{editingPost ? (
					<div className="w-[min(92vw,760px)] rounded-lg bg-white p-4 shadow-xl">
						<div className="mb-4 flex items-center justify-between">
							<div>
								<h2 className="text-lg font-semibold text-slate-950">Editar post</h2>
								<p className="text-sm text-slate-500">Atualize o conteudo e a disciplina.</p>
							</div>
							<Button type="button" variant="ghost" size="icon-sm" onClick={() => setEditingPost(null)}>
								<X />
							</Button>
						</div>
						<PostEditor
							key={editingPost.id}
							subjects={subjects}
							isSubmitting={isEditing}
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
							<Button type="button" variant="outline" onClick={() => setPostToDelete(null)} disabled={isDeleting}>
								Cancelar
							</Button>
							<Button type="button" variant="destructive" onClick={handleConfirmDeletePost} disabled={isDeleting}>
								{isDeleting ? 'Excluindo...' : 'Excluir'}
							</Button>
						</div>
					</div>
				) : null}
			</Modal>
		</section>
	);
};

export { DashboardPage };
