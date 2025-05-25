import { type ClassValue, clsx } from 'clsx'

// Re-export clsx as cn for consistency
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Format date distance
export function formatDistanceToNow(date: Date): string {
  const now = new Date()
  const diffInMilliseconds = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60))
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60))
      return `${diffInMinutes} minutes`
    }
    return `${diffInHours} hours`
  } else if (diffInDays === 1) {
    return '1 day'
  } else if (diffInDays < 30) {
    return `${diffInDays} days`
  } else if (diffInDays < 365) {
    const diffInMonths = Math.floor(diffInDays / 30)
    return diffInMonths === 1 ? '1 month' : `${diffInMonths} months`
  } else {
    const diffInYears = Math.floor(diffInDays / 365)
    return diffInYears === 1 ? '1 year' : `${diffInYears} years`
  }
}

// Phone number formatting
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Format based on length
  if (cleaned.length === 10) {
    // US format: (123) 456-7890
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    // US format with country code: 1 (123) 456-7890
    return `1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  
  // Return as-is if not a standard format
  return phone
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone number
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 15
}

// Generate a unique ID
export function generateId(): string {
  return crypto.randomUUID()
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Check if running as PWA
export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone ||
         document.referrer.includes('android-app://')
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Export to CSV
export function exportToCSV(data: any[], filename: string): void {
  const headers = Object.keys(data[0] || {})
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}