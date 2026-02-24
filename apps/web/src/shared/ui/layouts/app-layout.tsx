import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiLogoutBoxRLine,
  RiSettingsLine,
  RiSideBarLine,
  RiSparklingLine,
} from '@remixicon/react';
import { Link } from '@tanstack/react-router';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { navItems } from './nav-items';
import { type Breadcrumb, useAppLayout } from './useAppLayout';

interface AppLayoutProps {
  children: ReactNode;
}

const linkClass = (active: boolean) =>
  `relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
    active
      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
  }`;

type AppLayoutState = ReturnType<typeof useAppLayout>;
type AppUser = AppLayoutState['user'];

export function AppLayout({ children }: AppLayoutProps) {
  const {
    location,
    user,
    initials,
    modKey,
    breadcrumbs,
    collapsed,
    assistantOpen,
    assistantWidth,
    userDrawerOpen,
    mobileAssistantOpen,
    isDragging,
    setUserDrawerOpen,
    setMobileAssistantOpen,
    toggleSidebar,
    toggleAssistant,
    handleLogout,
    handleDragStart,
  } = useAppLayout();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted">
      <DesktopSidebar collapsed={collapsed} initials={initials} pathname={location.pathname} />

      <div className="flex flex-1 flex-col overflow-hidden md:rounded-l-2xl bg-background md:shadow-sm">
        <DesktopHeader
          collapsed={collapsed}
          assistantOpen={assistantOpen}
          breadcrumbs={breadcrumbs}
          modKey={modKey}
          onToggleSidebar={toggleSidebar}
          onToggleAssistant={toggleAssistant}
        />

        <MobileHeader
          initials={initials}
          onOpenDrawer={() => setUserDrawerOpen(true)}
          onOpenAssistant={() => setMobileAssistantOpen(true)}
        />

        <MobileDrawer
          open={userDrawerOpen}
          initials={initials}
          user={user}
          onClose={() => setUserDrawerOpen(false)}
          onLogout={handleLogout}
        />

        <MobileAssistantSheet
          open={mobileAssistantOpen}
          onClose={() => setMobileAssistantOpen(false)}
        />

        <div className="flex flex-1 overflow-hidden">
          <main
            className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6"
            style={{ viewTransitionName: 'main-content' }}
          >
            {children}
          </main>

          <AssistantPanel
            assistantOpen={assistantOpen}
            assistantWidth={assistantWidth}
            isDragging={isDragging}
            onDragStart={handleDragStart}
          />
        </div>

        <MobileTabs pathname={location.pathname} />
      </div>
    </div>
  );
}

type DesktopSidebarProps = {
  collapsed: boolean;
  initials: string;
  pathname: string;
};

function DesktopSidebar({ collapsed, initials, pathname }: DesktopSidebarProps) {
  return (
    <aside
      className={`hidden md:flex flex-col bg-muted transition-[width] duration-200 overflow-hidden ${
        collapsed ? 'w-14' : 'w-56'
      }`}
    >
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
            <DropdownMenuLabel className="text-xs text-muted-foreground">Spaces</DropdownMenuLabel>
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

      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {navItems.map((item) => {
          const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
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

      <div className="p-2">
        <Link
          to="/settings"
          viewTransition
          className={linkClass(pathname === '/settings' || pathname.startsWith('/settings/'))}
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
  );
}

type DesktopHeaderProps = {
  collapsed: boolean;
  assistantOpen: boolean;
  breadcrumbs: Breadcrumb[];
  modKey: string;
  onToggleSidebar: () => void;
  onToggleAssistant: () => void;
};

function DesktopHeader({
  collapsed,
  assistantOpen,
  breadcrumbs,
  modKey,
  onToggleSidebar,
  onToggleAssistant,
}: DesktopHeaderProps) {
  return (
    <header className="hidden md:flex h-12 items-center gap-3 border-b border-border/40 px-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggleSidebar}
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

      <nav className="flex flex-1 items-center gap-1 min-w-0" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1;
          return (
            <span key={crumb.path} className="flex items-center gap-1 min-w-0">
              {i > 0 && <RiArrowRightSLine className="h-4 w-4 shrink-0 text-muted-foreground/50" />}
              {crumb.loading ? (
                <span className="inline-block h-4 w-20 animate-pulse rounded bg-muted" />
              ) : isLast ? (
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

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggleAssistant}
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
  );
}

type MobileHeaderProps = {
  initials: string;
  onOpenDrawer: () => void;
  onOpenAssistant: () => void;
};

function MobileHeader({ initials, onOpenDrawer, onOpenAssistant }: MobileHeaderProps) {
  return (
    <header className="flex md:hidden h-14 items-center border-b border-border bg-background px-4">
      <button
        type="button"
        onClick={onOpenDrawer}
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
        onClick={onOpenAssistant}
        className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        aria-label="Open assistant"
      >
        <RiSparklingLine className="h-5 w-5" />
      </button>
    </header>
  );
}

type MobileDrawerProps = {
  open: boolean;
  initials: string;
  user: AppUser;
  onClose: () => void;
  onLogout: () => void;
};

function MobileDrawer({ open, initials, user, onClose, onLogout }: MobileDrawerProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="cursor-pointer fixed inset-0 z-40 bg-black/40 md:hidden"
        onClick={onClose}
        aria-label="Close drawer"
      />
      <div className="fixed top-0 left-0 z-50 h-full w-72 border-r border-border bg-background shadow-lg md:hidden">
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="text-sm font-semibold">Account</span>
          <button
            type="button"
            onClick={onClose}
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
            onClick={onClose}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground/60 hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            <RiSettingsLine className="h-5 w-5 shrink-0" />
            <span>Settings</span>
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="cursor-pointer flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground/60 hover:bg-accent/50 hover:text-foreground transition-colors w-full"
          >
            <RiLogoutBoxRLine className="h-5 w-5 shrink-0" />
            <span>Log out</span>
          </button>
        </nav>
      </div>
    </>
  );
}

type MobileAssistantSheetProps = {
  open: boolean;
  onClose: () => void;
};

function MobileAssistantSheet({ open, onClose }: MobileAssistantSheetProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="cursor-pointer fixed inset-0 z-40 bg-black/40 md:hidden"
        onClick={onClose}
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
            onClick={onClose}
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
            Your AI financial assistant will help you analyze spending, categorize transactions, and
            manage budgets.
          </p>
        </div>
      </div>
    </>
  );
}

type AssistantPanelProps = {
  assistantOpen: boolean;
  assistantWidth: number;
  isDragging: boolean;
  onDragStart: (event: ReactMouseEvent) => void;
};

function AssistantPanel({
  assistantOpen,
  assistantWidth,
  isDragging,
  onDragStart,
}: AssistantPanelProps) {
  return (
    <>
      {assistantOpen && (
        // biome-ignore lint/a11y/useSemanticElements: vertical resize handle, not a horizontal rule
        <div
          className="hidden md:flex items-center w-0 relative cursor-col-resize group"
          onMouseDown={onDragStart}
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
            Your AI financial assistant will help you analyze spending, categorize transactions, and
            manage budgets.
          </p>
        </div>
      </aside>
    </>
  );
}

type MobileTabsProps = {
  pathname: string;
};

function MobileTabs({ pathname }: MobileTabsProps) {
  return (
    <nav className="flex md:hidden items-center justify-around border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
      {navItems.map((item) => {
        const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
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
  );
}
