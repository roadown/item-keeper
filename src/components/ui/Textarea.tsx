import React from 'react'
import { cn } from '@/utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  fullWidth?: boolean
  autoResize?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    label,
    error,
    hint,
    fullWidth = true,
    autoResize = false,
    rows = 4,
    ...props 
  }, ref) => {
    const textareaId = React.useId()
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    React.useImperativeHandle(ref, () => textareaRef.current!)

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current
        textarea.style.height = 'auto'
        const newHeight = Math.max(96, Math.min(textarea.scrollHeight, 192))
        textarea.style.height = newHeight + 'px'
      }
      props.onInput?.(e)
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && props.onKeyPress) {
        e.preventDefault()
        props.onKeyPress(e)
      } else if (e.key === 'Enter' && e.shiftKey) {
        // 允许 Shift+Enter 换行
      }
      props.onKeyDown?.(e)
    }

    return (
      <div className={cn('space-y-1', fullWidth && 'w-full')}>
        {label && (
          <label 
            htmlFor={textareaId}
            className="block text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        
        <textarea
          id={textareaId}
          rows={rows}
          className={cn(
            'textarea',
            autoResize && 'min-h-[96px] max-h-48',
            error && 'border-error-500 focus:border-error-500 focus:ring-error-500/20',
            className
          )}
          ref={textareaRef}
          onInput={handleInput}
          onKeyDown={handleKeyPress}
          {...props}
        />
        
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

Textarea.displayName = 'Textarea'

export { Textarea }