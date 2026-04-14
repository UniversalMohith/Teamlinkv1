import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';

interface AccentButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const AccentButton = forwardRef<HTMLButtonElement, AccentButtonProps>(
  ({ className, variant = 'solid', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    const variants = {
      solid: 'text-white bg-[rgb(var(--color-accent-primary))] hover:bg-[rgb(var(--color-accent-primary-hover))] dark:bg-[rgb(var(--color-accent-primary-dark))] dark:hover:bg-[rgb(var(--color-accent-primary-dark-hover))]',
      outline: 'border-2 border-[rgb(var(--color-accent-primary))] text-[rgb(var(--color-accent-primary))] hover:bg-[rgb(var(--color-accent-light))] dark:border-[rgb(var(--color-accent-primary-dark))] dark:text-[rgb(var(--color-accent-primary-dark))] dark:hover:bg-[rgb(var(--color-accent-light-dark))]',
      ghost: 'text-[rgb(var(--color-accent-primary))] hover:bg-[rgb(var(--color-accent-light))] dark:text-[rgb(var(--color-accent-primary-dark))] dark:hover:bg-[rgb(var(--color-accent-light-dark))]',
    };
    
    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4',
      lg: 'h-11 px-8',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

AccentButton.displayName = 'AccentButton';
