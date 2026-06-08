import type { ReactNode } from 'react';

interface BottomSheetProps {
  children: ReactNode;
  className?: string;
}

export function BottomSheet({ children, className = '' }: BottomSheetProps) {
  return (
    <div className={['bottom-sheet relative z-20 px-6 pb-28 pt-8', className].join(' ')}>
      <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-on-surface-variant/20" />
      {children}
    </div>
  );
}
