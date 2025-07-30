import React from 'react'
import { cn } from '@/utils/cn'

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  removable?: boolean
  onRemove?: () => void
  icon?: React.ReactNode
}

const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ 
    className, 
    variant = 'secondary',
    size = 'md',
    removable = false,
    onRemove,
    icon,
    children,
    ...props 
  }, ref) => {
    const baseClasses = 'tag'
    
    const variantClasses = {
      primary: 'tag-primary',
      secondary: 'tag-secondary',
      accent: 'tag-accent',
      success: 'tag-success',
      warning: 'tag-warning',
      error: 'tag-error'
    }
    
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm'
    }

    const iconSizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-3.5 h-3.5',
      lg: 'w-4 h-4'
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
        {icon && (
          <span className={cn(iconSizeClasses[size], 'flex-shrink-0')}>
            {icon}
          </span>
        )}
        {children}
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className={cn(
              'ml-1 flex-shrink-0 rounded-full hover:bg-black/10 transition-colors',
              iconSizeClasses[size]
            )}
          >
            <span className="sr-only">Remove</span>
            ×
          </button>
        )}
      </span>
    )
  }
)

Tag.displayName = 'Tag'

export { Tag }