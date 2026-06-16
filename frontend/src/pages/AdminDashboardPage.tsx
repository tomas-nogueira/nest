import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
	Activity,
	BookOpen,
	FileText,
	GraduationCap,
	MessageSquare,
	Paperclip,
	ThumbsUp,
	Trophy,
	Users,
	type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import {
	fetchAdminDashboard,
	type ActiveSubject,
	type AdminDashboardPeriod,
	type AdminDashboardResponse,
	type RankedPost,
	type StudentEngagement,
	type TrendingCourse,
} from '../services/adminDashboardService';

const periodOptions: AdminDashboardPeriod[] = [7, 14, 30];

const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

const parsePeriod = (value: string | null): AdminDashboardPeriod => {
	const parsed = Number(value);
	return periodOptions.includes(parsed as AdminDashboardPeriod) ? (parsed as AdminDashboardPeriod) : 30;
};

const MetricCard = ({
	label,
	value,
	icon: Icon,
}: {
	label: string;
	value: number;
	icon: LucideIcon;
}) => (
	<div className="rounded-lg border border-red-500/10 bg-white p-4 shadow-sm">
		<div className="flex items-center justify-between gap-3">
			<p className="text-sm font-medium text-slate-500">{label}</p>
			<span className="flex size-9 items-center justify-center rounded-lg bg-red-50 text-red-700">
				<Icon className="size-4" />
			</span>
		</div>
		<p className="mt-3 text-2xl font-semibold text-slate-950">{formatNumber(value)}</p>
	</div>
);

const EmptyState = ({ text }: { text: string }) => (
	<div className="rounded-lg border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">{text}</div>
);

const RankingShell = ({ title, children }: { title: string; children: ReactNode }) => (
	<section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
		<h2 className="text-base font-semibold text-slate-950">{title}</h2>
		<div className="mt-4 space-y-3">{children}</div>
	</section>
);

const RelevantPostRow = ({ post, index }: { post: RankedPost; index: number }) => (
	<Link
		to={`/posts/${post.id}`}
		className="flex gap-3 rounded-lg border border-slate-100 p-3 transition hover:border-red-500/20 hover:bg-red-50/30"
	>
		<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
			{index + 1}
		</span>
		<div className="min-w-0 flex-1">
			<p className="truncate text-sm font-medium text-slate-950">{post.title}</p>
			<p className="mt-1 truncate text-xs text-slate-500">
				{post.subject.name} por {post.author.name}
			</p>
			<div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
				<span>{formatNumber(post.votes.upvotes)} upvotes</span>
				<span>{formatNumber(post.commentCount)} comentarios</span>
				<span>score {formatNumber(Math.round(post.rankScore))}</span>
			</div>
		</div>
	</Link>
);

const CourseRow = ({ course, index }: { course: TrendingCourse; index: number }) => (
	<div className="flex gap-3 rounded-lg border border-slate-100 p-3">
		<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-sm font-semibold text-cyan-800">
			{index + 1}
		</span>
		<div className="min-w-0 flex-1">
			<p className="truncate text-sm font-medium text-slate-950">{course.name}</p>
			<p className="mt-1 text-xs text-slate-500">
				{formatNumber(course.recentPostsCount)} posts recentes, {formatNumber(course.votesCount)} votos
			</p>
		</div>
		<span className="text-sm font-semibold text-slate-700">{formatNumber(course.engagementScore)}</span>
	</div>
);

const SubjectRow = ({ subject, index }: { subject: ActiveSubject; index: number }) => (
	<div className="flex gap-3 rounded-lg border border-slate-100 p-3">
		<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-sm font-semibold text-amber-800">
			{index + 1}
		</span>
		<div className="min-w-0 flex-1">
			<p className="truncate text-sm font-medium text-slate-950">{subject.name}</p>
			<p className="mt-1 text-xs text-slate-500">
				{formatNumber(subject.postsCount)} posts, {formatNumber(subject.commentsCount)} comentarios,{' '}
				{formatNumber(subject.attachmentsCount)} anexos
			</p>
		</div>
	</div>
);

const StudentRow = ({ student, index }: { student: StudentEngagement; index: number }) => (
	<div className="flex gap-3 rounded-lg border border-slate-100 p-3">
		<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm font-semibold text-emerald-800">
			{index + 1}
		</span>
		<div className="min-w-0 flex-1">
			<p className="truncate text-sm font-medium text-slate-950">{student.name}</p>
			<p className="mt-1 truncate text-xs text-slate-500">{student.course?.name ?? 'Sem curso vinculado'}</p>
			<div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
				<span>{formatNumber(student.postsCount)} posts</span>
				<span>{formatNumber(student.commentsCount)} comentarios</span>
				<span>{formatNumber(student.receivedVotesCount)} votos recebidos</span>
				<span>{formatNumber(student.hype)} hype</span>
			</div>
		</div>
	</div>
);

