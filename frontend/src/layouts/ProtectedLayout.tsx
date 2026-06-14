import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../components/app-sidebar';
import { GlobalSearch } from '../components/GlobalSearch';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../components/ui/sidebar';

const ProtectedLayout = () => {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className="bg-red-50/20 md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none">
				<header className="relative z-50 grid min-h-16 grid-cols-[auto_1fr] items-center gap-3 border-b border-red-500/10 bg-background/85 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:grid-cols-[1fr_minmax(16rem,36rem)_1fr]">
					<div className="flex min-w-0 items-center gap-3">
						<SidebarTrigger />
						<div aria-hidden="true" className="h-5 w-px bg-red-500/10" />
						<div className="hidden flex-col lg:flex">
							<span className="text-sm font-medium text-foreground">Posts</span>
							<span className="text-xs text-muted-foreground">Materiais academicos</span>
						</div>
					</div>
					<div className="col-span-2 row-start-2 w-full sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:justify-self-center">
						<GlobalSearch />
					</div>
					<div aria-hidden="true" className="hidden sm:block" />
				</header>
				<main className="flex-1 p-4 sm:p-6 lg:p-8">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
};

export { ProtectedLayout };
