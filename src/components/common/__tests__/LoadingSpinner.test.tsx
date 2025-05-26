import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status', { name: 'Loading' })
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('h-8', 'w-8') // medium size
    })

    it('should render with custom className', () => {
      render(<LoadingSpinner className="custom-class" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('custom-class')
    })

    it('should have screen reader text', () => {
      render(<LoadingSpinner />)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toHaveClass('sr-only')
    })
  })

  describe('sizes', () => {
    it('should render small size', () => {
      render(<LoadingSpinner size="small" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('h-4', 'w-4')
    })

    it('should render medium size', () => {
      render(<LoadingSpinner size="medium" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('h-8', 'w-8')
    })

    it('should render large size', () => {
      render(<LoadingSpinner size="large" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('h-12', 'w-12')
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveAttribute('aria-label', 'Loading')
    })

    it('should have animation class', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('animate-spin')
    })
  })

  describe('styling', () => {
    it('should have all required styling classes', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass(
        'animate-spin',
        'rounded-full',
        'border-b-2',
        'border-primary-500'
      )
    })

    it('should combine size and custom classes', () => {
      render(<LoadingSpinner size="large" className="mx-auto" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('h-12', 'w-12', 'mx-auto')
    })
  })
})