import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`p-6 rounded-2xl bg-rose-50/70 border border-rose-200 text-rose-900 flex flex-col items-center text-center gap-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-base font-semibold text-rose-900">{title}</h4>
        <p className="text-sm text-rose-700 mt-1 max-w-md">{message}</p>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="border-rose-300 text-rose-800 hover:bg-rose-100"
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
