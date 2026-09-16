/**
 * Retry handler utilities for ClipForge
 * Implements exponential backoff with jitter for retrying failed operations
 */

import { Platform } from '@clipforge/shared';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  jitterFactor?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

interface RetryContext {
  attempt: number;
  lastError?: Error;
  totalDelayed: number;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 5,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  jitterFactor: 0.1,
  retryableErrors: [],
  onRetry: () => {},
};

/**
 * Platform-specific retry configurations
 */
const PLATFORM_RETRY_CONFIGS: Record<Platform, Partial<RetryOptions>> = {
  youtube: {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 60000,
  },
  tiktok: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
  },
  instagram: {
    maxRetries: 4,
    baseDelay: 1500,
    maxDelay: 45000,
  },
  facebook: {
    maxRetries: 4,
    baseDelay: 1500,
    maxDelay: 45000,
  },
  twitter: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
  },
  linkedin: {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 60000,
  },
  threads: {
    maxRetries: 4,
    baseDelay: 1500,
    maxDelay: 45000,
  },
  snapchat: {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 60000,
  },
  pinterest: {
    maxRetries: 4,
    baseDelay: 1500,
    maxDelay: 45000,
  },
};

/**
 * Calculate delay with exponential backoff and jitter
 * @param attempt Current attempt number (1-based)
 * @param baseDelay Base delay in milliseconds
 * @param maxDelay Maximum delay in milliseconds
 * @param jitterFactor Jitter factor (0-1)
 * @returns Delay in milliseconds
 */
export function calculateDelay(
  attempt: number,
  baseDelay: number = DEFAULT_RETRY_OPTIONS.baseDelay,
  maxDelay: number = DEFAULT_RETRY_OPTIONS.maxDelay,
  jitterFactor: number = DEFAULT_RETRY_OPTIONS.jitterFactor
): number {
  // Exponential backoff: baseDelay * 2^(attempt-1)
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  
  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  
  // Add jitter: random value between -jitter and +jitter
  const jitterRange = cappedDelay * jitterFactor;
  const jitter = (Math.random() * 2 - 1) * jitterRange;
  
  const finalDelay = cappedDelay + jitter;
  
  // Ensure delay is at least 0
  return Math.max(0, Math.round(finalDelay));
}

/**
 * Sleep for a specified duration
 * @param ms Duration in milliseconds
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry options
 * @returns Promise that resolves with the function result or rejects after all retries
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const mergedOptions: Required<RetryOptions> = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  };

  let lastError: Error | undefined;
  let totalDelayed = 0;

  for (let attempt = 1; attempt <= mergedOptions.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (mergedOptions.retryableErrors.length > 0) {
        const isRetryable = mergedOptions.retryableErrors.some(
          (retryableError) => {
            if (typeof retryableError === 'string') {
              return lastError.message.includes(retryableError) ||
                     lastError.name.includes(retryableError);
            }
            if (retryableError instanceof RegExp) {
              return retryableError.test(lastError.message) ||
                     retryableError.test(lastError.name);
            }
            if (typeof retryableError === 'function') {
              return retryableError(lastError);
            }
            return false;
          }
        );

        if (!isRetryable) {
          throw lastError;
        }
      }

      // If we've exhausted all retries, throw the last error
      if (attempt > mergedOptions.maxRetries) {
        throw lastError;
      }

      // Calculate delay for this attempt
      const delay = calculateDelay(
        attempt,
        mergedOptions.baseDelay,
        mergedOptions.maxDelay,
        mergedOptions.jitterFactor
      );

      totalDelayed += delay;

      // Call onRetry callback
      mergedOptions.onRetry(attempt, lastError, delay);

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry a function with platform-specific configuration
 * @param platform The platform for the operation
 * @param fn Function to retry
 * @param options Additional retry options (merged with platform defaults)
 * @returns Promise that resolves with the function result
 */
export async function retryWithPlatform<T>(
  platform: Platform,
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const platformConfig = PLATFORM_RETRY_CONFIGS[platform] ?? {};
  const mergedOptions: Required<RetryOptions> = {
    ...DEFAULT_RETRY_OPTIONS,
    ...platformConfig,
    ...options,
  };

  return retry<T>(fn, mergedOptions);
}

/**
 * Create a retryable function wrapper
 * @param options Retry options
 * @returns Function that wraps another function with retry logic
 */
export function withRetry<T extends unknown[], R>(
  options: RetryOptions = {}
): (fn: (...args: T) => Promise<R>) => (...args: T) => Promise<R> {
  return (fn: (...args: T) => Promise<R>) => {
    return async (...args: T): Promise<R> => {
      return retry<R>(() => fn(...args), options);
    };
  };
}

/**
 * Create a retryable function wrapper with platform-specific configuration
 * @param platform The platform for the operation
 * @param options Additional retry options
 * @returns Function that wraps another function with platform-specific retry logic
 */
export function withPlatformRetry<T extends unknown[], R>(
  platform: Platform,
  options: RetryOptions = {}
): (fn: (...args: T) => Promise<R>) => (...args: T) => Promise<R> {
  return (fn: (...args: T) => Promise<R>) => {
    return async (...args: T): Promise<R> => {
      return retryWithPlatform<R>(platform, () => fn(...args), options);
    };
  };
}

/**
 * Check if an error should be retried based on common patterns
 * @param error The error to check
 * @returns true if the error is likely retryable
 */
export function isRetryableError(error: Error): boolean {
  const retryablePatterns = [
    /rate limit/,
    /too many requests/,
    /temporarily unavailable/,
    /service unavailable/,
    /502/,
    /503/,
    /504/,
    /429/,
    /timeout/,
    /network/,
    /connection/,
    /ETIMEDOUT/,
    /ECONNRESET/,
    /ECONNREFUSED/,
    /ENOTFOUND/,
  ];

  const errorString = `${error.name}: ${error.message}`.toLowerCase();
  return retryablePatterns.some((pattern) => pattern.test(errorString));
}

/**
 * Context for tracking retry state
 */
export class RetryContextManager {
  private contexts: Map<string, RetryContext> = new Map();

  /**
   * Get or create a retry context for an operation
   * @param operationId Unique identifier for the operation
   * @returns Retry context
   */
  getContext(operationId: string): RetryContext {
    if (!this.contexts.has(operationId)) {
      this.contexts.set(operationId, {
        attempt: 0,
        totalDelayed: 0,
      });
    }
    return this.contexts.get(operationId)!;
  }

  /**
   * Update a retry context
   * @param operationId Unique identifier for the operation
   * @param updates Updates to apply
   */
  updateContext(operationId: string, updates: Partial<RetryContext>): void {
    const context = this.getContext(operationId);
    this.contexts.set(operationId, { ...context, ...updates });
  }

  /**
   * Clear a retry context
   * @param operationId Unique identifier for the operation
   */
  clearContext(operationId: string): void {
    this.contexts.delete(operationId);
  }

  /**
   * Clear all retry contexts
   */
  clearAll(): void {
    this.contexts.clear();
  }

  /**
   * Get all active retry contexts
   * @returns Map of operation IDs to contexts
   */
  getAllContexts(): Map<string, RetryContext> {
    return new Map(this.contexts);
  }
}

/**
 * Global retry context manager
 */
export const retryContextManager = new RetryContextManager();
