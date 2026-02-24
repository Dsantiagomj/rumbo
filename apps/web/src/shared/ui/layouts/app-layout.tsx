import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiLogoutBoxRLine,
  RiSettingsLine,
  RiSideBarLine,
  RiSparklingLine,
} from '@remixicon/react';
import {
  Link,
  useLocation,
  useNavigate,
  useRouteContext,
  useRouterState,
} from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { authClient } from '@/shared/api';
import { useBreadcrumbLabels } from '@/shared/lib/useBreadcrumbStore';
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
  const [assistantOpen, setAssistantOpen] = useLocalStorage('assistant-open', false);
  const [assistantWidth, setAssistantWidth] = useLocalStorage('assistant-width', 384);
  const [mobileAssistantOpen, setMobileAssistantOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startWidth: 0 });

  const toggleSidebar = useCallback(() => setCollapsed((prev) => !prev), [setCollapsed]);
  const toggleAssistant = useCallback(() => setAssistantOpen((prev) => !prev), [setAssistantOpen]);

  const isMac = useMemo(
    () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent),
    [],
  );
  const modKey = isMac ? '\u2318' : 'Ctrl+';

  // Keyboard shortcuts: ⌘B (sidebar), ⌘I (assistant), ESC (close assistant)
  useEffect(() => {
    if (assistantWidth < 280) {
      setAssistantWidth(280);
    } else if (assistantWidth > 600) {
      setAssistantWidth(600);
    }
  }, [assistantWidth, setAssistantWidth]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        !!target &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT');
      if (isEditable) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      if (mod && e.key === 'i') {
        e.preventDefault();
        toggleAssistant();
      }
      if (e.key === 'Escape' && assistantOpen) {
        setAssistantOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggleSidebar, toggleAssistant, assistantOpen, setAssistantOpen]);

  // Assistant panel resize drag
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = { startX: e.clientX, startWidth: assistantWidth };
      setIsDragging(true);
    },
    [assistantWidth],
  );

  useEffect(() => {
    if (!isDragging) return;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      const delta = dragRef.current.startX - e.clientX;
      const newWidth = Math.max(280, Math.min(600, dragRef.current.startWidth + delta));
      setAssistantWidth(newWidth);
    };
    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setAssistantWidth]);

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

  // Use resolvedLocation for breadcrumbs to prevent flash during cross-layout transitions.
  // resolvedLocation only updates after navigation completes, keeping the old breadcrumb
  // visible while the view transition animates to the new layout.
  const resolvedPathname = useRouterState({
    select: (s) => s.resolvedLocation?.pathname ?? location.pathname,
  });

  const dynamicLabels = useBreadcrumbLabels();

  const breadcrumbs = useMemo(() => {
    const segmentLabels: Record<string, string> = {
      settings: 'Settings',
      transactions: 'Transacciones',
      products: 'Productos',
      budgets: 'Budgets',
      new: 'Nueva',
      edit: 'Editar',
    };

    const segments = resolvedPathname.split('/').filter(Boolean);
    const crumbs: { label: string; path: string }[] = [{ label: 'Dashboard', path: '/' }];

    let currentPath = '';
    for (const segment of segments) {
      currentPath += `/${segment}`;
      const label = segmentLabels[segment] ?? dynamicLabels[segment] ?? segment;
      crumbs.push({ label, path: currentPath });
    }

    return crumbs;
  }, [resolvedPathname, dynamicLabels]);

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
        <div className="flex h-14 items-center gap-2 px-3.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            R
          </div>
          <span
            className={`flex-1 text-base font-bold text-foreground whitespace-nowrap transition-opacity duration-200 ${
              collapsed ? 'opacity-0' : 'opacity-100'
            }`}
          >
            Rumbo
          </span>
        </div>

        {/* Workspace context */}
        <div className="px-2 pb-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="cursor-pointer flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-sidebar-accent/50 transition-colors"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                  {initials}
                </div>
                <div
                  className={`flex flex-1 flex-col overflow-hidden transition-opacity duration-200 ${
                    collapsed ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <span className="text-[10px] font-medium uppercase tracking-wide text-sidebar-foreground/40">
                    Space
                  </span>
                  <span className="text-sm font-semibold text-sidebar-foreground/80 truncate">
                    Personal
                  </span>
                </div>
                <RiArrowDownSLine
                  className={`h-4 w-4 shrink-0 text-sidebar-foreground/40 transition-opacity duration-200 ${
                    collapsed ? 'opacity-0' : 'opacity-100'
                  }`}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="bottom" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Spaces
              </DropdownMenuLabel>
              <DropdownMenuItem className="gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Personal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="gap-2 text-xs text-muted-foreground">
                <span className="text-base leading-none">+</span>
                Create space
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                <span
                  className={`whitespace-nowrap transition-opacity duration-200 ${
                    collapsed ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Settings */}
        <div className="p-2">
          <Link
            to="/settings"
            viewTransition
            className={linkClass(
              location.pathname === '/settings' || location.pathname.startsWith('/settings/'),
            )}
          >
            <RiSettingsLine className="h-5 w-5 shrink-0" />
            <span
              className={`whitespace-nowrap transition-opacity duration-200 ${
                collapsed ? 'opacity-0' : 'opacity-100'
              }`}
            >
              Settings
            </span>
          </Link>
        </div>
      </aside>

      {/* Main content area — white inset panel */}
      <div className="flex flex-1 flex-col overflow-hidden md:rounded-l-2xl bg-background md:shadow-sm">
        {/* Desktop content header */}
        <header className="hidden md:flex h-12 items-center gap-3 border-b border-border/40 px-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <RiSideBarLine className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span className="flex items-center gap-2">
                  Toggle sidebar
                  <kbd className="rounded bg-background/20 px-1.5 py-0.5 font-mono text-[10px]">
                    {modKey}B
                  </kbd>
                </span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleAssistant}
                  className={`cursor-pointer flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                    assistantOpen
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                  aria-label={assistantOpen ? 'Close assistant' : 'Open assistant'}
                >
                  <RiSparklingLine className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span className="flex items-center gap-2">
                  AI Assistant
                  <kbd className="rounded bg-background/20 px-1.5 py-0.5 font-mono text-[10px]">
                    {modKey}I
                  </kbd>
                </span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
          <button
            type="button"
            onClick={() => setMobileAssistantOpen(true)}
            className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            aria-label="Open assistant"
          >
            <RiSparklingLine className="h-5 w-5" />
          </button>
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

        {/* Mobile assistant sheet */}
        {mobileAssistantOpen && (
          <>
            <button
              type="button"
              className="cursor-pointer fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setMobileAssistantOpen(false)}
              aria-label="Close assistant"
            />
            <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <div className="flex items-center gap-2">
                  <RiSparklingLine className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-semibold">AI Assistant</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileAssistantOpen(false)}
                  className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-accent"
                >
                  <RiCloseLine className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                  <RiSparklingLine className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Coming soon</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Your AI financial assistant will help you analyze spending, categorize
                  transactions, and manage budgets.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Content row: main content + assistant panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">{children}</main>

          {/* Resizable divider */}
          {assistantOpen && (
            // biome-ignore lint/a11y/useSemanticElements: vertical resize handle, not a horizontal rule
            <div
              className="hidden md:flex items-center w-0 relative cursor-col-resize group"
              onMouseDown={handleDragStart}
              role="separator"
              aria-orientation="vertical"
              aria-valuenow={assistantWidth}
              aria-valuemin={280}
              aria-valuemax={600}
              tabIndex={0}
            >
              <div
                className={`absolute inset-y-0 -left-[3px] w-[6px] flex items-center justify-center ${
                  isDragging ? 'z-10' : ''
                }`}
              >
                <div
                  className={`w-px h-full transition-colors duration-150 ${
                    isDragging
                      ? 'bg-gradient-to-b from-transparent via-primary to-transparent'
                      : 'bg-gradient-to-b from-transparent via-border/60 to-transparent group-hover:via-primary/60'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Desktop assistant panel */}
          <aside
            className={`hidden md:flex flex-col overflow-hidden ${
              assistantOpen ? '' : 'w-0'
            } ${isDragging ? '' : 'transition-[width] duration-200'}`}
            style={assistantOpen ? { width: assistantWidth } : undefined}
          >
            <div
              className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
              style={{ minWidth: assistantWidth }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <RiSparklingLine className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Coming soon</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Your AI financial assistant will help you analyze spending, categorize transactions,
                and manage budgets.
              </p>
            </div>
          </aside>
        </div>

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
