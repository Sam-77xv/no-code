/**
 * Analytics service for ClipForge
 * Tracks and retrieves upload analytics from platforms
 */

import axios, { AxiosInstance } from 'axios';
import { Platform, UploadAnalytics, Job, UploadResult } from '@clipforge/shared';
import { tokenStorage } from '../auth/token.storage';
import { rateLimiter } from '../utils/rate.limiter';
import { retryWithPlatform } from '../utils/retry.handler';
import { ClipForgeError, ERROR_CODES } from '../utils/error.handler';

interface PlatformAnalyticsConfig {
  baseUrl: string;
  insightsEndpoint: string;
  authHeader: (token: string) => Record<string, string>;
  supportsAnalytics: boolean;
  metrics: string[];
}

/**
 * Platform-specific analytics configurations
 */
const PLATFORM_ANALYTICS_CONFIGS: Record<Platform, PlatformAnalyticsConfig> = {
  youtube: {
    baseUrl: 'https://www.googleapis.com',
    insightsEndpoint: '/youtube/v3/videos',
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
    supportsAnalytics: true,
    metrics: ['views', 'likes', 'comments', 'shares', 'engagementRate'],
  },
  tiktok: {
    baseUrl: 'https://open-api.tiktok.com',
    insightsEndpoint: '/api/v1/video/analytics',
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
    supportsAnalytics: true,
    metrics: ['views', 'likes', 'comments', 'shares', 'engagementRate'],
  },
  instagram: {
    baseUrl: 'https://graph.instagram.com',
    insightsEndpoint: '/v18.0/{ig-media-id}/insights',
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
    supportsAnalytics: true,
    metrics: ['impressions', 'reach', 'saves', 'comments', 'likes', 'shares'],
  },
  facebook: {
    baseUrl: 'https://graph.facebook.com',
    insightsEndpoint: '/v18.0/{video-id}/insights',
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
    supportsAnalytics: true,
    metrics: ['views', 'likes', 'comments', 'shares', 'engagementRate'],
  },
  twitter: {
    baseUrl: 'https://api.twitter.com',
    insightsEndpoint: '/2/tweets/{tweet-id}/metrics',
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
    supportsAnalytics: true,
    metrics: ['impressions', 'retweets', 'replies', 'likes', 'quotes'],
  },
  linkedin: {
    baseUrl: 'https://api.linkedin.com',
    insightsEndpoint: '/v2/ugcPosts/{post-id}/analytics',
    authHeader: (token: string) => ({
      Authorization: `Bearer ${token}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'Linkedin-Version': '202408',
    }),
    supportsAnalytics: true,
    metrics: ['views', 'likes', 'comments', 'shares'],
  },
  threads: {
    baseUrl: 'https://www.threads.net',
    insightsEndpoint: '/api/graphql',
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
    supportsAnalytics: false,
    metrics: [],
  },
  snapchat: {
    baseUrl: 'https://api.snapchat.com',
    insightsEndpoint: '/v1/stories/{story-id}/metrics',
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
    supportsAnalytics: false,
    metrics: [],
  },
  pinterest: {
    baseUrl: 'https://api.pinterest.com',
    insightsEndpoint: '/v5/pins/{pin-id}/analytics',
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
    supportsAnalytics: true,
    metrics: ['impressions', 'saves', 'clicks', 'engagement'],
  },
};

/**
 * Analytics data storage (in-memory cache)
 * In production, this would be replaced with a database
 */
class AnalyticsCache {
  private data: Map<string, UploadAnalytics[]> = new Map();

  async get(jobId: string): Promise<UploadAnalytics[]> {
    return this.data.get(jobId) ?? [];
  }

  async set(jobId: string, analytics: UploadAnalytics[]): Promise<void> {
    this.data.set(jobId, analytics);
  }

  async add(jobId: string, analytics: UploadAnalytics): Promise<void> {
    const existing = this.data.get(jobId) ?? [];
    existing.push(analytics);
    this.data.set(jobId, existing);
  }

  async getByPlatform(platform: Platform): Promise<UploadAnalytics[]> {
    const allAnalytics: UploadAnalytics[] = [];
    this.data.forEach((analytics) => {
      allAnalytics.push(...analytics.filter(a => a.platform === platform));
    });
    return allAnalytics;
  }

  async getAll(): Promise<UploadAnalytics[]> {
    const allAnalytics: UploadAnalytics[] = [];
    this.data.forEach((analytics) => {
      allAnalytics.push(...analytics);
    });
    return allAnalytics;
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async clearJob(jobId: string): Promise<void> {
    this.data.delete(jobId);
  }
}

/**
 * Analytics Service
 * Manages fetching, storing, and aggregating analytics from platforms
 */
export class AnalyticsService {
  private cache: AnalyticsCache;
  private httpClients: Map<Platform, AxiosInstance> = new Map();

  constructor() {
    this.cache = new AnalyticsCache();
    this.initializeHttpClients();
  }

  private initializeHttpClients(): void {
    Object.keys(PLATFORM_ANALYTICS_CONFIGS).forEach((platform) => {
      const p = platform as Platform;
      const config = PLATFORM_ANALYTICS_CONFIGS[p];
      const client = axios.create({
        baseURL: config.baseUrl,
        timeout: 30000,
      });
      this.httpClients.set(p, client);
    });
  }

  /**
   * Fetch analytics for a specific upload
   * @param jobId Job ID
   * @param platform Platform to fetch analytics from
   * @param videoId Video ID on the platform
   * @returns Upload analytics data
   */
  async fetchUploadAnalytics(
    jobId: string,
    platform: Platform,
    videoId: string
  ): Promise<UploadAnalytics> {
    const config = PLATFORM_ANALYTICS_CONFIGS[platform];
    
    if (!config.supportsAnalytics) {
      throw new ClipForgeError(
        `Analytics not supported for ${platform}`,
        ERROR_CODES.PLATFORM_UNSUPPORTED,
        platform
      );
    }

    try {
      const token = await tokenStorage.getToken(platform);
      if (!token) {
        throw new ClipForgeError(
          `No access token for ${platform}`,
          ERROR_CODES.PLATFORM_AUTH_FAILED,
          platform
        );
      }

      const endpoint = config.insightsEndpoint.replace('{ig-media-id}', videoId)
        .replace('{video-id}', videoId)
        .replace('{tweet-id}', videoId)
        .replace('{post-id}', videoId)
        .replace('{pin-id}', videoId)
        .replace('{story-id}', videoId);

      const response = await retryWithPlatform(
        platform,
        async () => {
          await rateLimiter.acquire(platform);
          return this.httpClients.get(platform)!.get(endpoint, {
            headers: config.authHeader(token.accessToken),
          });
        }
      );

      const analytics = this.parsePlatformAnalytics(platform, response.data, videoId);
      await this.cache.add(jobId, analytics);
      
      return analytics;
    } catch (error) {
      throw new ClipForgeError(
        `Failed to fetch analytics for ${platform}: ${error}`,
        ERROR_CODES.PLATFORM_API_ERROR,
        platform,
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Get analytics for a job
   * @param jobId Job ID
   * @returns Array of analytics for all uploads in the job
   */
  async getJobAnalytics(jobId: string): Promise<UploadAnalytics[]> {
    return this.cache.get(jobId);
  }

  /**
   * Get analytics for a specific platform
   * @param platform Platform to get analytics for
   * @returns Array of analytics for the platform
   */
  async getPlatformAnalytics(platform: Platform): Promise<UploadAnalytics[]> {
    return this.cache.getByPlatform(platform);
  }

  /**
   * Get all analytics
   * @returns Array of all analytics
   */
  async getAllAnalytics(): Promise<UploadAnalytics[]> {
    return this.cache.getAll();
  }

  /**
   * Get aggregated analytics across all platforms
   * @returns Aggregated analytics data
   */
  async getAggregatedAnalytics(): Promise<{
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalEngagement: number;
    byPlatform: Record<Platform, {
      views: number;
      likes: number;
      comments: number;
      shares: number;
      engagement: number;
      uploadCount: number;
    }>;
    recentJobs: UploadAnalytics[];
  }> {
    const allAnalytics = await this.cache.getAll();
    
    const aggregated: {
      totalViews: number;
      totalLikes: number;
      totalComments: number;
      totalShares: number;
      totalEngagement: number;
      byPlatform: Record<Platform, {
        views: number;
        likes: number;
        comments: number;
        shares: number;
        engagement: number;
        uploadCount: number;
      }>;
      recentJobs: UploadAnalytics[];
    } = {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalEngagement: 0,
      byPlatform: {
        youtube: { views: 0, likes: 0, comments: 0, shares: 0, engagement: 0, uploadCount: 0 },
        tiktok: { views: 0, likes: 0, comments: 0, shares: 0, engagement: 0, uploadCount: 0 },
        instagram: { views: 0, likes: 0, comments: 0, shares: 0, engagement: 0, uploadCount: 0 },
        facebook: { views: 0, likes: 0, comments: 0, shares: 0, engagement: 0, uploadCount: 0 },
        twitter: { views: 0, likes: 0, comments: 0, shares: 0, engagement: 0, uploadCount: 0 },
        linkedin: { views: 0, likes: 0, comments: 0, shares: 0, engagement: 0, uploadCount: 0 },
        threads: { views: 0, likes: 0, comments: 0, shares: 0, engagement: 0, uploadCount: 0 },
        snapchat: { views: 0, likes: 0, comments: 0, shares: 0, engagement: 0, uploadCount: 0 },
        pinterest: { views: 0, likes: 0, comments: 0, shares: 0, engagement: 0, uploadCount: 0 },
      },
      recentJobs: [],
    };

    // Sort by timestamp (newest first) and take top 10
    const sortedAnalytics = [...allAnalytics].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
    aggregated.recentJobs = sortedAnalytics.slice(0, 10);

    for (const analytics of allAnalytics) {
      aggregated.totalViews += analytics.views;
      aggregated.totalLikes += analytics.likes;
      aggregated.totalComments += analytics.comments;
      aggregated.totalShares += analytics.shares;
      aggregated.totalEngagement += analytics.engagementRate;

      const platformData = aggregated.byPlatform[analytics.platform];
      if (platformData) {
        platformData.views += analytics.views;
        platformData.likes += analytics.likes;
        platformData.comments += analytics.comments;
        platformData.shares += analytics.shares;
        platformData.engagement += analytics.engagementRate;
        platformData.uploadCount += 1;
      }
    }

    return aggregated;
  }

  /**
   * Get analytics trend over time
   * @param platform Optional platform filter
   * @param days Number of days to look back
   * @returns Time series analytics data
   */
  async getAnalyticsTrend(
    platform?: Platform,
    days: number = 30
  ): Promise<{
    dates: string[];
    views: number[];
    likes: number[];
    engagement: number[];
  }> {
    const allAnalytics = await this.cache.getAll();
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const filteredAnalytics = allAnalytics.filter((a) => {
      if (platform && a.platform !== platform) return false;
      return a.timestamp >= startDate;
    });

    // Group by date
    const dailyData: Map<string, { views: number; likes: number; engagement: number }> = new Map();
    
    filteredAnalytics.forEach((a) => {
      const dateStr = a.timestamp.toISOString().split('T')[0];
      const existing = dailyData.get(dateStr) ?? { views: 0, likes: 0, engagement: 0 };
      existing.views += a.views;
      existing.likes += a.likes;
      existing.engagement += a.engagementRate;
      dailyData.set(dateStr, existing);
    });

    // Generate date range
    const dates: string[] = [];
    const views: number[] = [];
    const likes: number[] = [];
    const engagement: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);
      const data = dailyData.get(dateStr) ?? { views: 0, likes: 0, engagement: 0 };
      views.push(data.views);
      likes.push(data.likes);
      engagement.push(data.engagement);
    }

    return { dates, views, likes, engagement };
  }

  /**
   * Get top performing jobs
   * @param limit Number of top jobs to return
   * @param sortBy Metric to sort by
   * @returns Array of top performing jobs with analytics
   */
  async getTopJobs(
    limit: number = 10,
    sortBy: 'views' | 'likes' | 'comments' | 'shares' | 'engagementRate' = 'views'
  ): Promise<{
    jobId: string;
    videoId: string;
    platform: Platform;
    analytics: UploadAnalytics;
  }[]> {
    const allAnalytics = await this.cache.getAll();
    
    return allAnalytics
      .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))
      .slice(0, limit)
      .map((a) => ({
        jobId: a.jobId,
        videoId: a.videoId,
        platform: a.platform,
        analytics: a,
      }));
  }

  /**
   * Update analytics for a job from upload results
   * @param job Job data
   * @param results Upload results
   */
  async updateJobAnalytics(job: Job, results: UploadResult[]): Promise<void> {
    const now = new Date();
    
    for (const result of results) {
      if (result.success && result.videoId) {
        const analytics: UploadAnalytics = {
          id: `${job.id}_${result.platform}_${result.videoId}`,
          jobId: job.id,
          platform: result.platform,
          videoId: result.videoId,
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          engagementRate: 0,
          timestamp: now,
        };
        await this.cache.add(job.id, analytics);
      }
    }
  }

  /**
   * Clear analytics for a job
   * @param jobId Job ID
   */
  async clearJobAnalytics(jobId: string): Promise<void> {
    await this.cache.clearJob(jobId);
  }

  /**
   * Clear all analytics
   */
  async clearAllAnalytics(): Promise<void> {
    await this.cache.clear();
  }

  /**
   * Parse platform-specific analytics response
   * @param platform Platform
   * @param response Platform API response
   * @param videoId Video ID
   * @returns Normalized analytics data
   */
  private parsePlatformAnalytics(
    platform: Platform,
    response: unknown,
    videoId: string
  ): UploadAnalytics {
    const now = new Date();

    // Default analytics
    let analytics: UploadAnalytics = {
      id: `${Date.now()}_${platform}_${videoId}`,
      jobId: '',
      platform,
      videoId,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      engagementRate: 0,
      timestamp: now,
    };

    try {
      const data = response as Record<string, unknown>;

      switch (platform) {
        case 'youtube':
          analytics.views = Number(data.items?.[0]?.statistics?.viewCount || 0);
          analytics.likes = Number(data.items?.[0]?.statistics?.likeCount || 0);
          analytics.comments = Number(data.items?.[0]?.statistics?.commentCount || 0);
          analytics.shares = 0; // YouTube doesn't expose shares directly
          analytics.engagementRate = analytics.views > 0
            ? (analytics.likes + analytics.comments) / analytics.views
            : 0;
          break;

        case 'tiktok':
          analytics.views = Number(data.video?.play_count || data.play_count || 0);
          analytics.likes = Number(data.video?.digg_count || data.digg_count || 0);
          analytics.comments = Number(data.video?.comment_count || data.comment_count || 0);
          analytics.shares = Number(data.video?.share_count || data.share_count || 0);
          analytics.engagementRate = analytics.views > 0
            ? (analytics.likes + analytics.comments + analytics.shares) / analytics.views
            : 0;
          break;

        case 'instagram':
          analytics.views = Number(data.impressions || 0);
          analytics.likes = Number(data.likes || 0);
          analytics.comments = Number(data.comments || 0);
          analytics.shares = Number(data.shares || 0);
          analytics.engagementRate = analytics.views > 0
            ? (analytics.likes + analytics.comments + analytics.shares) / analytics.views
            : 0;
          break;

        case 'facebook':
          analytics.views = Number(data.views || 0);
          analytics.likes = Number(data.reactions?.like || data.likes || 0);
          analytics.comments = Number(data.comments || 0);
          analytics.shares = Number(data.shares || 0);
          analytics.engagementRate = analytics.views > 0
            ? (analytics.likes + analytics.comments + analytics.shares) / analytics.views
            : 0;
          break;

        case 'twitter':
          analytics.views = Number(data.data?.[0]?.public_metrics?.impression_count || 0);
          analytics.likes = Number(data.data?.[0]?.public_metrics?.like_count || 0);
          analytics.comments = Number(data.data?.[0]?.public_metrics?.reply_count || 0);
          analytics.shares = Number(data.data?.[0]?.public_metrics?.retweet_count || 0);
          analytics.engagementRate = analytics.views > 0
            ? (analytics.likes + analytics.comments + analytics.shares) / analytics.views
            : 0;
          break;

        case 'linkedin':
          analytics.views = Number(data.views || 0);
          analytics.likes = Number(data.likes || 0);
          analytics.comments = Number(data.comments || 0);
          analytics.shares = Number(data.shares || 0);
          analytics.engagementRate = analytics.views > 0
            ? (analytics.likes + analytics.comments + analytics.shares) / analytics.views
            : 0;
          break;

        case 'pinterest':
          analytics.views = Number(data.impressions || 0);
          analytics.likes = Number(data.saves || 0);
          analytics.comments = Number(data.comments || 0);
          analytics.shares = Number(data.pin_clicks || 0);
          analytics.engagementRate = analytics.views > 0
            ? (analytics.likes + analytics.comments + analytics.shares) / analytics.views
            : 0;
          break;

        default:
          // For platforms without analytics support, return default
          break;
      }
    } catch {
      // If parsing fails, return default analytics
    }

    return analytics;
  }

  /**
   * Check if analytics are supported for a platform
   * @param platform Platform to check
   * @returns true if analytics are supported
   */
  supportsAnalytics(platform: Platform): boolean {
    return PLATFORM_ANALYTICS_CONFIGS[platform].supportsAnalytics;
  }

  /**
   * Get supported platforms for analytics
   * @returns Array of platforms that support analytics
   */
  getSupportedPlatforms(): Platform[] {
    return Object.entries(PLATFORM_ANALYTICS_CONFIGS)
      .filter(([_, config]) => config.supportsAnalytics)
      .map(([platform]) => platform as Platform);
  }
}

/**
 * Global analytics service instance
 */
export const analyticsService = new AnalyticsService();
