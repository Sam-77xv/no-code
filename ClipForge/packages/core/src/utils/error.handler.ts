/**
 * Error handling utilities for ClipForge
 */

import { Platform } from '@clipforge/shared';

/**
 * Custom error class for ClipForge
 */
export class ClipForgeError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly platform?: Platform,
    public readonly details?: Record<string, unknown>,
    public readonly isRetryable: boolean = false,
    public readonly isFatal: boolean = false
  ) {
    super(message);
    this.name = 'ClipForgeError';
  }
}

/**
 * Platform-specific error codes
 */
export const ERROR_CODES = {
  // General errors
  UNKNOWN: 'CF_001',
  VALIDATION: 'CF_002',
  NETWORK: 'CF_003',
  TIMEOUT: 'CF_004',
  RATE_LIMIT: 'CF_005',
  AUTHENTICATION: 'CF_006',
  AUTHORIZATION: 'CF_007',
  NOT_FOUND: 'CF_008',
  CONFLICT: 'CF_009',
  INVALID_REQUEST: 'CF_010',

  // Platform-specific errors
  PLATFORM_UNSUPPORTED: 'CF_100',
  PLATFORM_AUTH_FAILED: 'CF_101',
  PLATFORM_TOKEN_EXPIRED: 'CF_102',
  PLATFORM_API_ERROR: 'CF_103',
  PLATFORM_RATE_LIMITED: 'CF_104',
  PLATFORM_FILE_TOO_LARGE: 'CF_105',
  PLATFORM_UNSUPPORTED_FORMAT: 'CF_106',
  PLATFORM_UPLOAD_FAILED: 'CF_107',

  // Video processing errors
  VIDEO_DOWNLOAD_FAILED: 'CF_200',
  VIDEO_PROCESSING_FAILED: 'CF_201',
  VIDEO_FORMAT_NOT_SUPPORTED: 'CF_202',
  VIDEO_TOO_LARGE: 'CF_203',
  VIDEO_DURATION_TOO_LONG: 'CF_204',
  VIDEO_URL_INVALID: 'CF_205',

  // Queue errors
  QUEUE_FULL: 'CF_300',
  QUEUE_ERROR: 'CF_301',
  JOB_NOT_FOUND: 'CF_302',
  JOB_ALREADY_PROCESSING: 'CF_303',

  // Storage errors
  STORAGE_ERROR: 'CF_400',
  STORAGE_FULL: 'CF_401',
  STORAGE_NOT_FOUND: 'CF_402',

  // AI errors
  AI_GENERATION_FAILED: 'CF_500',
  AI_TOKEN_LIMIT: 'CF_501',
  AI_MODEL_NOT_AVAILABLE: 'CF_502',
};

/**
 * Platform-specific error messages
 */
