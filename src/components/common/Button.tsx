import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

// ============================================================================
// Types
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant of the button */
  variant?: ButtonVariant
  /** Size of the button */
  size?: ButtonSize
  /** Whether to show loading spinner and disable interactions */
  isLoading?: boolean
  /** Whether button should take full width of container */
  fullWidth?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const BASE_STYLES = [
  'inline-flex',
  'items-center',
  'justify-center',
  'font-medium',
  'rounded-xl',
  'transition-all',
  'duration-200',
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-offset-2',
  'disabled:pointer-events-none',
  'disabled:opacity-50',
  'transform',
  'active:scale-[0.98]'
].join(' ')

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: [
    'bg-gradient-to-r',
    'from-primary-500',
    'to-primary-600',
    'text-white',
    'hover:from-primary-600',
    'hover:to-primary-700',
    'active:from-primary-700',
    'active:to-primary-800',
    'focus-visible:ring-primary-500',
    'shadow-md',
    'hover:shadow-lg'
  ].join(' '),
  
  secondary: [
    'bg-slate-100',
    'text-slate-900',
    'hover:bg-slate-200',
    'shadow-sm',
    'hover:shadow-md'
  ].join(' '),
  
  outline: [
    'border-2',
    'border-slate-200',
    'bg-white',
    'hover:bg-slate-50',
    'hover:border-slate-300',
    'hover:shadow-sm'
  ].join(' '),
  
  ghost: [
    'hover:bg-slate-100',
    'hover:text-slate-900'
  ].join(' '),
  
  destructive: [
    'bg-red-500',
    'text-white',
    'hover:bg-red-600',
    'shadow-md',
    'hover:shadow-lg'
  ].join(' ')
}

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-base',
  lg: 'h-13 px-8 text-lg'
}

// ============================================================================
// Components
// ============================================================================

/**
 * Loading spinner component for button loading state
 */
const LoadingSpinner = () => (
  <svg 
    className="animate-spin -ml-1 mr-2 h-4 w-4" 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4"
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
)

// ============================================================================
// Main Component
// ============================================================================

/**
 * Button component with multiple variants and states
 * 
 * @example
 * ```tsx
 * // Primary button
 * <Button onClick={handleClick}>Click me</Button>
 * 
 * // Secondary button with loading state
 * <Button variant="secondary" isLoading>
 *   Saving...
 * </Button>
 * 
 * // Full width destructive button
 * <Button variant="destructive" fullWidth>
 *   Delete Account
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    fullWidth = false,
    disabled,
    type = 'button',
    ...props 
  }, ref) => {
    // Compose class names
    const classNames = [
      BASE_STYLES,
      VARIANT_STYLES[variant],
      SIZE_STYLES[size],
      fullWidth && 'w-full',
      className
    ].filter(Boolean).join(' ')

    // Determine if button should be disabled
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={classNames}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && <LoadingSpinner />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'