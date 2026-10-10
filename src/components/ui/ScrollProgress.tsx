import React, { useState, useEffect } from 'react';

export const ScrollProgress: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (totalScroll <= 0) {
        setScrollProgress(0);
        return;
      }
      const currentScroll = window.scrollY;
      setScrollProgress(Math.min(100, Math.max(0, (currentScroll / totalScroll) * 100)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none transition-opacity duration-300"
      style={{ opacity: scrollProgress > 1 ? 1 : 0 }}
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.6)] transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
};
