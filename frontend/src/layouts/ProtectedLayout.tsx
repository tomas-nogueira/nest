import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../components/ui/sidebar';

const ProtectedLayout = () => {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className="bg-red-50/20 md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none">
				<header className="flex h-16 items-center gap-3 border-b border-red-500/10 bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75">
					<SidebarTrigger />
					<div aria-hidden="true" className="h-5 w-px bg-red-500/10" />
					<div className="flex flex-col">
						<span className="text-sm font-medium text-foreground">Posts</span>
						<span className="text-xs text-muted-foreground">Materiais academicos</span>
					</div>
				</header>
				<main className="flex-1 p-4 sm:p-6 lg:p-8">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
};

export { ProtectedLayout };
