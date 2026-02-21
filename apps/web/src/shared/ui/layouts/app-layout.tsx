import {
  RiArrowRightSLine,
  RiCloseLine,
  RiLogoutBoxRLine,
  RiNotification3Line,
  RiSettingsLine,
  RiSideBarLine,
  RiUserLine,
} from '@remixicon/react';
import { Link, useLocation, useNavigate, useRouteContext } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/shared/api';
import { useLocalStorage } from '@/shared/lib/useLocalStorage';
import { navItems } from './nav-items';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useRouteContext({ from: '/_app' });
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useLocalStorage('sidebar-collapsed', false);

  const toggleSidebar = useCallback(() => setCollapsed((prev) => !prev), [setCollapsed]);

  const initials = user.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : (user.email[0] ?? '?').toUpperCase();

  const handleLogout = async () => {
    await authClient.signOut();
    await navigate({ to: '/login' });
  };

  const breadcrumbs = useMemo(() => {
    const segmentLabels: Record<string, string> = {
      settings: 'Settings',
      transactions: 'Transactions',
      products: 'Products',
      new: 'New',
      edit: 'Edit',
    };

    const segments = location.pathname.split('/').filter(Boolean);
    const crumbs: { label: string; path: string }[] = [{ label: 'Home', path: '/' }];

    let currentPath = '';
    for (const segment of segments) {
      currentPath += `/${segment}`;
      const label = segmentLabels[segment] ?? segment;
      crumbs.push({ label, path: currentPath });
    }

    return crumbs;
  }, [location.pathname]);

  const linkClass = (active: boolean) =>
    `relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
      active
        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
    }`;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted">
      {/* Desktop sidebar — gray bg, no border */}
      <aside
        className={`hidden md:flex flex-col bg-muted transition-[width] duration-200 overflow-hidden ${
          collapsed ? 'w-14' : 'w-56'
        }`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-center gap-2 px-3.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            R
          </div>
          {!collapsed && (
            <span className="flex-1 text-base font-bold text-foreground whitespace-nowrap animate-in fade-in duration-200">
              Rumbo
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link key={item.path} to={item.path} className={linkClass(isActive)}>
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <span className="whitespace-nowrap animate-in fade-in duration-200">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Settings */}
        <div className="p-2">
          <Link
            to="/settings"
            className={linkClass(
              location.pathname === '/settings' || location.pathname.startsWith('/settings/'),
            )}
          >
            <RiSettingsLine className="h-5 w-5 shrink-0" />
            {!collapsed && (
              <span className="whitespace-nowrap animate-in fade-in duration-200">Settings</span>
            )}
          </Link>
        </div>
      </aside>

      {/* Main content area — white inset panel */}
      <div className="flex flex-1 flex-col overflow-hidden md:rounded-l-2xl bg-background md:shadow-sm">
        {/* Desktop content header */}
        <header className="hidden md:flex h-12 items-center gap-3 border-b border-border/40 px-4">
          <button
            type="button"
            onClick={toggleSidebar}
            className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <RiSideBarLine className="h-[18px] w-[18px]" />
          </button>

          {/* Breadcrumbs */}
          <nav className="flex flex-1 items-center gap-1 min-w-0" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={crumb.path} className="flex items-center gap-1 min-w-0">
                  {i > 0 && (
                    <RiArrowRightSLine className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  )}
                  {isLast ? (
                    <span className="text-sm font-semibold text-foreground truncate">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      to={crumb.path}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/40 cursor-not-allowed"
              aria-label="Notifications"
              title="Notifications (coming soon)"
            >
              <RiNotification3Line className="h-[18px] w-[18px]" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground hover:ring-2 hover:ring-accent-foreground/20 transition-all"
                >
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <RiUserLine className="mr-2 h-4 w-4" />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <RiLogoutBoxRLine className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile header */}
        <header className="flex md:hidden h-14 items-center border-b border-border bg-background px-4">
          <button
            type="button"
            onClick={() => setUserDrawerOpen(true)}
            className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
          >
            {initials}
          </button>
          <div className="flex flex-1 items-center justify-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              R
            </div>
            <span className="text-base font-bold">Rumbo</span>
          </div>
          <div className="w-9" />
        </header>

        {/* Mobile user drawer */}
        {userDrawerOpen && (
          <>
            <button
              type="button"
              className="cursor-pointer fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setUserDrawerOpen(false)}
              aria-label="Close drawer"
            />
            <div className="fixed top-0 left-0 z-50 h-full w-72 border-r border-border bg-background shadow-lg md:hidden">
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <span className="text-sm font-semibold">Account</span>
                <button
                  type="button"
                  onClick={() => setUserDrawerOpen(false)}
                  className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-accent"
                >
                  <RiCloseLine className="h-5 w-5" />
                </button>
              </div>
              <div className="border-b border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                    {initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
              </div>
              <nav className="flex flex-col gap-0.5 p-2">
                <Link
                  to="/settings"
                  onClick={() => setUserDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground/60 hover:bg-accent/50 hover:text-foreground transition-colors"
                >
                  <RiSettingsLine className="h-5 w-5 shrink-0" />
                  <span>Settings</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="cursor-pointer flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground/60 hover:bg-accent/50 hover:text-foreground transition-colors w-full"
                >
                  <RiLogoutBoxRLine className="h-5 w-5 shrink-0" />
                  <span>Log out</span>
                </button>
              </nav>
            </div>
          </>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">{children}</main>

        {/* Mobile bottom tabs */}
        <nav className="flex md:hidden items-center justify-around border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
