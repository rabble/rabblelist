import { forwardRef } from 'react'
import type { HTMLAttributes } from 'react'

// ============================================================================
// Types
// ============================================================================

export type CardVariant = 'default' | 'bordered' | 'elevated'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual style variant of the card */
  variant?: CardVariant
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

// ============================================================================
// Constants
// ============================================================================

const CARD_BASE_STYLES = 'rounded-2xl p-6'

const CARD_VARIANT_STYLES: Record<CardVariant, string> = {
  default: 'bg-white text-slate-900',
  bordered: 'bg-white text-slate-900 border border-slate-200',
  elevated: 'bg-white text-slate-900 shadow-soft'
}

const CARD_HEADER_STYLES = 'flex flex-col space-y-1.5 pb-6'

const CARD_TITLE_STYLES = 'text-2xl font-semibold leading-none tracking-tight'

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Combines class names, filtering out empty strings and undefined values
 */
const cn = (...classes: (string | undefined)[]) => {
  return classes.filter(Boolean).join(' ')
}

// ============================================================================
// Components
// ============================================================================

/**
 * Card component for containing related content
 * 
 * @example
 * ```tsx
 * // Default card
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *   </CardHeader>
 *   <CardContent>
 *     Card content goes here
 *   </CardContent>
 * </Card>
 * 
 * // Bordered card
 * <Card variant="bordered">
 *   <CardContent>Simple content</CardContent>
 * </Card>
 * 
 * // Elevated card with custom styling
 * <Card variant="elevated" className="max-w-md">
 *   <CardContent>Elevated content</CardContent>
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, variant = 'default', ...props }, ref) => {
    const classNames = cn(
      CARD_BASE_STYLES,
      CARD_VARIANT_STYLES[variant],
      className
    )
    
    return (
      <div
        ref={ref}
        className={classNames}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

/**
 * Card header component for title and metadata
 * Should contain CardTitle and optional description or actions
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className, ...props }, ref) => {
    const classNames = cn(CARD_HEADER_STYLES, className)
    
    return (
      <div
        ref={ref}
        className={classNames}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

/**
 * Card title component for the main heading
 * Renders as an h3 element for proper semantic structure
 */
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, className, ...props }, ref) => {
    const classNames = cn(CARD_TITLE_STYLES, className)
    
    return (
      <h3
        ref={ref}
        className={classNames}
        {...props}
      >
        {children}
      </h3>
    )
  }
)

CardTitle.displayName = 'CardTitle'

/**
 * Card content component for the main body
 * Use for primary content area of the card
 */
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={className} 
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardContent.displayName = 'CardContent'