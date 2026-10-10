import React from 'react';
import { BookingStatus, TimeSlot } from '../../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'amber';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    info: 'bg-sky-50 text-sky-700 border border-sky-200/80',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200/80',
    amber: 'bg-amber-100 text-amber-900 border border-amber-300',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider font-semibold whitespace-nowrap ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export const BookingStatusBadge: React.FC<{ status: BookingStatus }> = ({ status }) => {
  switch (status) {
    case 'confirmed':
      return (
        <Badge variant="success">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Confirmed
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="info">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          Approved
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="warning">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pending Review
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="danger">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Rejected
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="default">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Cancelled
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="purple">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          Completed
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

export const TimeSlotBadge: React.FC<{ slot: TimeSlot }> = ({ slot }) => {
  switch (slot) {
    case 'morning':
      return (
        <span className="inline-flex items-center text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
          Morning (07:00 – 14:00)
        </span>
      );
    case 'evening':
      return (
        <span className="inline-flex items-center text-xs font-medium text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
          Evening (16:00 – 23:00)
        </span>
      );
    case 'full_day':
      return (
        <span className="inline-flex items-center text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
          Full Day (07:00 – 23:00)
        </span>
      );
  }
};
