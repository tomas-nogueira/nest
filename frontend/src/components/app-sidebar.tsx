import { type ComponentProps } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Book, ChevronUp, Compass, LogOut, Layers, MessagesSquare, UserRound } from 'lucide-react';
import { Button } from './ui/button';
import { HypeBadge } from './HypeBadge';
import { UserAvatar } from './UserAvatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarFooter,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from './ui/sidebar';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  {
    title: 'Posts',
    url: '/home',
    icon: MessagesSquare,
  },
  {
    title: 'Explorar',
    url: '/explore',
    icon: Compass,
  },
  {
    title: 'Cursos',
    url: '/courses',
    icon: Layers,
  },
  {
    title: 'Matérias',
    url: '/subjects',
    icon: Book,
  },
];

const AppSidebar = ({ ...props }: ComponentProps<typeof Sidebar>) => {
	const location = useLocation();
	const { accessToken, user, signOut } = useAuth();

	const handleLogout = () => {
		signOut();
	};

	return (
		<Sidebar variant="inset" collapsible="icon" {...props}>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navegação</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => {
								const Icon = item.icon;
								const isActive = location.pathname === item.url;

								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											asChild
											isActive={isActive}
											className="data-[active=true]:bg-red-500/10 data-[active=true]:text-red-700 data-[active=true]:shadow-[inset_0_1px_0_rgba(185,28,28,0.08)] hover:bg-red-500/5 hover:text-red-700 group-data-[collapsible=icon]:!mx-auto"
										>
											<Link to={item.url}>
												<Icon />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="border-t border-red-500/10 p-2">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									type="button"
									size="default"
									className="h-9 justify-start gap-2 rounded-md bg-transparent px-2 shadow-none hover:bg-red-500/5 hover:text-red-700 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:!mx-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0"
								>
									<UserAvatar
										name={user?.name ?? 'Usuário'}
										avatarUrl={user?.avatarUrl}
										token={accessToken}
										className="size-7 shrink-0 text-[11px] group-data-[collapsible=icon]:size-7"
									/>
									<div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
										<span className="truncate text-sm font-medium text-sidebar-foreground">
											{user?.name ?? 'Usuário logado'}
										</span>
									</div>
									{typeof user?.hype === 'number' ? (
										<HypeBadge hype={user.hype} compact iconSize={12} animateNumber={false} className="group-data-[collapsible=icon]:hidden" />
									) : null}
									<ChevronUp className="ml-auto size-3.5 text-red-700/50 group-data-[collapsible=icon]:hidden" />
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						side="top"
						align="end"
						sideOffset={12}
						className="mb-1 w-52 rounded-xl border border-red-500/10 bg-background p-1 shadow-lg shadow-red-950/5 ring-1 ring-red-500/5"
					>
						<DropdownMenuItem asChild className="cursor-pointer rounded-md px-2 py-2 text-slate-700 focus:bg-red-500/5 focus:text-red-700">
							<Link to="/profile">
								<UserRound className="size-4" />
								Perfil
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<Button
							type="button"
							variant="ghost"
							size="default"
							className="h-9 w-full justify-start gap-2 rounded-md border border-red-500/10 px-2 text-red-700 hover:bg-red-500/5 hover:text-red-700 focus-visible:border-red-500/15 focus-visible:ring-0"
							onClick={handleLogout}
						>
							<LogOut className="size-4" />
							Sair da conta
						</Button>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
};

export { AppSidebar };
