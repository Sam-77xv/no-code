/**
 * URL utilities for ClipForge
 * Handles URL parsing, validation, and extraction
 */

import { URL } from 'url';

/**
 * Supported video platforms and their URL patterns
 */
const PLATFORM_URL_PATTERNS: Record<string, RegExp[]> = {
  youtube: [
    /^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/,
    /^https?:\/\/youtu\.be\//,
  ],
  tiktok: [
    /^https?:\/\/(?:www\.)?(?:tiktok\.com|douyin\.com)/,
    /^https?:\/\/vm\.tiktok\.com\//,
  ],
  instagram: [
    /^https?:\/\/(?:www\.)?instagram\.com/,
    /^https?:\/\/instagr\.am\//,
  ],
  facebook: [
    /^https?:\/\/(?:www\.)?facebook\.com/,
    /^https?:\/\/fb\.watch\//,
    /^https?:\/\/m\.facebook\.com\//,
  ],
  twitter: [
    /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)/,
    /^https?:\/\/mobile\.twitter\.com\//,
  ],
  linkedin: [
    /^https?:\/\/(?:www\.)?linkedin\.com/,
  ],
  threads: [
    /^https?:\/\/(?:www\.)?threads\.net/,
  ],
  snapchat: [
    /^https?:\/\/(?:www\.)?snapchat\.com/,
  ],
  pinterest: [
    /^https?:\/\/(?:www\.)?pinterest\.com/,
    /^https?:\/\/pin\.it\//,
  ],
  vimeo: [
    /^https?:\/\/(?:www\.)?vimeo\.com/,
  ],
  twitch: [
    /^https?:\/\/(?:www\.)?twitch\.tv/,
  ],
  reddit: [
    /^https?:\/\/(?:www\.)?reddit\.com/,
    /^https?:\/\/v\.redd\.it\//,
  ],
  dailymotion: [
    /^https?:\/\/(?:www\.)?dailymotion\.com/,
  ],
  rumble: [
    /^https?:\/\/(?:www\.)?rumble\.com/,
  ],
  // Generic patterns
  generic: [
    /^https?:\/\//,
  ],
};

/**
 * Extract video ID from URL
 * @param url Video URL
 * @returns Extracted video ID or null
 */
