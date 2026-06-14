import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Download, X } from 'lucide-react';
import { ExploreEmptyState, ExploreErrorState, ExploreLoadingState } from '../components/explore/ExploreStates';
import { RecentThemeCard, TrendingCourseCard, TrendSection } from '../components/explore/TrendCards';
import { PostCard, formatSize } from '../components/posts/PostCard';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { useAuth } from '../hooks/useAuth';
import { fetchExplore, type ExploreResponse } from '../services/exploreService';
import {
	fetchAttachmentDownload,
	fetchAttachmentPreview,
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

const updatePostVotes = (posts: AcademicPost[], postId: string, votes: AcademicPost['votes']) => {
	return posts.map((post) => (post.id === postId ? { ...post, votes } : post));
};

const ExplorePage = () => {
	const { accessToken } = useAuth();
	const [explore, setExplore] = useState<ExploreResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [preview, setPreview] = useState<{ attachment: PostAttachment; url: string } | null>(null);

	const loadExplore = useCallback(async () => {
		if (!accessToken) {
			return;
		}

		setIsLoading(true);
		setHasError(false);

		try {
			const response = await fetchExplore(accessToken, 6);
			setExplore(response);
		} catch {
			setExplore(null);
			setHasError(true);
		} finally {
			setIsLoading(false);
		}
	}, [accessToken]);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			void loadExplore();
		}, 0);

		return () => window.clearTimeout(timeoutId);
	}, [loadExplore]);

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

		setExplore((current) => {
			if (!current) {
				return current;
			}

			return {
				...current,
				popularNow: updatePostVotes(current.popularNow, post.id, response.votes),
				popularCourse: {
					...current.popularCourse,
					posts: updatePostVotes(current.popularCourse.posts, post.id, response.votes),
				},
			};
		});
	};

	const handlePreview = async (attachment: PostAttachment) => {
		if (!accessToken) {
			return;
		}

		const blob = await fetchAttachmentPreview(accessToken, attachment.file.id);
		const url = URL.createObjectURL(blob);
		setPreview((current) => {
			if (current?.url) {
				URL.revokeObjectURL(current.url);
			}

			return { attachment, url };
		});
	};

	const handleDownload = async (attachment: PostAttachment) => {
		if (!accessToken) {
			return;
		}

		const blob = await fetchAttachmentDownload(accessToken, attachment.file.id);
		downloadBlob(blob, attachment.file.originalName);
	};

	const renderPostList = (posts: AcademicPost[], emptyTitle: string, emptyDescription: string, action?: ReactNode) => {
		if (posts.length === 0) {
			return <ExploreEmptyState title={emptyTitle} description={emptyDescription} action={action} />;
		}

		return (
			<div className="space-y-4">
				{posts.map((post) => (
					<PostCard
						key={post.id}
						post={post}
						accessToken={accessToken}
						onEdit={() => undefined}
						onDelete={() => undefined}
						onVote={handleVote}
						onPreview={(attachment) => handlePreview(attachment)}
						onDownload={handleDownload}
					/>
				))}
			</div>
		);
	};

	return (
		<section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
			<div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
						<Compass className="size-4 text-red-700" />
						Descoberta acadêmica
					</p>
					<h1 className="mt-1 text-2xl font-semibold text-slate-950">Explorar</h1>
					<p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
						Acompanhe posts em alta, cursos com atividade recente e temas que estão surgindo na plataforma.
					</p>
				</div>
				<Button asChild variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto">
					<Link to="/search">Abrir busca</Link>
				</Button>
			</div>

			{isLoading ? <ExploreLoadingState /> : null}

			{hasError && !isLoading ? <ExploreErrorState onRetry={loadExplore} /> : null}

			{explore && !isLoading && !hasError ? (
				<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
					<div className="space-y-8">
						<section className="space-y-4" aria-labelledby="popular-now-title">
							<div>
								<h2 id="popular-now-title" className="text-lg font-semibold text-slate-950">
									Populares do Momento
								</h2>
								<p className="mt-1 text-sm text-slate-500">Posts com mais votos e atividade recente em toda a plataforma.</p>
							</div>
							{renderPostList(
								explore.popularNow,
								'Nenhum post popular ainda',
								'Quando a comunidade interagir com posts, os principais materiais aparecem aqui.',
							)}
						</section>

						<section className="space-y-4" aria-labelledby="popular-course-title">
							<div>
								<h2 id="popular-course-title" className="text-lg font-semibold text-slate-950">
									Populares do Curso
								</h2>
								<p className="mt-1 text-sm text-slate-500">
									{explore.popularCourse.course
										? `Destaques relacionados a ${explore.popularCourse.course.name}.`
										: 'Defina seu curso para ver tendências mais próximas da sua rotina.'}
								</p>
							</div>
							{renderPostList(
								explore.popularCourse.posts,
								explore.popularCourse.course ? 'Seu curso ainda não tem destaques' : 'Curso não definido',
								explore.popularCourse.course
									? 'Os posts mais relevantes do seu curso aparecem aqui quando houver atividade suficiente.'
									: 'Complete seu perfil para receber tendências do seu curso.',
								<Button asChild variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
									<Link to="/profile">Completar perfil</Link>
								</Button>,
							)}
						</section>
					</div>

					<aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
						<TrendSection title="Cursos em Alta" description="Cursos com posts, votos e interações recentes.">
							{explore.trendingCourses.length === 0 ? (
								<div className="p-4 text-sm text-slate-500">Nenhum curso com atividade recente.</div>
							) : (
								explore.trendingCourses.map((course) => <TrendingCourseCard key={course.id} course={course} />)
							)}
						</TrendSection>

						<TrendSection title="Temas Recentes" description="Palavras-chave frequentes nos posts mais novos.">
							{explore.recentThemes.length === 0 ? (
								<div className="p-4 text-sm text-slate-500">Nenhum tema recente encontrado.</div>
							) : (
								explore.recentThemes.map((theme) => <RecentThemeCard key={theme.id} theme={theme} />)
							)}
						</TrendSection>
					</aside>
				</div>
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
						<div className="h-[70vh] bg-slate-100">
							{preview.attachment.file.mimeType === 'application/pdf' ? (
								<iframe className="h-full w-full" src={preview.url} title={preview.attachment.file.originalName} />
							) : (
								<img className="h-full w-full object-contain" src={preview.url} alt={preview.attachment.file.originalName} />
							)}
						</div>
					</div>
				) : null}
			</Modal>
		</section>
	);
};

export { ExplorePage };
