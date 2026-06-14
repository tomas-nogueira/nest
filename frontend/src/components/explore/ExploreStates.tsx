import { AlertCircle, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { Skeleton } from '../ui/skeleton';

type ExploreEmptyStateProps = {
	title: string;
	description: string;
	action?: ReactNode;
};

const ExploreEmptyState = ({ title, description, action }: ExploreEmptyStateProps) => {
	return (
		<div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
			<span className="mx-auto flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
				<Search className="size-5" />
			</span>
			<h3 className="mt-3 text-sm font-semibold text-slate-950">{title}</h3>
			<p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
			{action ? <div className="mt-4">{action}</div> : null}
		</div>
	);
};

const ExploreErrorState = ({ onRetry }: { onRetry(): void }) => {
	return (
		<div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">
			<div className="flex items-start gap-3">
				<AlertCircle className="mt-0.5 size-5 shrink-0" />
				<div>
					<p className="font-semibold">Não foi possível carregar o Explorar.</p>
					<button type="button" className="mt-2 font-medium underline-offset-4 hover:underline" onClick={onRetry}>
						Tentar novamente
					</button>
				</div>
			</div>
		</div>
	);
};

const ExplorePostSkeleton = () => {
	return (
		<div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
			<div className="flex items-center gap-3">
				<Skeleton className="size-9 rounded-full" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-4 w-40" />
					<Skeleton className="h-3 w-24" />
				</div>
			</div>
			<div className="mt-5 space-y-3">
				<Skeleton className="h-6 w-4/5" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-2/3" />
			</div>
		</div>
	);
};

const ExploreLoadingState = () => {
	return (
		<div className="space-y-4" aria-label="Carregando tendências">
			<ExplorePostSkeleton />
			<ExplorePostSkeleton />
		</div>
	);
};

export { ExploreEmptyState, ExploreErrorState, ExploreLoadingState };
