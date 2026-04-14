import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'danger';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2';
  
  const variants = {
    default: 'border-transparent bg-surface text-text',
    success: 'border-transparent bg-emerald-500/10 text-emerald-400',
    danger: 'border-red-500/20 bg-red-500/10 text-red-500',
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props} />
  );
}
