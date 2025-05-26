// ============================================================================
// LoadingSpinner Component
// ============================================================================
// A reusable loading spinner component with configurable sizes and styling.
// Provides proper accessibility attributes for screen readers.

// ============================================================================
// Types
// ============================================================================

type SpinnerSize = 'small' | 'medium' | 'large'

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: SpinnerSize
  /** Additional CSS classes to apply */
  className?: string
  /** Accessible label for the spinner */
  label?: string
}

// ============================================================================
// Constants
// ============================================================================

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  small: 'h-4 w-4',
  medium: 'h-8 w-8',
  large: 'h-12 w-12'
} as const

const DEFAULT_SIZE: SpinnerSize = 'medium'
const DEFAULT_LABEL = 'Loading'
const SCREEN_READER_TEXT = 'Loading...'

// ============================================================================
// Component
// ============================================================================

/**
 * LoadingSpinner displays an animated spinning indicator
 * 
 * @example
 * ```tsx
 * // Default medium spinner
 * <LoadingSpinner />
 * 
 * // Large spinner with custom class
 * <LoadingSpinner size="large" className="mx-auto" />
 * 
 * // Custom label for specific context
 * <LoadingSpinner label="Saving contact" />
 * ```
 */
export function LoadingSpinner({ 
  size = DEFAULT_SIZE, 
  className = '',
  label = DEFAULT_LABEL 
}: LoadingSpinnerProps) {
  const sizeClass = SIZE_CLASSES[size]
  
  // Combine all classes
  const spinnerClasses = [
    'animate-spin',
    'rounded-full',
    'border-b-2',
    'border-primary-500',
    sizeClass,
    className
  ].filter(Boolean).join(' ')

  return (
    <div
      className={spinnerClasses}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{SCREEN_READER_TEXT}</span>
    </div>
  )
}