export const PLATFORM_ERRORS: Record<Platform, {
  authFailed: string;
  tokenExpired: string;
  rateLimited: string;
  fileTooLarge: string;
  unsupportedFormat: string;
  uploadFailed: string;
}> = {
  youtube: {
    authFailed: 'YouTube authentication failed. Please check your OAuth credentials.',
    tokenExpired: 'YouTube access token expired. Please refresh your token.',
    rateLimited: 'YouTube API rate limit exceeded. Please wait and try again.',
    fileTooLarge: 'Video file is too large for YouTube. Maximum size: 256MB.',
    unsupportedFormat: 'Unsupported video format for YouTube. Supported: MP4, MOV, AVI, WEBM, MPEG.',
    uploadFailed: 'Failed to upload to YouTube. Please check the video and try again.',
  },
  tiktok: {
    authFailed: 'TikTok authentication failed. Please check your API credentials.',
    tokenExpired: 'TikTok access token expired. Please refresh your token.',
    rateLimited: 'TikTok API rate limit exceeded. Please wait and try again.',
    fileTooLarge: 'Video file is too large for TikTok. Maximum size: 512MB.',
    unsupportedFormat: 'Unsupported video format for TikTok. Supported: MP4, MOV.',
    uploadFailed: 'Failed to upload to TikTok. Please check the video and try again.',
  },
  instagram: {
    authFailed: 'Instagram authentication failed. Please check your Facebook Developer credentials.',
    tokenExpired: 'Instagram access token expired. Please refresh your token.',
    rateLimited: 'Instagram API rate limit exceeded. Please wait and try again.',
    fileTooLarge: 'Video file is too large for Instagram. Maximum size: 4GB.',
    unsupportedFormat: 'Unsupported video format for Instagram. Supported: MP4, MOV.',
    uploadFailed: 'Failed to upload to Instagram. Please check the video and try again.',
  },
  facebook: {
    authFailed: 'Facebook authentication failed. Please check your Facebook Developer credentials.',
    tokenExpired: 'Facebook access token expired. Please refresh your token.',
    rateLimited: 'Facebook API rate limit exceeded. Please wait and try again.',
    fileTooLarge: 'Video file is too large for Facebook. Maximum size: 10GB.',
    unsupportedFormat: 'Unsupported video format for Facebook. Supported: MP4, MOV, AVI, WMV, FLV.',
    uploadFailed: 'Failed to upload to Facebook. Please check the video and try again.',
  },
  twitter: {
    authFailed: 'Twitter authentication failed. Please check your Twitter Developer credentials.',
    tokenExpired: 'Twitter access token expired. Please refresh your token.',
    rateLimited: 'Twitter API rate limit exceeded. Please wait and try again.',
    fileTooLarge: 'Video file is too large for Twitter. Maximum size: 512MB.',
    unsupportedFormat: 'Unsupported video format for Twitter. Supported: MP4, MOV.',
    uploadFailed: 'Failed to upload to Twitter. Please check the video and try again.',
  },
  linkedin: {
    authFailed: 'LinkedIn authentication failed. Please check your LinkedIn Developer credentials.',
    tokenExpired: 'LinkedIn access token expired. Please refresh your token.',
    rateLimited: 'LinkedIn API rate limit exceeded. Please wait and try again.',
    fileTooLarge: 'Video file is too large for LinkedIn. Maximum size: 100MB.',
    unsupportedFormat: 'Unsupported video format for LinkedIn. Supported: MP4.',
    uploadFailed: 'Failed to upload to LinkedIn. Please check the video and try again.',
  },
  threads: {
    authFailed: 'Threads authentication failed. Please check your credentials.',
    tokenExpired: 'Threads access token expired. Please refresh your token.',
    rateLimited: 'Threads API rate limit exceeded. Please wait and try again.',
    fileTooLarge: 'Video file is too large for Threads. Maximum size: 100MB.',
    unsupportedFormat: 'Unsupported video format for Threads. Supported: MP4, MOV.',
    uploadFailed: 'Failed to upload to Threads. Please check the video and try again.',
  },
  snapchat: {
    authFailed: 'Snapchat authentication failed. Please check your Snapchat Marketing API credentials.',
    tokenExpired: 'Snapchat access token expired. Please refresh your token.',
    rateLimited: 'Snapchat API rate limit exceeded. Please wait and try again.',
    fileTooLarge: 'Video file is too large for Snapchat. Maximum size: 1GB.',
    unsupportedFormat: 'Unsupported video format for Snapchat. Supported: MP4, MOV.',
    uploadFailed: 'Failed to upload to Snapchat. Please check the video and try again.',
  },
  pinterest: {
    authFailed: 'Pinterest authentication failed. Please check your Pinterest API credentials.',
    tokenExpired: 'Pinterest access token expired. Please refresh your token.',
    rateLimited: 'Pinterest API rate limit exceeded. Please wait and try again.',
    fileTooLarge: 'Video file is too large for Pinterest. Maximum size: 20MB.',
    unsupportedFormat: 'Unsupported video format for Pinterest. Supported: MP4, MOV.',
    uploadFailed: 'Failed to upload to Pinterest. Please check the video and try again.',
  },
};

/**
 * Create a ClipForge error
 */
export function createError(
  code: string,
  message: string,
  platform?: Platform,
  details?: Record<string, unknown>,
  isRetryable: boolean = false,
  isFatal: boolean = false
): ClipForgeError {
  return new ClipForgeError(message, code, platform, details, isRetryable, isFatal);
}

/**
 * Create a platform-specific error
 */
export function createPlatformError(
  platform: Platform,
  errorType: keyof (typeof PLATFORM_ERRORS)[Platform],
  details?: Record<string, unknown>
): ClipForgeError {
  const errors = PLATFORM_ERRORS[platform];
  const message = errors[errorType];
  
  const errorCodes: Record<keyof (typeof PLATFORM_ERRORS)[Platform], string> = {
    authFailed: ERROR_CODES.PLATFORM_AUTH_FAILED,
    tokenExpired: ERROR_CODES.PLATFORM_TOKEN_EXPIRED,
    rateLimited: ERROR_CODES.PLATFORM_RATE_LIMITED,
    fileTooLarge: ERROR_CODES.PLATFORM_FILE_TOO_LARGE,
    unsupportedFormat: ERROR_CODES.PLATFORM_UNSUPPORTED_FORMAT,
    uploadFailed: ERROR_CODES.PLATFORM_UPLOAD_FAILED,
  };

  return new ClipForgeError(
    message,
    errorCodes[errorType],
    platform,
    details,
    errorType === 'rateLimited' || errorType === 'tokenExpired',
    errorType === 'authFailed'
  );
}

/**
 * Handle API errors and convert to ClipForgeError
 */
