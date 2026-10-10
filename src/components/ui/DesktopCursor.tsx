import React, { useState, useEffect } from 'react';

export const DesktopCursor: React.FC = () => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isPointerDevice, setIsPointerDevice] = useState(false);

  useEffect(() => {
    // Only enable on devices with fine pointer (mouse/trackpad), never on touch screens
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!hasFinePointer) return;

    setIsPointerDevice(true);

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!isPointerDevice || !position) return null;

  return (
    <div
      className="fixed pointer-events-none z-30 transition-transform duration-100 ease-out -translate-x-1/2 -translate-y-1/2 will-change-transform"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      aria-hidden="true"
    >
      <div className="w-80 h-80 rounded-full bg-radial from-amber-500/10 via-amber-500/3 to-transparent blur-2xl" />
    </div>
  );
};
