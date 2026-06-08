import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  variant?: 'glass' | 'auth';
}

const inputVariants = {
  glass:
    'h-14 w-full rounded-full border border-glass-border bg-white/25 px-6 text-base text-on-surface outline-none backdrop-blur-sm transition placeholder:text-outline-variant focus:border-primary/40 focus:ring-2 focus:ring-primary/20',
  auth:
    'h-14 w-full rounded-full border border-white/45 bg-white/30 px-6 text-base text-on-surface shadow-sm outline-none backdrop-blur-sm transition placeholder:text-outline-variant focus:border-primary/30 focus:ring-2 focus:ring-primary/10',
};

export function Input({
  label,
  error,
  icon,
  variant = 'glass',
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className={[
            'px-1 text-sm font-medium',
            variant === 'auth' ? 'text-primary' : 'px-4 text-xs text-on-surface-variant',
          ].join(' ')}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-primary/80">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={[inputVariants[variant], icon ? 'pl-12' : '', className].join(' ')}
          {...props}
        />
      </div>
      {error && <p className="px-1 text-xs text-error">{error}</p>}
    </div>
  );
}
