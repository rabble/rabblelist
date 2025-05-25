import { type ClassValue, clsx } from 'clsx'

// ============================================================================
// Type Definitions
// ============================================================================

type TimeUnit = 'minutes' | 'hours' | 'days' | 'months' | 'years'

interface TimeDistance {
  value: number
  unit: TimeUnit
}

// ============================================================================
// Constants
// ============================================================================

const TIME_CONSTANTS = {
  MILLISECONDS_PER_MINUTE: 60 * 1000,
  MILLISECONDS_PER_HOUR: 60 * 60 * 1000,
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
  DAYS_PER_MONTH: 30,
  DAYS_PER_YEAR: 365,
} as const

const PHONE_FORMATS = {
  US_10_DIGIT: /^(\d{3})(\d{3})(\d{4})$/,
  US_11_DIGIT: /^1(\d{3})(\d{3})(\d{4})$/,
} as const

const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_DIGITS_ONLY: /\D/g,
} as const

const PHONE_LENGTH = {
  MIN: 10,
  MAX: 15,
} as const

const CSV_EXPORT = {
  CONTENT_TYPE: 'text/csv;charset=utf-8;',
  FILE_EXTENSION: '.csv',
} as const

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Combines class names using clsx
 * @param inputs - Class values to combine
 * @returns Combined class string
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

// ============================================================================
// Date and Time Utilities
// ============================================================================

/**
 * Calculates time difference components
 * @param milliseconds - Time difference in milliseconds
 * @returns Object with calculated time components
 */
function calculateTimeDifference(milliseconds: number) {
  const days = Math.floor(milliseconds / TIME_CONSTANTS.MILLISECONDS_PER_DAY)
  const hours = Math.floor(milliseconds / TIME_CONSTANTS.MILLISECONDS_PER_HOUR)
  const minutes = Math.floor(milliseconds / TIME_CONSTANTS.MILLISECONDS_PER_MINUTE)
  const months = Math.floor(days / TIME_CONSTANTS.DAYS_PER_MONTH)
  const years = Math.floor(days / TIME_CONSTANTS.DAYS_PER_YEAR)

  return { days, hours, minutes, months, years }
}

/**
 * Formats time distance with proper pluralization
 * @param value - Numeric value
 * @param unit - Time unit
 * @returns Formatted string
 */
function formatTimeUnit(value: number, unit: string): string {
  return value === 1 ? `1 ${unit}` : `${value} ${unit}s`
}

/**
 * Determines the appropriate time distance
 * @param diff - Time difference calculations
 * @returns Time distance object
 */
function getTimeDistance(diff: ReturnType<typeof calculateTimeDifference>): TimeDistance {
  if (diff.days === 0) {
    if (diff.hours === 0) {
      return { value: diff.minutes, unit: 'minutes' }
    }
    return { value: diff.hours, unit: 'hours' }
  }
  
  if (diff.days < TIME_CONSTANTS.DAYS_PER_MONTH) {
    return { value: diff.days, unit: 'days' }
  }
  
  if (diff.days < TIME_CONSTANTS.DAYS_PER_YEAR) {
    return { value: diff.months, unit: 'months' }
  }
  
  return { value: diff.years, unit: 'years' }
}

/**
 * Formats the distance between a date and now in human-readable format
 * @param date - The date to compare
 * @returns Formatted time distance string
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date()
  const diffInMilliseconds = now.getTime() - date.getTime()
  const diff = calculateTimeDifference(diffInMilliseconds)
  const distance = getTimeDistance(diff)
  
  // Special case for single day
  if (distance.value === 1 && distance.unit === 'days') {
    return '1 day'
  }
  
  return formatTimeUnit(distance.value, distance.unit.slice(0, -1))
}

// ============================================================================
// Phone Number Utilities
// ============================================================================

/**
 * Removes all non-digit characters from a string
 * @param phone - Phone number string
 * @returns Cleaned phone number
 */
function cleanPhoneNumber(phone: string): string {
  return phone.replace(VALIDATION_PATTERNS.PHONE_DIGITS_ONLY, '')
}

/**
 * Formats a US phone number
 * @param cleaned - Cleaned phone number digits
 * @returns Formatted phone number or null if not a US format
 */
function formatUSPhoneNumber(cleaned: string): string | null {
  const match10Digit = cleaned.match(PHONE_FORMATS.US_10_DIGIT)
  if (match10Digit) {
    return `(${match10Digit[1]}) ${match10Digit[2]}-${match10Digit[3]}`
  }

  const match11Digit = cleaned.match(PHONE_FORMATS.US_11_DIGIT)
  if (match11Digit) {
    return `1 (${match11Digit[1]}) ${match11Digit[2]}-${match11Digit[3]}`
  }

  return null
}

/**
 * Formats a phone number to a standard display format
 * @param phone - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = cleanPhoneNumber(phone)
  const formatted = formatUSPhoneNumber(cleaned)
  return formatted || phone
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validates an email address
 * @param email - Email to validate
 * @returns True if valid email
 */
export function isValidEmail(email: string): boolean {
  return VALIDATION_PATTERNS.EMAIL.test(email)
}

/**
 * Validates a phone number
 * @param phone - Phone number to validate
 * @returns True if valid phone number
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = cleanPhoneNumber(phone)
  return cleaned.length >= PHONE_LENGTH.MIN && cleaned.length <= PHONE_LENGTH.MAX
}

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generates a unique ID using crypto.randomUUID
 * @returns UUID string
 */
export function generateId(): string {
  return crypto.randomUUID()
}

// ============================================================================
// Function Utilities
// ============================================================================

/**
 * Creates a debounced version of a function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function debounced(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// ============================================================================
// PWA Detection
// ============================================================================

/**
 * Checks if the app is running as a PWA
 * @returns True if running as PWA
 */
export function isPWA(): boolean {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  const isIOSStandalone = (window.navigator as any).standalone === true
  const isAndroidApp = document.referrer.includes('android-app://')
  
  return isStandalone || isIOSStandalone || isAndroidApp
}

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Extracts initials from a name
 * @param name - Full name
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return ''
  
  const parts = name.split(' ').filter(Boolean)
  const initials = parts
    .map(part => part[0])
    .join('')
    .toUpperCase()
  
  return initials.slice(0, 2)
}

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Escapes a CSV field value
 * @param value - Value to escape
 * @returns Escaped value
 */
function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  
  const stringValue = String(value)
  
  // Escape quotes and wrap in quotes if contains comma or quotes
  if (stringValue.includes(',') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  
  return stringValue
}

/**
 * Converts data array to CSV content
 * @param data - Array of objects to convert
 * @returns CSV string
 */
function dataToCSV<T extends Record<string, unknown>>(data: T[]): string {
  if (data.length === 0) {
    return ''
  }
  
  const headers = Object.keys(data[0])
  const headerRow = headers.join(',')
  
  const dataRows = data.map(row => 
    headers
      .map(header => escapeCSVField(row[header]))
      .join(',')
  )
  
  return [headerRow, ...dataRows].join('\n')
}

/**
 * Creates and downloads a file
 * @param content - File content
 * @param filename - Name of the file
 * @param contentType - MIME type
 */
function downloadFile(content: string, filename: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Exports data to a CSV file
 * @param data - Array of objects to export
 * @param filename - Name of the file (without extension)
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string
): void {
  const csvContent = dataToCSV(data)
  const fullFilename = `${filename}${CSV_EXPORT.FILE_EXTENSION}`
  
  downloadFile(csvContent, fullFilename, CSV_EXPORT.CONTENT_TYPE)
}