/**
 * Rate limiter utilities for ClipForge
 * Implements token bucket algorithm for rate limiting per platform
 */

import { Platform } from '@clipforge/shared';

interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
}

interface RateLimitState {
  tokens: number;
  lastRefill: number;
}

/**
 * Platform-specific rate limit configurations
 */
const PLATFORM_RATE_LIMITS: Record<Platform, RateLimitConfig> = {
  youtube: {
    requestsPerMinute: 100,
    requestsPerHour: 10000,
  },
  tiktok: {
    requestsPerMinute: 60,
    requestsPerHour: 5000,
  },
  instagram: {
    requestsPerMinute: 200,
    requestsPerHour: 10000,
  },
  facebook: {
    requestsPerMinute: 200,
    requestsPerHour: 10000,
  },
  twitter: {
    requestsPerMinute: 900,
    requestsPerHour: 15000,
  },
  linkedin: {
    requestsPerMinute: 50,
    requestsPerHour: 5000,
  },
  threads: {
    requestsPerMinute: 60,
    requestsPerHour: 5000,
  },
  snapchat: {
    requestsPerMinute: 100,
    requestsPerHour: 10000,
  },
  pinterest: {
    requestsPerMinute: 200,
    requestsPerHour: 10000,
  },
};

/**
 * RateLimiter class for managing rate limits per platform
 */
export class RateLimiter {
  private limits: Map<Platform, RateLimitConfig>;
  private states: Map<Platform, RateLimitState>;
  private minuteTokens: Map<Platform, number>;
  private hourTokens: Map<Platform, number>;
  private lastMinuteRefill: Map<Platform, number>;
  private lastHourRefill: Map<Platform, number>;

  constructor() {
    this.limits = new Map();
    this.states = new Map();
    this.minuteTokens = new Map();
    this.hourTokens = new Map();
    this.lastMinuteRefill = new Map();
    this.lastHourRefill = new Map();

    // Initialize all platforms
    Object.keys(PLATFORM_RATE_LIMITS).forEach((platform) => {
      const p = platform as Platform;
      this.limits.set(p, PLATFORM_RATE_LIMITS[p]);
      this.minuteTokens.set(p, PLATFORM_RATE_LIMITS[p].requestsPerMinute);
      this.hourTokens.set(p, PLATFORM_RATE_LIMITS[p].requestsPerHour);
      this.lastMinuteRefill.set(p, Date.now());
      this.lastHourRefill.set(p, Date.now());
    });
  }

  /**
   * Check if a request is allowed for a platform
   * @param platform The platform to check
   * @returns true if request is allowed, false if rate limited
   */
  canRequest(platform: Platform): boolean {
    this.refillTokens(platform);
    const minuteLimit = this.limits.get(platform)!.requestsPerMinute;
    const hourLimit = this.limits.get(platform)!.requestsPerHour;
    const currentMinuteTokens = this.minuteTokens.get(platform) ?? 0;
    const currentHourTokens = this.hourTokens.get(platform) ?? 0;

    return currentMinuteTokens > 0 && currentHourTokens > 0;
  }

  /**
   * Acquire a token for a platform (blocks if rate limited)
   * @param platform The platform to acquire token for
   * @returns Promise that resolves when token is acquired
   */
  async acquire(platform: Platform): Promise<void> {
    while (!this.canRequest(platform)) {
      await this.waitForRefill(platform);
    }
    this.consumeToken(platform);
  }

  /**
   * Try to acquire a token without waiting
   * @param platform The platform to acquire token for
   * @returns true if token was acquired, false if rate limited
   */
  tryAcquire(platform: Platform): boolean {
    if (!this.canRequest(platform)) {
      return false;
    }
    this.consumeToken(platform);
    return true;
  }

  /**
   * Get remaining tokens for a platform
   * @param platform The platform to check
   * @returns Object with minute and hour remaining tokens
   */
  getRemainingTokens(platform: Platform): { minute: number; hour: number } {
    this.refillTokens(platform);
    return {
      minute: this.minuteTokens.get(platform) ?? 0,
      hour: this.hourTokens.get(platform) ?? 0,
    };
  }

  /**
   * Get time until next refill for a platform
   * @param platform The platform to check
   * @returns Time in milliseconds until next minute refill
   */
  getTimeUntilRefill(platform: Platform): number {
    const lastRefill = this.lastMinuteRefill.get(platform) ?? Date.now();
    const minuteLimit = this.limits.get(platform)!.requestsPerMinute;
    const elapsed = Date.now() - lastRefill;
    const minuteInMs = 60 * 1000;
    const timeUntilRefill = minuteInMs - (elapsed % minuteInMs);
    return Math.max(0, timeUntilRefill);
  }

