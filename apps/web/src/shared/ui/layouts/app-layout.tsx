import { RiCloseLine, RiLogoutBoxRLine, RiSettingsLine } from '@remixicon/react';
import { Link, useLocation, useNavigate, useRouteContext } from '@tanstack/react-router';
import { useState } from 'react';
import { authClient } from '@/shared/api';
import { navItems } from './nav-items';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useRouteContext({ from: '/_app' });
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);

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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop sidebar — collapsed by default, expands on hover */}
      <aside className="hidden md:flex w-14 hover:w-56 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 group/sidebar overflow-hidden">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            R
          </div>
          <span className="text-base font-bold text-sidebar-foreground whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
            Rumbo
          </span>
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
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:left-0 before:top-1/2 before:h-5 before:-translate-y-1/2 before:w-0.5 before:rounded-full before:bg-sidebar-primary'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Settings + User area */}
        <div className="border-t border-sidebar-border p-2">
          <Link
            to="/settings"
            className={`relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
              location.pathname === '/settings' || location.pathname.startsWith('/settings/')
                ? 'bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:left-0 before:top-1/2 before:h-5 before:-translate-y-1/2 before:w-0.5 before:rounded-full before:bg-sidebar-primary'
                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            }`}
          >
            <RiSettingsLine className="h-5 w-5 shrink-0" />
            <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
              Settings
            </span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="cursor-pointer relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground w-full"
          >
            <RiLogoutBoxRLine className="h-5 w-5 shrink-0" />
            <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
              Log out
            </span>
          </button>
          <div className="mt-1 flex items-center gap-3 rounded-md px-2.5 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-accent-foreground">
              {initials}
            </div>
            <div className="flex flex-col whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
              <span className="text-sm font-medium text-sidebar-foreground">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header — logo centered, avatar on right */}
        <header className="flex md:hidden h-14 items-center border-b border-border bg-background px-4">
          {/* Avatar button */}
          <button
            type="button"
            onClick={() => setUserDrawerOpen(true)}
            className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
          >
            {initials}
          </button>

          {/* Centered logo */}
          <div className="flex flex-1 items-center justify-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              R
            </div>
            <span className="text-base font-bold">Rumbo</span>
          </div>

          {/* Spacer for centering */}
          <div className="w-9" />
        </header>

        {/* Mobile user drawer overlay */}
        {userDrawerOpen && (
          <>
            <button
              type="button"
              className="cursor-pointer fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setUserDrawerOpen(false)}
              aria-label="Close drawer"
            />
            <div className="fixed top-0 left-0 z-50 h-full w-72 border-r border-border bg-background shadow-lg md:hidden">
              {/* Drawer header */}
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

              {/* User info */}
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

              {/* Settings items */}
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
