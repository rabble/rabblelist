import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('forwards ref correctly', () => {
      const ref = vi.fn()
      render(<Button ref={ref}>Button</Button>)
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement))
    })

    it('renders with custom className', () => {
      render(<Button className="custom-class">Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Variants', () => {
    it('applies primary variant styles by default', () => {
      render(<Button>Primary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gradient-to-r', 'from-primary-500', 'to-primary-600')
    })

    it('applies secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-slate-100', 'text-slate-900')
    })

    it('applies outline variant styles', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-2', 'border-slate-200')
    })

    it('applies ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-slate-100')
    })

    it('applies destructive variant styles', () => {
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-red-500', 'text-white')
    })
  })

  describe('Sizes', () => {
    it('applies medium size by default', () => {
      render(<Button>Medium</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-11', 'px-5', 'text-base')
    })

    it('applies small size', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9', 'px-3', 'text-sm')
    })

    it('applies large size', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-13', 'px-8', 'text-lg')
    })
  })

  describe('States', () => {
    it('disables button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })

    it('shows loading spinner when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>)
      const button = screen.getByRole('button')
      const spinner = button.querySelector('svg')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })

    it('disables button when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('Layout', () => {
    it('applies full width when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-full')
    })

    it('does not apply full width by default', () => {
      render(<Button>Normal Width</Button>)
      const button = screen.getByRole('button')
      expect(button).not.toHaveClass('w-full')
    })
  })

  describe('Interactions', () => {
    it('calls onClick handler when clicked', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn()
      render(<Button disabled onClick={handleClick}>Disabled</Button>)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('does not call onClick when loading', () => {
      const handleClick = vi.fn()
      render(<Button isLoading onClick={handleClick}>Loading</Button>)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      render(<Button aria-label="Custom label">Button</Button>)
      const button = screen.getByRole('button', { name: 'Custom label' })
      expect(button).toBeInTheDocument()
    })

    it('supports other button attributes', () => {
      render(
        <Button type="submit" form="test-form" aria-describedby="help-text">
          Submit
        </Button>
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('form', 'test-form')
      expect(button).toHaveAttribute('aria-describedby', 'help-text')
    })
  })
})