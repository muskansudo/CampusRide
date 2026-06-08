import { useEffect, useRef } from 'react';

export function DreamscapeBackground() {
  const peachRef = useRef<HTMLDivElement>(null);
  const lavenderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const scroll = window.scrollY;
      if (peachRef.current) {
        peachRef.current.style.transform = `translateY(${scroll * 0.08}px)`;
      }
      if (lavenderRef.current) {
        lavenderRef.current.style.transform = `translateY(${scroll * -0.04}px)`;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div ref={peachRef} className="aurora-peach absolute inset-0" />
      <div ref={lavenderRef} className="aurora-lavender absolute inset-0" />
    </div>
  );
}
