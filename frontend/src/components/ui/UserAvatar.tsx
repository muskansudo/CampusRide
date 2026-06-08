interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  ring?: boolean;
}

const sizes = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export function UserAvatar({ name, size = 'md', ring }: UserAvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className={[
        'flex shrink-0 items-center justify-center rounded-full bg-primary-fixed/40 font-semibold text-primary',
        sizes[size],
        ring ? 'ring-2 ring-primary-container/40 ring-offset-2 ring-offset-transparent' : 'border border-white/40',
      ].join(' ')}
    >
      {initial}
    </div>
  );
}