export function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // YouTube
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      if (hostname.includes('youtu.be')) {
        return parsed.pathname.substring(1);
      }
      const videoId = parsed.searchParams.get('v') || 
                     parsed.pathname.split('/').pop();
      if (videoId && videoId.length >= 11) {
        return videoId;
      }
    }

    // TikTok
    if (hostname.includes('tiktok.com') || hostname.includes('douyin.com')) {
      const pathParts = parsed.pathname.split('/');
      const videoPart = pathParts.find(p => p && !p.startsWith('@'));
      if (videoPart) {
        return videoPart;
      }
    }

    // Instagram
    if (hostname.includes('instagram.com')) {
      const pathParts = parsed.pathname.split('/');
      const videoPart = pathParts.find(p => p && p.startsWith('p') || p.startsWith('reel'));
      if (videoPart) {
        return videoPart;
      }
    }

    // Facebook
    if (hostname.includes('facebook.com') || hostname.includes('fb.watch')) {
      const pathParts = parsed.pathname.split('/');
      const videoPart = pathParts.find(p => p && p.length >= 10);
      if (videoPart) {
        return videoPart;
      }
    }

    // Twitter/X
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      const pathParts = parsed.pathname.split('/');
      const videoPart = pathParts.find(p => p && p.startsWith('status'));
      if (videoPart) {
        return videoPart;
      }
    }

    // Default: use last path segment
    const lastSegment = parsed.pathname.split('/').pop();
    if (lastSegment && !lastSegment.includes('.')) {
      return lastSegment;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Detect platform from URL
 * @param url Video URL
 * @returns Detected platform name or null
 */
export function detectPlatform(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    for (const [platform, patterns] of Object.entries(PLATFORM_URL_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(hostname) || pattern.test(url)) {
          return platform;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validate a URL
 * @param url URL to validate
 * @returns true if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalize a URL (remove tracking params, etc.)
 * @param url URL to normalize
 * @returns Normalized URL
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    
    // Remove common tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'gclid', 'fbclid', 'mc_cid', 'mc_eid',
      'ref', 'referrer', 'referral',
      'track', 'tracking',
      'click_id', 'clickid',
      'affiliate', 'aff',
      'sub_id', 'subid',
      'campaign', 'campaign_id',
      'source', 'src',
      'medium',
    ];

    trackingParams.forEach(param => {
      parsed.searchParams.delete(param);
    });

    // Remove fragment
    parsed.hash = '';

    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Check if URL is from a supported platform
 * @param url URL to check
 * @returns true if URL is from a supported platform
 */
export function isSupportedPlatformUrl(url: string): boolean {
  const platform = detectPlatform(url);
  return platform !== null && platform !== 'generic';
}

/**
 * Extract domain from URL
 * @param url URL to extract domain from
 * @returns Domain name
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Extract path from URL
 * @param url URL to extract path from
 * @returns Path string
 */
export function extractPath(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname;
  } catch {
    return '';
  }
}

/**
 * Extract query parameters from URL
 * @param url URL to extract query from
 * @returns Query parameters as object
 */
export function extractQueryParams(url: string): Record<string, string> {
  try {
    const parsed = new URL(url);
    const params: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch {
    return {};
  }
}

/**
 * Get the base URL (protocol + hostname)
 * @param url URL to process
 * @returns Base URL
 */
export function getBaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return '';
  }
}

/**
 * Check if URL uses HTTPS
 * @param url URL to check
 * @returns true if URL uses HTTPS
 */
export function isHttps(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Convert URL to HTTPS
 * @param url URL to convert
 * @returns URL with HTTPS protocol
 */
export function toHttps(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.protocol = 'https:';
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Check if URL is a short URL
 * @param url URL to check
 * @returns true if URL appears to be a short URL
 */
export function isShortUrl(url: string): boolean {
  const shortDomains = [
    'bit.ly', 'goo.gl', 'tinyurl.com', 'ow.ly', 't.co',
    'is.gd', 'buff.ly', 'adf.ly', 'j.mp', 'bc.vc',
    'youtu.be', 'tikz.to', 'viralurl.com', 'scrnch.me',
  ];

  try {
    const domain = extractDomain(url);
    return shortDomains.some(d => domain.includes(d));
  } catch {
    return false;
  }
}

/**
 * Check if URL is a direct video URL (ends with video extension)
 * @param url URL to check
 * @returns true if URL appears to be a direct video URL
 */
export function isDirectVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv', '.mpeg', '.3gp'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.endsWith(ext));
}

/**
 * Parse URL and extract all components
 * @param url URL to parse
 * @returns Parsed URL components
 */
export function parseUrl(url: string): {
  protocol: string;
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
  port: string;
  query: Record<string, string>;
} | null {
  try {
    const parsed = new URL(url);
    const query: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    return {
      protocol: parsed.protocol.replace(':', ''),
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
      port: parsed.port,
      query,
    };
  } catch {
    return null;
  }
}

/**
 * Check if URL is from YouTube
 * @param url URL to check
 * @returns true if URL is from YouTube
 */
export function isYouTubeUrl(url: string): boolean {
  return detectPlatform(url) === 'youtube';
}

/**
 * Check if URL is from TikTok
 * @param url URL to check
 * @returns true if URL is from TikTok
 */
export function isTikTokUrl(url: string): boolean {
  return detectPlatform(url) === 'tiktok';
}

/**
 * Check if URL is from Instagram
 * @param url URL to check
 * @returns true if URL is from Instagram
 */
export function isInstagramUrl(url: string): boolean {
  return detectPlatform(url) === 'instagram';
}

/**
 * Check if URL is from Facebook
 * @param url URL to check
 * @returns true if URL is from Facebook
 */
export function isFacebookUrl(url: string): boolean {
  return detectPlatform(url) === 'facebook';
}

/**
 * Check if URL is from Twitter/X
 * @param url URL to check
 * @returns true if URL is from Twitter/X
 */
export function isTwitterUrl(url: string): boolean {
  return detectPlatform(url) === 'twitter';
}
