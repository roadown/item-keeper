import React from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text',
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    fullWidth = true,
    ...props 
  }, ref) => {
    const inputId = React.useId()

    return (
      <div className={cn('space-y-1', fullWidth && 'w-full')}>
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              <span className="w-4 h-4 flex items-center justify-center">
                {leftIcon}
              </span>
            </div>
          )}
          
          <input
            id={inputId}
            type={type}
            className={cn(
              'input',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-error-500 focus:border-error-500 focus:ring-error-500/20',
              className
            )}
            ref={ref}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              <span className="w-4 h-4 flex items-center justify-center">
                {rightIcon}
              </span>
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-error-600 flex items-center gap-1">
            <span className="w-4 h-4 flex-shrink-0">⚠️</span>
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p className="text-sm text-neutral-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }