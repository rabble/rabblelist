import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  formatDistanceToNow,
  formatPhoneNumber,
  isValidEmail,
  isValidPhone,
  generateId,
  debounce,
  isPWA,
  getInitials,
  exportToCSV
} from '../utils'

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('should combine class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('should handle arrays', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
    })
  })

  describe('formatDistanceToNow', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should format minutes correctly', () => {
      const now = new Date('2024-01-01T12:00:00')
      vi.setSystemTime(now)
      
      const date = new Date('2024-01-01T11:30:00')
      expect(formatDistanceToNow(date)).toBe('30 minutes')
    })

    it('should format hours correctly', () => {
      const now = new Date('2024-01-01T12:00:00')
      vi.setSystemTime(now)
      
      const date = new Date('2024-01-01T09:00:00')
      expect(formatDistanceToNow(date)).toBe('3 hours')
    })

    it('should format single day correctly', () => {
      const now = new Date('2024-01-02T12:00:00')
      vi.setSystemTime(now)
      
      const date = new Date('2024-01-01T12:00:00')
      expect(formatDistanceToNow(date)).toBe('1 day')
    })

    it('should format multiple days correctly', () => {
      const now = new Date('2024-01-15T12:00:00')
      vi.setSystemTime(now)
      
      const date = new Date('2024-01-01T12:00:00')
      expect(formatDistanceToNow(date)).toBe('14 days')
    })

    it('should format months correctly', () => {
      const now = new Date('2024-03-01T12:00:00')
      vi.setSystemTime(now)
      
      const date = new Date('2024-01-01T12:00:00')
      expect(formatDistanceToNow(date)).toBe('2 months')
    })

    it('should format years correctly', () => {
      const now = new Date('2026-01-01T12:00:00')
      vi.setSystemTime(now)
      
      const date = new Date('2024-01-01T12:00:00')
      expect(formatDistanceToNow(date)).toBe('2 years')
    })
  })

  describe('formatPhoneNumber', () => {
    it('should format 10-digit US phone number', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890')
    })

    it('should format 11-digit US phone number with country code', () => {
      expect(formatPhoneNumber('11234567890')).toBe('1 (123) 456-7890')
    })

    it('should clean and format phone with non-digits', () => {
      expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890')
      expect(formatPhoneNumber('123.456.7890')).toBe('(123) 456-7890')
    })

    it('should return non-standard numbers as-is', () => {
      expect(formatPhoneNumber('123')).toBe('123')
      expect(formatPhoneNumber('12345678901234567890')).toBe('12345678901234567890')
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('user+tag@example.com')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidEmail('notanemail')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('user @example.com')).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    it('should validate phone numbers with 10-15 digits', () => {
      expect(isValidPhone('1234567890')).toBe(true)
      expect(isValidPhone('12345678901')).toBe(true)
      expect(isValidPhone('123456789012345')).toBe(true)
    })

    it('should validate formatted phone numbers', () => {
      expect(isValidPhone('(123) 456-7890')).toBe(true)
      expect(isValidPhone('+1-123-456-7890')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false)
      expect(isValidPhone('1234567890123456')).toBe(false)
      expect(isValidPhone('abcdefghij')).toBe(false)
    })
  })

  describe('generateId', () => {
    it('should generate a valid UUID', () => {
      const id = generateId()
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      expect(id).toMatch(uuidRegex)
    })

    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should debounce function calls', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('first')
      debouncedFn('second')
      debouncedFn('third')

      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('third')
    })

    it('should handle multiple debounce cycles', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('first')
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledWith('first')

      debouncedFn('second')
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledWith('second')

      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('isPWA', () => {
    it('should detect standalone display mode', () => {
      const matchMediaMock = vi.fn().mockReturnValue({ matches: true })
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: matchMediaMock
      })

      expect(isPWA()).toBe(true)
      expect(matchMediaMock).toHaveBeenCalledWith('(display-mode: standalone)')
    })

    it('should detect iOS standalone', () => {
      const matchMediaMock = vi.fn().mockReturnValue({ matches: false })
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: matchMediaMock
      })
      
      ;(window.navigator as any).standalone = true
      expect(isPWA()).toBe(true)
      delete (window.navigator as any).standalone
    })

    it('should return false when not PWA', () => {
      const matchMediaMock = vi.fn().mockReturnValue({ matches: false })
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: matchMediaMock
      })
      
      Object.defineProperty(document, 'referrer', {
        writable: true,
        value: 'https://example.com'
      })

      expect(isPWA()).toBe(false)
    })
  })

  describe('getInitials', () => {
    it('should get initials from single word', () => {
      expect(getInitials('John')).toBe('J')
    })

    it('should get initials from two words', () => {
      expect(getInitials('John Doe')).toBe('JD')
    })

    it('should only use first two initials', () => {
      expect(getInitials('John Michael Doe')).toBe('JM')
    })

    it('should handle empty string', () => {
      expect(getInitials('')).toBe('')
    })
  })

  describe('exportToCSV', () => {
    let originalCreateElement: typeof document.createElement
    let originalCreateObjectURL: typeof URL.createObjectURL

    beforeEach(() => {
      originalCreateElement = document.createElement
      originalCreateObjectURL = URL.createObjectURL
    })

    afterEach(() => {
      document.createElement = originalCreateElement
      URL.createObjectURL = originalCreateObjectURL
    })

    it('should export data to CSV', () => {
      const clickSpy = vi.fn()
      const link = document.createElement('a')
      link.click = clickSpy

      vi.spyOn(document, 'createElement').mockReturnValue(link)
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => link)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => link)
      URL.createObjectURL = vi.fn().mockReturnValue('blob:url')

      const data = [
        { name: 'John', age: 30, city: 'New York' },
        { name: 'Jane', age: 25, city: 'Los Angeles' }
      ]

      exportToCSV(data, 'test')

      expect(link.getAttribute('download')).toBe('test.csv')
      expect(link.getAttribute('href')).toBe('blob:url')
      expect(clickSpy).toHaveBeenCalled()
    })

    it('should generate correct CSV content', () => {
      let blobContent = ''
      global.Blob = vi.fn().mockImplementation((content) => {
        blobContent = content[0]
        return { type: 'text/csv;charset=utf-8;' }
      }) as any

      const link = document.createElement('a')
      vi.spyOn(document, 'createElement').mockReturnValue(link)
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => link)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => link)
      URL.createObjectURL = vi.fn().mockReturnValue('blob:url')

      const data = [
        { name: 'John, Jr.', description: 'Has "quotes"' },
        { name: 'Jane', description: 'Normal text' }
      ]

      exportToCSV(data, 'test')

      expect(blobContent).toContain('name,description')
      expect(blobContent).toContain('"John, Jr.","Has ""quotes"""')
      expect(blobContent).toContain('Jane,Normal text')
    })

    it('should handle empty data array', () => {
      const link = document.createElement('a')
      vi.spyOn(document, 'createElement').mockReturnValue(link)
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => link)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => link)
      URL.createObjectURL = vi.fn().mockReturnValue('blob:url')

      expect(() => exportToCSV([], 'test')).not.toThrow()
    })
  })
})