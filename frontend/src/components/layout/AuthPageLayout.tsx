import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { DreamscapeBackground } from './DreamscapeBackground';

interface AuthPageLayoutProps {
  children: ReactNode;
}

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <>
      <DreamscapeBackground />
      <div className="relative z-10 flex min-h-screen w-full flex-1 flex-col">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-[600px] flex-1 items-center justify-center px-6 pb-10 pt-24">
          {children}
        </main>
      </div>
    </>
  );
}
