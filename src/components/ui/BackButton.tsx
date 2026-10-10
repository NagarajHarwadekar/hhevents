import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

export interface BackButtonProps {
  label?: string;
  fallback?: string;
  variant?: 'light' | 'dark' | 'glass';
  className?: string;
  ariaLabel?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  label = 'Back',
  fallback,
  variant = 'light',
  className = '',
  ariaLabel,
}) => {
  const { goBack } = useNavigation();

  const baseStyles =
    'group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer select-none active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#C88D23]/40';

  const variantStyles = {
    light:
      'bg-white hover:bg-[#FAF4EA] text-[#161210] hover:text-[#9A6611] border border-[#E0DCD7] hover:border-[#DFAB4C] shadow-xs',
    dark:
      'bg-[#161210] hover:bg-[#2C2420] text-white border border-[#3A322C] shadow-xs',
    glass:
      'bg-white/80 hover:bg-white text-[#161210] border border-[#E0DCD7] backdrop-blur-md shadow-xs',
  };

  return (
    <button
      type="button"
      onClick={() => goBack(fallback)}
      aria-label={ariaLabel || `Navigate back (${label})`}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      <ArrowLeft className="w-3.5 h-3.5 text-[#C88D23] group-hover:-translate-x-1 transition-transform duration-200 shrink-0" />
      <span>{label}</span>
    </button>
  );
};
