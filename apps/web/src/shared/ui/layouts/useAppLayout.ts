import { useLocation, useNavigate, useRouteContext, useRouterState } from '@tanstack/react-router';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authClient } from '@/shared/api';
import { useBreadcrumbLabels } from '@/shared/lib/useBreadcrumbStore';
import { useLocalStorage } from '@/shared/lib/useLocalStorage';

export type Breadcrumb = {
  label: string;
  path: string;
  loading?: boolean;
};

export function useAppLayout() {
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

  const handleDragStart = useCallback(
    (e: ReactMouseEvent) => {
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

  const resolvedPathname = useRouterState({
    select: (s) => s.resolvedLocation?.pathname ?? location.pathname,
  });

  const dynamicLabels = useBreadcrumbLabels();
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const breadcrumbs = useMemo<Breadcrumb[]>(() => {
    const segmentLabels: Record<string, string> = {
      settings: 'Settings',
      transactions: 'Transacciones',
      products: 'Productos',
      budgets: 'Budgets',
      new: 'Nueva',
      edit: 'Editar',
    };

    const hiddenSegments = new Set(['transactions']);

    const segments = resolvedPathname.split('/').filter(Boolean);
    const crumbs: Breadcrumb[] = [{ label: 'Dashboard', path: '/' }];

    let currentPath = '';
    for (const segment of segments) {
      currentPath += `/${segment}`;

      if (hiddenSegments.has(segment)) continue;

      const staticLabel = segmentLabels[segment];
      const dynamicLabel = dynamicLabels[segment];
      const isUuid = UUID_RE.test(segment);

      if (staticLabel) {
        crumbs.push({ label: staticLabel, path: currentPath });
      } else if (dynamicLabel) {
        crumbs.push({ label: dynamicLabel, path: currentPath });
      } else if (isUuid) {
        crumbs.push({ label: '', path: currentPath, loading: true });
      } else {
        crumbs.push({ label: segment, path: currentPath });
      }
    }

    return crumbs;
  }, [resolvedPathname, dynamicLabels]);

  return {
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
    setAssistantOpen,
    toggleSidebar,
    toggleAssistant,
    handleLogout,
    handleDragStart,
  };
}
