import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardContent } from '../Card'

describe('Card', () => {
  describe('Card Component', () => {
    it('renders children correctly', () => {
      render(<Card>Card content</Card>)
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('forwards ref correctly', () => {
      const ref = vi.fn()
      render(<Card ref={ref}>Card</Card>)
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement))
    })

    it('applies default variant styles', () => {
      const { container } = render(<Card>Default</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('bg-white', 'text-slate-900')
      expect(card).not.toHaveClass('border', 'shadow-soft')
    })

    it('applies bordered variant styles', () => {
      const { container } = render(<Card variant="bordered">Bordered</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('bg-white', 'text-slate-900', 'border', 'border-slate-200')
    })

    it('applies elevated variant styles', () => {
      const { container } = render(<Card variant="elevated">Elevated</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('bg-white', 'text-slate-900', 'shadow-soft')
    })

    it('applies custom className', () => {
      const { container } = render(<Card className="custom-class">Custom</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('custom-class')
    })

    it('applies base styles', () => {
      const { container } = render(<Card>Base</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('rounded-2xl', 'p-6')
    })

    it('supports other div attributes', () => {
      const { container } = render(
        <Card data-testid="test-card" aria-label="Test card">
          Content
        </Card>
      )
      const card = container.firstChild as HTMLElement
      expect(card).toHaveAttribute('data-testid', 'test-card')
      expect(card).toHaveAttribute('aria-label', 'Test card')
    })
  })

  describe('CardHeader Component', () => {
    it('renders children correctly', () => {
      render(<CardHeader>Header content</CardHeader>)
      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('forwards ref correctly', () => {
      const ref = vi.fn()
      render(<CardHeader ref={ref}>Header</CardHeader>)
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement))
    })

    it('applies default styles', () => {
      const { container } = render(<CardHeader>Header</CardHeader>)
      const header = container.firstChild as HTMLElement
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'pb-6')
    })

    it('applies custom className', () => {
      const { container } = render(<CardHeader className="custom-header">Header</CardHeader>)
      const header = container.firstChild as HTMLElement
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('CardTitle Component', () => {
    it('renders children correctly', () => {
      render(<CardTitle>Title text</CardTitle>)
      expect(screen.getByText('Title text')).toBeInTheDocument()
    })

    it('renders as h3 element', () => {
      render(<CardTitle>Title</CardTitle>)
      const title = screen.getByText('Title')
      expect(title.tagName).toBe('H3')
    })

    it('forwards ref correctly', () => {
      const ref = vi.fn()
      render(<CardTitle ref={ref}>Title</CardTitle>)
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLHeadingElement))
    })

    it('applies default styles', () => {
      render(<CardTitle>Title</CardTitle>)
      const title = screen.getByText('Title')
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight')
    })

    it('applies custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>)
      const title = screen.getByText('Title')
      expect(title).toHaveClass('custom-title')
    })
  })

  describe('CardContent Component', () => {
    it('renders children correctly', () => {
      render(<CardContent>Content text</CardContent>)
      expect(screen.getByText('Content text')).toBeInTheDocument()
    })

    it('forwards ref correctly', () => {
      const ref = vi.fn()
      render(<CardContent ref={ref}>Content</CardContent>)
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement))
    })

    it('applies custom className', () => {
      const { container } = render(<CardContent className="custom-content">Content</CardContent>)
      const content = container.firstChild as HTMLElement
      expect(content).toHaveClass('custom-content')
    })

    it('supports other div attributes', () => {
      const { container } = render(
        <CardContent data-testid="content" role="region">
          Content
        </CardContent>
      )
      const content = container.firstChild as HTMLElement
      expect(content).toHaveAttribute('data-testid', 'content')
      expect(content).toHaveAttribute('role', 'region')
    })
  })

  describe('Component Composition', () => {
    it('works correctly when composed together', () => {
      render(
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the card content</p>
          </CardContent>
        </Card>
      )

      expect(screen.getByText('Test Card')).toBeInTheDocument()
      expect(screen.getByText('This is the card content')).toBeInTheDocument()
    })
  })
})