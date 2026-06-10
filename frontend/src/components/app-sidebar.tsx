import { useMemo, useState, type ComponentProps } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Book } from 'lucide-react';
import { MessagesSquare } from 'lucide-react';
import { ChevronUp, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
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
    title: 'Matérias',
    url: '/subjects',
    icon: Book,
  },
];

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || 'U';
};

const AppSidebar = ({ ...props }: ComponentProps<typeof Sidebar>) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const userInitials = useMemo(() => getInitials(user?.name ?? 'Usuário'), [user?.name]);

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
                    variant="ghost"
                    size="default"
                    className="h-9 justify-start gap-2 rounded-md bg-transparent px-2 shadow-none hover:bg-red-500/5 hover:text-red-700 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:!mx-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0"
                >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-[11px] font-semibold text-red-700 group-data-[collapsible=icon]:size-7">
                    {userInitials}
                  </div>
                  <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate text-sm font-medium text-sidebar-foreground">{user?.name ?? 'Usuário logado'}</span>
                  </div>
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
