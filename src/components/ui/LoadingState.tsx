import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };
  return <Loader2 className={`animate-spin text-slate-800 ${sizeClasses[size]} ${className}`} />;
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`animate-pulse bg-slate-200/80 rounded-md ${className}`} />;
};

export const FullPageLoader: React.FC<{ message?: string }> = ({
  message = 'Loading H H Events & Conventions...',
}) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 gap-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
          <Spinner size="md" className="text-amber-700" />
        </div>
      </div>
      <p className="text-sm font-medium text-slate-600 animate-pulse">{message}</p>
    </div>
  );
};
