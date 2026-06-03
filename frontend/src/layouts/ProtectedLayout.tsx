import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../components/ui/sidebar';

const ProtectedLayout = () => {
  return (
	<SidebarProvider>
		<AppSidebar />
		<SidebarInset className="bg-slate-50">
			<header className="flex h-16 items-center gap-3 border-b border-border/60 bg-slate-50/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-slate-50/75">
				<SidebarTrigger />
				<div aria-hidden="true" className="h-5 w-px bg-border" />
				<div className="flex flex-col">
					<span className="text-sm font-medium text-foreground">Home</span>
					<span className="text-xs text-muted-foreground">Área disponível após login</span>
				</div>
			</header>
			<main className="flex-1 p-4 sm:p-6 lg:p-8">
				<Outlet />
			</main>
		</SidebarInset>
	</SidebarProvider>
  )
}

export { ProtectedLayout }
