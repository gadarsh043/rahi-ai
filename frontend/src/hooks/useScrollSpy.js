import { useState, useEffect, useRef } from 'react';

export default function useScrollSpy(sectionIds, options = {}) {
  const { offset = 120 } = options;
  const [activeId, setActiveId] = useState(sectionIds[0]);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop + offset;
      for (let i = sectionIds.length - 1; i >= 0; i -= 1) {
        const el = document.getElementById(`section-${sectionIds[i]}`);
        if (el && el.offsetTop <= scrollTop) {
          setActiveId(sectionIds[i]);
          return;
        }
      }
      setActiveId(sectionIds[0]);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [sectionIds, offset]);

  const scrollToSection = (id) => {
    const el = document.getElementById(`section-${id}`);
    const container = scrollContainerRef.current;
    if (el && container) {
      container.scrollTo({
        top: el.offsetTop - offset + 1,
        behavior: 'smooth',
      });
    }
  };

  return { activeId, scrollToSection, scrollContainerRef };
}

