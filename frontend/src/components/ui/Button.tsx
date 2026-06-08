import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary btn-glow hover:brightness-110',
  secondary: 'glass text-on-surface hover:bg-white/40',
  ghost: 'border border-primary bg-transparent text-primary hover:bg-primary/5',
  danger: 'border border-error/30 bg-transparent text-error hover:bg-error-container/30',
};

const sizeClasses: Record<ButtonSize, string> = {
  md: 'h-11 px-6 text-sm',
  lg: 'h-14 px-8 text-sm',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className = '',
  icon,
  ...props
}: ButtonProps) {
  return (
    <button
      type={props.type ?? 'button'}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-wide transition active:scale-[0.97] disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
