import { useState, useRef, useEffect } from 'react';

export default function LazySection({ id, title, icon, children }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: '200px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id={`section-${id}`} ref={ref} className="py-6 px-4 min-h-[200px]">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
      </div>
      {isVisible ? (
        children
      ) : (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-[var(--surface-hover)] animate-pulse"
            />
          ))}
        </div>
      )}
    </section>
  );
}

