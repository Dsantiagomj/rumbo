import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Branding panel -- hidden on mobile/tablet */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center bg-primary p-12 text-primary-foreground">
        <div className="mx-auto max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground text-primary text-lg font-bold">
              R
            </div>
            <span className="text-2xl font-bold">Rumbo</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight">
            Take control of your personal finances
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Track expenses, manage budgets, and grow your savings — all in one place.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-6 sm:p-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            R
          </div>
          <span className="text-xl font-bold">Rumbo</span>
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
