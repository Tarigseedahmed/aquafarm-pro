'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TouchOptimizedProps {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  touchAction?: 'auto' | 'none' | 'pan-x' | 'pan-y' | 'manipulation';
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  // Allow any additional props to pass through to the underlying element
  [key: string]: any;
}

export const TouchOptimized = forwardRef<any, TouchOptimizedProps>(
  ({ as: Component = 'div', children, className, touchAction = 'manipulation', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'touch-manipulation select-none',
          'min-h-[44px] min-w-[44px]',
          'active:scale-95 transition-transform duration-150',
          className
        )}
        style={{ touchAction }}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

TouchOptimized.displayName = 'TouchOptimized';

// Touch-optimized Button
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'relative overflow-hidden';
    const sizeClasses = {
      sm: 'h-10 px-4 text-sm',
      md: 'h-12 px-6 text-base',
      lg: 'h-14 px-8 text-lg'
    };
    const variantClasses = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
    };

    return (
      <TouchOptimized
        as="button"
        ref={ref}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          'rounded-md font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-95',
          className
        )}
        {...props}
      >
        {children}
      </TouchOptimized>
    );
  }
);

TouchButton.displayName = 'TouchButton';

// Touch-optimized Card
interface TouchCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isInteractive?: boolean;
}

export const TouchCard = forwardRef<HTMLDivElement, TouchCardProps>(
  ({ children, className, onClick, isInteractive = false, ...props }, ref) => {
    return (
      <TouchOptimized
        ref={ref}
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm',
          isInteractive && 'cursor-pointer hover:shadow-md active:shadow-sm',
          isInteractive && 'active:scale-[0.98]',
          className
        )}
        onClick={onClick}
        {...props}
      >
        {children}
      </TouchOptimized>
    );
  }
);

TouchCard.displayName = 'TouchCard';

// Touch-optimized Input
interface TouchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const TouchInput = forwardRef<HTMLInputElement, TouchInputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <TouchOptimized
          as="input"
          ref={ref}
          type={type}
          className={cn(
            'flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

TouchInput.displayName = 'TouchInput';
