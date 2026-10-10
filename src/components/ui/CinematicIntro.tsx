import React, { useEffect } from 'react';

interface CinematicIntroProps {
  onComplete?: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  useEffect(() => {
    if (onComplete) onComplete();
  }, [onComplete]);

  return null;
};
