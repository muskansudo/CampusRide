import type { ReactNode } from 'react';
import { DreamscapeBackground } from './DreamscapeBackground';

interface AuthPageLayoutProps {
  children: ReactNode;
}

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <>
      <DreamscapeBackground />
      <div className="relative z-10 flex min-h-screen w-full flex-1 flex-col">
        <header className="app-header fixed top-0 z-50 w-full">
          <div className="mx-auto flex w-full max-w-[600px] items-center justify-center px-6 py-5">
            <h1 className="font-display text-2xl text-primary">CampusRide</h1>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-[600px] flex-1 items-center justify-center px-6 pb-10 pt-24">
          {children}
        </main>
      </div>
    </>
  );
}
