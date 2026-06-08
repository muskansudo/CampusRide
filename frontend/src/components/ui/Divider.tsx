interface DividerProps {
  className?: string;
}

export function Divider({ className = '' }: DividerProps) {
  return <div className={['mx-5 h-px bg-white/10', className].join(' ')} />;
}
