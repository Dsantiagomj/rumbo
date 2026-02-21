import type { RemixiconComponentType } from '@remixicon/react';
import {
  RiArrowLeftLine,
  RiBellLine,
  RiDatabaseLine,
  RiPaletteLine,
  RiShieldLine,
  RiUserLine,
} from '@remixicon/react';
import { Link, Outlet, useLocation } from '@tanstack/react-router';

type SettingsNavItem = {
  label: string;
  path: string;
  icon: RemixiconComponentType;
};

const settingsNavItems: SettingsNavItem[] = [
  { label: 'Account', path: '/settings', icon: RiUserLine },
  { label: 'Preferences', path: '/settings/preferences', icon: RiPaletteLine },
  { label: 'Security', path: '/settings/security', icon: RiShieldLine },
  { label: 'Notifications', path: '/settings/notifications', icon: RiBellLine },
  { label: 'Data & Privacy', path: '/settings/data', icon: RiDatabaseLine },
];

export function SettingsLayout() {
  const location = useLocation();

  const linkClass = (path: string) => {
    const isActive =
      path === '/settings' ? location.pathname === '/settings' : location.pathname.startsWith(path);

    return `flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
    }`;
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted">
      {/* Desktop settings sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-muted">
        {/* Back to app */}
        <div className="flex h-14 items-center px-3.5">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RiArrowLeftLine className="h-4 w-4" />
            Back to app
          </Link>
        </div>

        {/* Settings navigation */}
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {settingsNavItems.map((item) => (
            <Link key={item.path} to={item.path} className={linkClass(item.path)}>
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Content panel */}
      <div className="flex flex-1 flex-col overflow-hidden md:rounded-l-2xl bg-background md:shadow-sm">
        {/* Mobile header */}
        <header className="flex md:hidden h-14 items-center gap-3 border-b border-border px-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RiArrowLeftLine className="h-4 w-4" />
          </Link>
          <span className="text-base font-semibold">Settings</span>
        </header>

        {/* Mobile settings nav */}
        <nav className="flex md:hidden gap-1 overflow-x-auto border-b border-border/40 px-4 py-2">
          {settingsNavItems.map((item) => {
            const isActive =
              item.path === '/settings'
                ? location.pathname === '/settings'
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Settings content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-2xl">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
