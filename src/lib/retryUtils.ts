interface RetryOptions {
  maxAttempts?: number
  delayMs?: number
  backoffMultiplier?: number
  onRetry?: (error: any, attempt: number) => void
}

/**
 * Exponential backoff retry utility for database operations
 * @param fn The async function to retry
 * @param options Retry configuration options
 * @returns The result of the function if successful
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry
  } = options

  let lastError: any

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Don't retry on certain errors
      if (shouldNotRetry(error)) {
        throw error
      }

      // If this was the last attempt, throw the error
      if (attempt === maxAttempts) {
        throw error
      }

      // Call the onRetry callback if provided
      if (onRetry) {
        onRetry(error, attempt)
      }

      // Calculate delay with exponential backoff
      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1)
      
      // Add some jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay
      const totalDelay = delay + jitter

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, totalDelay))
    }
  }

  throw lastError
}

/**
 * Determines if an error should not be retried
 * @param error The error to check
 * @returns true if the error should not be retried
 */
function shouldNotRetry(error: any): boolean {
  // Don't retry on authentication errors
  if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
    return true
  }

  // Don't retry on permission errors
  if (error.code === 'PGRST204' || error.message?.includes('permission')) {
    return true
  }

  // Don't retry on validation errors
  if (error.code === '23514' || error.message?.includes('constraint')) {
    return true
  }

  // Don't retry on duplicate key errors
  if (error.code === '23505' || error.message?.includes('duplicate')) {
    return true
  }

  // Don't retry on foreign key violations
  if (error.code === '23503') {
    return true
  }

  return false
}

/**
 * Creates a retry wrapper with preset options
 * @param defaultOptions Default retry options
 * @returns A function that wraps async functions with retry logic
 */
export function createRetryWrapper(defaultOptions: RetryOptions = {}) {
  return function <T>(fn: () => Promise<T>, overrideOptions: RetryOptions = {}): Promise<T> {
    return withRetry(fn, { ...defaultOptions, ...overrideOptions })
  }
}