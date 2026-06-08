import type { HTMLAttributes, ReactNode } from 'react';

type CardVariant = 'glass' | 'deep' | 'live';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  noPadding?: boolean;
  children: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  glass: 'glass-card silk-border',
  deep: 'glass-card silk-border',
  live: 'glass-live silk-border',
};

export function Card({
  variant = 'glass',
  noPadding,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'overflow-hidden rounded-3xl',
        variantClasses[variant],
        noPadding ? '' : 'p-6',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
