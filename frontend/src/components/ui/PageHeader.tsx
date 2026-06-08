import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h2 className="font-display text-3xl text-on-surface">{title}</h2>
        {subtitle && <p className="mt-1 text-base text-on-surface-variant">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
