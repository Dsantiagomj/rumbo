import { RiComputerLine, RiMoonClearLine, RiSunLine } from '@remixicon/react';
import { createFileRoute } from '@tanstack/react-router';
import { useTheme } from '@/shared/lib/useTheme';

export const Route = createFileRoute('/_settings/settings/preferences')({
  component: PreferencesPage,
});

const themeOptions = [
  {
    value: 'light' as const,
    label: 'Light',
    icon: RiSunLine,
  },
  {
    value: 'dark' as const,
    label: 'Dark',
    icon: RiMoonClearLine,
  },
  {
    value: 'system' as const,
    label: 'System',
    icon: RiComputerLine,
  },
];

function PreferencesPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <h1 className="text-lg font-semibold">Preferences</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Customize the look and feel of the application.
      </p>

      <div className="mt-8 space-y-6">
        {/* Theme */}
        <div>
          <h2 className="text-sm font-medium">Theme</h2>
          <p className="mt-1 text-sm text-muted-foreground">Select your preferred color scheme.</p>
          <div className="mt-3 flex gap-3">
            {themeOptions.map((option) => {
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`cursor-pointer flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                    isActive
                      ? 'border-primary bg-accent/50'
                      : 'border-border hover:border-primary/30 hover:bg-accent/30'
                  }`}
                >
                  <option.icon
                    className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <span
                    className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
