import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  variant?: 'glass' | 'dark' | 'default';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  variant = 'default',
  ...props
}) => {
  const variantStyles = {
    glass:
      'bg-white/95 backdrop-blur-md border border-[#E8E5E1] shadow-sm text-[#161210]',
    dark:
      'bg-[#161210] border border-[#2D2420] text-white shadow-xl',
    default:
      'bg-white border border-[#E8E5E1] shadow-sm text-[#161210]',
  };

  return (
    <div
      className={`rounded-2xl transition-all duration-300 ${variantStyles[variant]} ${
        hoverable ? 'hover:border-[#D6CCA9] hover:shadow-md hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-6 pb-4 border-b border-[#F0ECE7] ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`text-lg font-bold text-[#161210] tracking-tight font-serif-heading ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-sm text-[#58453E] mt-1 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-6 pt-4 border-t border-[#F0ECE7] flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);