export function handleApiError(
  error: unknown,
  platform?: Platform
): ClipForgeError {
  if (error instanceof ClipForgeError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Check for common error patterns
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return createPlatformError(platform || 'youtube', 'rateLimited', { originalMessage: error.message });
    }

    if (message.includes('unauthorized') || message.includes('401')) {
      return createPlatformError(platform || 'youtube', 'authFailed', { originalMessage: error.message });
    }

    if (message.includes('forbidden') || message.includes('403')) {
      return createPlatformError(platform || 'youtube', 'authFailed', { originalMessage: error.message });
    }

    if (message.includes('not found') || message.includes('404')) {
      return createError(
        ERROR_CODES.NOT_FOUND,
        `Resource not found: ${error.message}`,
        platform,
        { originalMessage: error.message }
      );
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return createError(
        ERROR_CODES.TIMEOUT,
        `Request timed out: ${error.message}`,
        platform,
        { originalMessage: error.message },
        true
      );
    }

    if (message.includes('network') || message.includes('fetch')) {
      return createError(
        ERROR_CODES.NETWORK,
        `Network error: ${error.message}`,
        platform,
        { originalMessage: error.message },
        true
      );
    }
  }

  // Default error
  return createError(
    ERROR_CODES.UNKNOWN,
    'An unexpected error occurred',
    platform,
    { originalError: error }
  );
}

/**
 * Error middleware for Express/Next.js API routes
 */
export function errorHandler(
  error: unknown,
  req?: Request,
  res?: Response
): { error: ClipForgeError } | Response {
  const clipForgeError = handleApiError(error);

  if (res) {
    // For Express/Next.js API routes
    return res.status(getHttpStatusCode(clipForgeError.code)).json({
      success: false,
      error: {
        code: clipForgeError.code,
        message: clipForgeError.message,
        platform: clipForgeError.platform,
        details: clipForgeError.details,
        isRetryable: clipForgeError.isRetryable,
        isFatal: clipForgeError.isFatal,
      },
    });
  }

  return { error: clipForgeError };
}

/**
 * Get HTTP status code from error code
 */
export function getHttpStatusCode(code: string): number {
  const statusCodes: Record<string, number> = {
    // 4xx Client Errors
    [ERROR_CODES.VALIDATION]: 400,
    [ERROR_CODES.INVALID_REQUEST]: 400,
    [ERROR_CODES.NOT_FOUND]: 404,
    [ERROR_CODES.AUTHENTICATION]: 401,
    [ERROR_CODES.AUTHORIZATION]: 403,
    [ERROR_CODES.CONFLICT]: 409,
    [ERROR_CODES.PLATFORM_UNSUPPORTED_FORMAT]: 400,
    [ERROR_CODES.PLATFORM_FILE_TOO_LARGE]: 413,

    // 4xx Platform Errors
    [ERROR_CODES.PLATFORM_AUTH_FAILED]: 401,
    [ERROR_CODES.PLATFORM_TOKEN_EXPIRED]: 401,
    [ERROR_CODES.PLATFORM_RATE_LIMITED]: 429,

    // 5xx Server Errors
    [ERROR_CODES.UNKNOWN]: 500,
    [ERROR_CODES.NETWORK]: 502,
    [ERROR_CODES.TIMEOUT]: 504,
    [ERROR_CODES.QUEUE_ERROR]: 500,
    [ERROR_CODES.STORAGE_ERROR]: 500,
    [ERROR_CODES.AI_GENERATION_FAILED]: 500,
    [ERROR_CODES.VIDEO_DOWNLOAD_FAILED]: 500,
    [ERROR_CODES.VIDEO_PROCESSING_FAILED]: 500,
    [ERROR_CODES.PLATFORM_UPLOAD_FAILED]: 500,
    [ERROR_CODES.PLATFORM_API_ERROR]: 500,

    // Default
    DEFAULT: 500,
  };

  return statusCodes[code] || statusCodes.DEFAULT;
}

/**
 * Format error for logging
 */
export function formatError(error: unknown): string {
  if (error instanceof ClipForgeError) {
    return `[${error.code}] ${error.message} (Platform: ${error.platform || 'N/A'}, Retryable: ${error.isRetryable})`;
  }

  if (error instanceof Error) {
    return `[UNKNOWN] ${error.message}`;
  }

  return `[UNKNOWN] ${String(error)}`;
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: unknown): boolean {
  if (error instanceof ClipForgeError) {
    return error.isRetryable;
  }
  return false;
}

/**
 * Check if error is fatal
 */
export function isFatal(error: unknown): boolean {
  if (error instanceof ClipForgeError) {
    return error.isFatal;
  }
  return false;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof ClipForgeError) {
    // Return platform-specific message if available
    if (error.platform && PLATFORM_ERRORS[error.platform]) {
      const platformErrors = PLATFORM_ERRORS[error.platform];
      for (const [key, message] of Object.entries(platformErrors)) {
        if (error.message.includes(message)) {
          return message;
        }
      }
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