  /**
   * Reset rate limiter for a platform
   * @param platform The platform to reset
   */
  reset(platform: Platform): void {
    const limit = this.limits.get(platform);
    if (limit) {
      this.minuteTokens.set(platform, limit.requestsPerMinute);
      this.hourTokens.set(platform, limit.requestsPerHour);
      this.lastMinuteRefill.set(platform, Date.now());
      this.lastHourRefill.set(platform, Date.now());
    }
  }

  /**
   * Reset all rate limiters
   */
  resetAll(): void {
    Object.keys(PLATFORM_RATE_LIMITS).forEach((platform) => {
      this.reset(platform as Platform);
    });
  }

  /**
   * Get rate limit configuration for a platform
   * @param platform The platform to get config for
   * @returns Rate limit configuration
   */
  getConfig(platform: Platform): RateLimitConfig {
    return this.limits.get(platform) ?? PLATFORM_RATE_LIMITS[platform];
  }

  private refillTokens(platform: Platform): void {
    const now = Date.now();
    const limit = this.limits.get(platform);
    if (!limit) return;

    // Refill minute tokens
    const lastMinute = this.lastMinuteRefill.get(platform) ?? now;
    const minuteInMs = 60 * 1000;
    const elapsedMinutes = Math.floor((now - lastMinute) / minuteInMs);
    if (elapsedMinutes > 0) {
      const tokensToAdd = Math.min(
        elapsedMinutes * limit.requestsPerMinute,
        limit.requestsPerMinute
      );
      const current = this.minuteTokens.get(platform) ?? 0;
      this.minuteTokens.set(platform, Math.min(
        current + tokensToAdd,
        limit.requestsPerMinute
      ));
      this.lastMinuteRefill.set(platform, now);
    }

    // Refill hour tokens
    const lastHour = this.lastHourRefill.get(platform) ?? now;
    const hourInMs = 60 * 60 * 1000;
    const elapsedHours = Math.floor((now - lastHour) / hourInMs);
    if (elapsedHours > 0) {
      const tokensToAdd = Math.min(
        elapsedHours * limit.requestsPerHour,
        limit.requestsPerHour
      );
      const current = this.hourTokens.get(platform) ?? 0;
      this.hourTokens.set(platform, Math.min(
        current + tokensToAdd,
        limit.requestsPerHour
      ));
      this.lastHourRefill.set(platform, now);
    }
  }

  private consumeToken(platform: Platform): void {
    this.refillTokens(platform);
    const minuteTokens = this.minuteTokens.get(platform) ?? 0;
    const hourTokens = this.hourTokens.get(platform) ?? 0;
    this.minuteTokens.set(platform, Math.max(0, minuteTokens - 1));
    this.hourTokens.set(platform, Math.max(0, hourTokens - 1));
  }

  private async waitForRefill(platform: Platform): Promise<void> {
    const waitTime = this.getTimeUntilRefill(platform);
    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Global rate limiter instance
 */
export const rateLimiter = new RateLimiter();

/**
 * Create a rate-limited function wrapper
 * @param platform The platform for rate limiting
 * @param fn The function to wrap
 * @returns Rate-limited version of the function
 */
export function rateLimited<T extends unknown[], R>(
  platform: Platform,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    await rateLimiter.acquire(platform);
    return fn(...args);
  };
}

/**
 * Check if a platform is currently rate limited
 * @param platform The platform to check
 * @returns true if rate limited
 */
export function isRateLimited(platform: Platform): boolean {
  return !rateLimiter.canRequest(platform);
}

/**
 * Get rate limit status for all platforms
 * @returns Object with rate limit status for each platform
 */
export function getRateLimitStatus(): Record<Platform, { remaining: { minute: number; hour: number }; limited: boolean }> {
  const status: Record<Platform, { remaining: { minute: number; hour: number }; limited: boolean }> = {} as any;
  
  Object.keys(PLATFORM_RATE_LIMITS).forEach((platform) => {
    const p = platform as Platform;
    const remaining = rateLimiter.getRemainingTokens(p);
    status[p] = {
      remaining,
      limited: !rateLimiter.canRequest(p),
    };
  });
  
  return status;
}
