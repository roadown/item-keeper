import React from 'react'
import { cn } from '@/utils/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    className, 
    variant = 'primary',
    size = 'md',
    children,
    ...props 
  }, ref) => {
    const baseClasses = 'badge'
    
    const variantClasses = {
      primary: 'badge-primary',
      secondary: 'bg-neutral-100 text-neutral-800',
      success: 'badge-success',
      warning: 'badge-warning',
      error: 'badge-error',
      neutral: 'bg-neutral-200 text-neutral-700'
    }
    
    const sizeClasses = {
      sm: 'px-1.5 py-0.5 text-xs',
      md: 'px-2 py-1 text-xs',
      lg: 'px-2.5 py-1 text-sm'
    }

    return (
      <span
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }