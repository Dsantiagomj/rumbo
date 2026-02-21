import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme, animate = false) {
  const root = document.documentElement;
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  const apply = () => root.classList.toggle('dark', resolved === 'dark');

  if (animate && document.startViewTransition) {
    root.classList.add('theme-transition');
    const transition = document.startViewTransition(() => apply());
    transition.finished.finally(() => {
      root.classList.remove('theme-transition');
    });
  } else {
    apply();
  }
}

function readStoredTheme(): Theme {
  try {
    const raw = localStorage.getItem('theme');
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    /* noop */
  }
  return 'system';
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    localStorage.setItem('theme', next);
    applyTheme(next, true);
  }, []);

  // Apply on mount + listen for system preference changes
  useEffect(() => {
    applyTheme(theme);

    if (theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system', true);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const resolved: 'light' | 'dark' = theme === 'system' ? getSystemTheme() : theme;

  return { theme, resolved, setTheme, toggle } as const;
}