const AdminDashboardPage = () => {
	const { accessToken } = useAuth();
	const [searchParams, setSearchParams] = useSearchParams();
	const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);

	const periodDays = useMemo(() => parsePeriod(searchParams.get('periodDays')), [searchParams]);
	const courseId = searchParams.get('courseId') ?? '';

	const loadDashboard = useCallback(async () => {
		if (!accessToken) {
			return;
		}

		setIsLoading(true);
		setHasError(false);

		try {
			const response = await fetchAdminDashboard({ periodDays, courseId: courseId || undefined }, accessToken);
			setDashboard(response);
		} catch {
			setHasError(true);
		} finally {
			setIsLoading(false);
		}
	}, [accessToken, courseId, periodDays]);

	useEffect(() => {
		void loadDashboard();
	}, [loadDashboard]);

	const updateFilter = (key: 'periodDays' | 'courseId', value: string) => {
		const nextParams = new URLSearchParams(searchParams);

		if (value) {
			nextParams.set(key, value);
		} else {
			nextParams.delete(key);
		}

		setSearchParams(nextParams, { replace: true });
	};

	return (
		<section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<p className="text-sm font-medium text-slate-500">Administracao</p>
					<h1 className="text-2xl font-semibold text-slate-950">Dashboard da plataforma</h1>
					<p className="mt-1 text-sm text-slate-600">Acompanhe uso, conteudo e engajamento academico.</p>
				</div>

				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					<select
						value={String(periodDays)}
						onChange={(event) => updateFilter('periodDays', event.target.value)}
						className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/10"
					>
						{periodOptions.map((period) => (
							<option key={period} value={period}>
								Ultimos {period} dias
							</option>
						))}
					</select>
					<select
						value={courseId}
						onChange={(event) => updateFilter('courseId', event.target.value)}
						className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/10"
					>
						<option value="">Todos os cursos</option>
						{dashboard?.filters.courses.map((course) => (
							<option key={course.id} value={course.id}>
								{course.name}
							</option>
						))}
					</select>
					<Button type="button" variant="outline" onClick={() => void loadDashboard()} disabled={isLoading}>
						Atualizar
					</Button>
				</div>
			</div>

			{isLoading ? (
				<div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Carregando dashboard...</div>
			) : null}

			{hasError && !isLoading ? (
				<div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
					Nao foi possivel carregar o dashboard.
				</div>
			) : null}

			{dashboard && !isLoading ? (
				<>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
						<MetricCard label="Alunos" value={dashboard.summary.students} icon={Users} />
						<MetricCard label="Cursos ativos" value={dashboard.summary.activeCourses} icon={GraduationCap} />
						<MetricCard label="Disciplinas" value={dashboard.summary.activeSubjects} icon={BookOpen} />
						<MetricCard label="Posts" value={dashboard.summary.posts} icon={FileText} />
						<MetricCard label="Comentarios" value={dashboard.summary.comments} icon={MessageSquare} />
						<MetricCard label="Votos" value={dashboard.summary.votes} icon={ThumbsUp} />
						<MetricCard label="Arquivos" value={dashboard.summary.files} icon={Paperclip} />
					</div>

					<section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
						<div className="flex items-center gap-2">
							<Activity className="size-4 text-red-700" />
							<h2 className="text-base font-semibold text-slate-950">Atividade recente</h2>
						</div>
						<div className="mt-4 grid gap-3 md:grid-cols-3">
							{dashboard.recentActivity.map((item) => (
								<div key={item.days} className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
									<p className="text-sm font-medium text-slate-700">Ultimos {item.days} dias</p>
									<div className="mt-3 grid grid-cols-2 gap-2 text-sm">
										<span className="text-slate-500">Posts</span>
										<strong className="text-right text-slate-950">{formatNumber(item.posts)}</strong>
										<span className="text-slate-500">Comentarios</span>
										<strong className="text-right text-slate-950">{formatNumber(item.comments)}</strong>
										<span className="text-slate-500">Votos</span>
										<strong className="text-right text-slate-950">{formatNumber(item.votes)}</strong>
										<span className="text-slate-500">Uploads</span>
										<strong className="text-right text-slate-950">{formatNumber(item.uploads)}</strong>
									</div>
								</div>
							))}
						</div>
					</section>

					<div className="grid gap-6 xl:grid-cols-2">
						<RankingShell title="Materiais mais relevantes">
							{dashboard.relevantPosts.length ? (
								dashboard.relevantPosts.map((post, index) => <RelevantPostRow key={post.id} post={post} index={index} />)
							) : (
								<EmptyState text="Nenhum material com engajamento encontrado." />
							)}
						</RankingShell>

						<RankingShell title="Cursos em alta">
							{dashboard.trendingCourses.length ? (
								dashboard.trendingCourses.map((course, index) => <CourseRow key={course.id} course={course} index={index} />)
							) : (
								<EmptyState text="Nenhum curso com atividade no periodo." />
							)}
						</RankingShell>
					</div>

					<div className="grid gap-6 xl:grid-cols-2">
						<RankingShell title="Disciplinas mais movimentadas">
							{dashboard.activeSubjects.length ? (
								dashboard.activeSubjects.map((subject, index) => (
									<SubjectRow key={subject.id} subject={subject} index={index} />
								))
							) : (
								<EmptyState text="Nenhuma disciplina com atividade no periodo." />
							)}
						</RankingShell>

						<RankingShell title="Engajamento dos estudantes">
							<div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
								<Trophy className="size-3.5" />
								<span>Ranking por posts, comentarios, votos recebidos e hype.</span>
							</div>
							{dashboard.studentEngagement.length ? (
								dashboard.studentEngagement.map((student, index) => (
									<StudentRow key={student.id} student={student} index={index} />
								))
							) : (
								<EmptyState text="Nenhum estudante com atividade no filtro atual." />
							)}
						</RankingShell>
					</div>
				</>
			) : null}
		</section>
	);
};

export { AdminDashboardPage };
