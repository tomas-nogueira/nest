import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Hash } from 'lucide-react';
import type { ReactNode } from 'react';
import type { RecentTheme, TrendingCourse } from '../../services/exploreService';

type TrendSectionProps = {
	title: string;
	description: string;
	children: ReactNode;
};

const TrendSection = ({ title, description, children }: TrendSectionProps) => {
	return (
		<section className="rounded-lg border border-slate-200 bg-white shadow-sm">
			<div className="border-b border-slate-100 px-4 py-3">
				<h2 className="text-base font-semibold text-slate-950">{title}</h2>
				<p className="mt-1 text-sm text-slate-500">{description}</p>
			</div>
			<div className="divide-y divide-slate-100">{children}</div>
		</section>
	);
};

const TrendingCourseCard = ({ course }: { course: TrendingCourse }) => {
	return (
		<Link
			to={course.url}
			className="group flex items-start gap-3 px-4 py-3 transition hover:bg-red-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500/30"
		>
			<span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-800">
				<BookOpen className="size-4" />
			</span>
			<span className="min-w-0 flex-1">
				<span className="flex items-center gap-2">
					<span className="truncate text-sm font-semibold text-slate-950 group-hover:text-red-700">{course.name}</span>
					<ArrowUpRight className="size-3.5 shrink-0 text-slate-400 group-hover:text-red-700" />
				</span>
				<span className="mt-1 block text-xs leading-5 text-slate-500">
					{course.recentPostsCount} posts recentes - {course.interactionsCount} interações
				</span>
			</span>
		</Link>
	);
};

const RecentThemeCard = ({ theme }: { theme: RecentTheme }) => {
	return (
		<Link
			to={theme.url}
			className="group flex items-center gap-3 px-4 py-3 transition hover:bg-red-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500/30"
		>
			<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
				<Hash className="size-4" />
			</span>
			<span className="min-w-0 flex-1">
				<span className="block truncate text-sm font-semibold text-slate-950 group-hover:text-red-700">{theme.label}</span>
				<span className="text-xs text-slate-500">
					{theme.count} post{theme.count === 1 ? '' : 's'} recente{theme.count === 1 ? '' : 's'}
				</span>
			</span>
		</Link>
	);
};

export { RecentThemeCard, TrendingCourseCard, TrendSection };
