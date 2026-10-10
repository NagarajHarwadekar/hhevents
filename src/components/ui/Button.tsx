import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold' | 'luxury';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-xl active:scale-[0.98] cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-2 gap-1.5 min-h-[38px]',
    md: 'text-sm px-5 py-2.5 gap-2 min-h-[44px]',
    lg: 'text-base px-6 py-3.5 gap-2.5 min-h-[50px]',
  };

  const variantStyles = {
    primary:
      'bg-[#161210] text-white hover:bg-[#2C2420] active:bg-[#0A0807] focus:ring-[#C88D23]/50 shadow-sm hover:shadow-md',
    gold:
      'bg-[#C88D23] text-white hover:bg-[#B37B1B] active:bg-[#996713] focus:ring-[#C88D23]/50 shadow-sm hover:shadow-md hover:shadow-[#C88D23]/20',
    secondary:
      'bg-[#F6F5F4] text-[#161210] hover:bg-[#ECEAE8] border border-[#E0DCD7] focus:ring-[#C88D23]/30',
    outline:
      'border border-[#D8D3CC] bg-white text-[#161210] hover:border-[#C88D23] hover:text-[#C88D23] hover:bg-[#FFFDF9] focus:ring-[#C88D23]/30 shadow-xs',
    ghost:
      'text-[#58453E] hover:bg-[#F6F5F4] hover:text-[#161210] active:bg-[#ECEAE8] focus:ring-stone-300',
    danger:
      'bg-[#CE3522] text-white hover:bg-[#B22A1A] active:bg-[#962113] focus:ring-rose-500 shadow-sm',
    luxury:
      'bg-[#FAF4EA] text-[#9A6611] hover:bg-[#F3E8D4] border border-[#EAD8BF] hover:border-[#DFAB4C] focus:ring-[#C88D23]/40 shadow-xs',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
