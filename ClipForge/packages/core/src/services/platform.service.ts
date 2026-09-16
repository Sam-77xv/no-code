import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import FormData from 'form-data';
import { createReadStream, existsSync } from 'fs';
import { Platform, Job, UploadResult, VideoInfo, UserAccount } from '@clipforge/shared';
import { tokenStorage } from '../auth/token.storage';
import { AIService } from './ai.service';

interface PlatformAPIConfig {
  baseUrl: string;
  uploadEndpoint: string;
  authHeader: (token: string) => Record<string, string>;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  maxFileSize: number; // in bytes
  supportedFormats: string[];
}

const PLATFORM_APIS: Record<Platform, PlatformAPIConfig> = {
  youtube: {
    baseUrl: 'https://www.googleapis.com',
    uploadEndpoint: '/upload/youtube/v3/videos',
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerHour: 10000,
    },
    maxFileSize: 256 * 1024 * 1024, // 256MB
    supportedFormats: ['mp4', 'mov', 'avi', 'webm', 'mpeg'],
  },
  tiktok: {
    baseUrl: 'https://open-api.tiktok.com',
    uploadEndpoint: '/api/v1/video/upload/',
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}`, 'x-access-token': token }),
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 5000,
    },
    maxFileSize: 512 * 1024 * 1024, // 512MB
    supportedFormats: ['mp4', 'mov'],
  },
  instagram: {
    baseUrl: 'https://graph.instagram.com',
    uploadEndpoint: '/v18.0/{ig-user-id}/media',
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
    rateLimit: {
      requestsPerMinute: 200,
      requestsPerHour: 10000,
    },
    maxFileSize: 4 * 1024 * 1024 * 1024, // 4GB
    supportedFormats: ['mp4', 'mov'],
  },
  facebook: {
    baseUrl: 'https://graph.facebook.com',
    uploadEndpoint: '/v18.0/{page-id}/videos',
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
    rateLimit: {
      requestsPerMinute: 200,
      requestsPerHour: 10000,
    },
    maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
    supportedFormats: ['mp4', 'mov', 'avi', 'wmv', 'flv'],
  },
  twitter: {
    baseUrl: 'https://api.twitter.com',
    uploadEndpoint: '/2/media/upload',
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
    rateLimit: {
      requestsPerMinute: 900,
      requestsPerHour: 15000,
    },
    maxFileSize: 512 * 1024 * 1024, // 512MB
    supportedFormats: ['mp4', 'mov'],
  },
  linkedin: {
    baseUrl: 'https://api.linkedin.com',
    uploadEndpoint: '/v2/ugcPosts',
    authHeader: (token: string) => ({
      Authorization: `Bearer ${token}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'Linkedin-Version': '202408',
    }),
    rateLimit: {
      requestsPerMinute: 50,
      requestsPerHour: 5000,
    },
    maxFileSize: 100 * 1024 * 1024, // 100MB
    supportedFormats: ['mp4'],
  },
  threads: {
    baseUrl: 'https://www.threads.net',
    uploadEndpoint: '/api/graphql',
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 5000,
    },
    maxFileSize: 100 * 1024 * 1024, // 100MB
    supportedFormats: ['mp4', 'mov'],
  },
  snapchat: {
    baseUrl: 'https://adsapi.snapchat.com',
    uploadEndpoint: '/api/v1/creatives',
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerHour: 10000,
    },
    maxFileSize: 1 * 1024 * 1024 * 1024, // 1GB
    supportedFormats: ['mp4', 'mov'],
  },
  pinterest: {
    baseUrl: 'https://api.pinterest.com',
    uploadEndpoint: '/v5/media',
    authHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 5000,
    },
    maxFileSize: 20 * 1024 * 1024, // 20MB
    supportedFormats: ['mp4', 'mov'],
  },
};

interface UploadOptions {
  videoPath: string;
  thumbnailPath?: string;
  title: string;
  description: string;
  hashtags?: string[];
  contentType?: string;
  scheduleTime?: Date;
  isPublic?: boolean;
}

export class PlatformService {
  private static rateLimitTrackers: Map<Platform, { lastRequest: number; count: number }> = new Map();

  private static async checkRateLimit(platform: Platform): Promise<boolean> {
    const config = PLATFORM_APIS[platform];
    const now = Date.now();
    const minuteAgo = now - 60000;
    const hourAgo = now - 3600000;

    let tracker = this.rateLimitTrackers.get(platform);
    if (!tracker) {
      tracker = { lastRequest: now, count: 0 };
      this.rateLimitTrackers.set(platform, tracker);
    }

    // Reset count if more than a minute has passed
    if (tracker.lastRequest < minuteAgo) {
      tracker.count = 0;
      tracker.lastRequest = now;
    }

    // Check minute limit
    if (tracker.count >= config.rateLimit.requestsPerMinute) {
      return false;
    }

    tracker.count++;
    return true;
  }

  private static async withExponentialBackoff<T>(
    fn: () => Promise<T>,
    platform: Platform,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check rate limit
        const canRequest = await this.checkRateLimit(platform);
        if (!canRequest) {
          // Wait and retry
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          console.warn(`Attempt ${attempt + 1} failed for ${platform}. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  static async uploadToPlatform(
    platform: Platform,
    accountId: string,
    videoPath: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      // Get access token
      const authService = (await import('./../auth/auth.service')).AuthService.getInstance(platform);
      const accessToken = await authService.getAccessToken(accountId);

      if (!accessToken) {
        return {
          platform,
          success: false,
          error: 'No access token available. Please authenticate first.',
        };
      }

      // Get account info
      const account = await tokenStorage.getAccount(platform, accountId);
      if (!account) {
        return {
          platform,
          success: false,
          error: 'Account not found',
        };
      }

      // Get platform config
      const config = PLATFORM_APIS[platform];

      // Check file size
      const fileSize = this.getFileSize(videoPath);
      if (fileSize > config.maxFileSize) {
        return {
          platform,
          success: false,
          error: `File too large. Max size: ${config.maxFileSize / (1024 * 1024)}MB`,
        };
      }

      // Check file format
      const fileFormat = videoPath.split('.').pop()?.toLowerCase();
      if (fileFormat && !config.supportedFormats.includes(fileFormat)) {
        return {
          platform,
          success: false,
          error: `Unsupported format: ${fileFormat}. Supported: ${config.supportedFormats.join(', ')}`,
        };
      }

      // Platform-specific upload
      const startTime = Date.now();
      
      const result = await this.withExponentialBackoff(async () => {
        return this.uploadToSpecificPlatform(
          platform,
          account,
          accessToken,
          videoPath,
          options
        );
      }, platform);

      const duration = (Date.now() - startTime) / 1000;

      return {
        platform,
        success: result.success,
        videoId: result.videoId,
        url: result.url,
        error: result.error,
        duration,
      };
    } catch (error) {
      console.error(`Failed to upload to ${platform}:`, error);
      return {
        platform,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private static async uploadToSpecificPlatform(
    platform: Platform,
    account: UserAccount,
    accessToken: string,
    videoPath: string,
    options: UploadOptions
  ): Promise<{ success: boolean; videoId?: string; url?: string; error?: string }> {
    switch (platform) {
      case 'youtube':
        return this.uploadToYouTube(account, accessToken, videoPath, options);
      case 'tiktok':
        return this.uploadToTikTok(account, accessToken, videoPath, options);
      case 'instagram':
        return this.uploadToInstagram(account, accessToken, videoPath, options);
      case 'facebook':
        return this.uploadToFacebook(account, accessToken, videoPath, options);
      case 'twitter':
        return this.uploadToTwitter(account, accessToken, videoPath, options);
      case 'linkedin':
        return this.uploadToLinkedIn(account, accessToken, videoPath, options);
      case 'threads':
        return this.uploadToThreads(account, accessToken, videoPath, options);
      case 'snapchat':
        return this.uploadToSnapchat(account, accessToken, videoPath, options);
      case 'pinterest':
        return this.uploadToPinterest(account, accessToken, videoPath, options);
      default:
        return { success: false, error: `Platform ${platform} not supported` };
    }
  }

  private static async uploadToYouTube(
    account: UserAccount,
    accessToken: string,
    videoPath: string,
    options: UploadOptions
  ): Promise<{ success: boolean; videoId?: string; url?: string; error?: string }> {
    try {
      const config = PLATFORM_APIS.youtube;
      const http = axios.create({
        baseURL: config.baseUrl,
        headers: config.authHeader(accessToken),
      });

      // Step 1: Create video metadata
      const metadataResponse = await http.post('/youtube/v3/videos', {
        part: 'snippet,status',
        requestBody: {
          snippet: {
            title: options.title.substring(0, 100),
            description: options.description.substring(0, 5000),
            tags: options.hashtags?.slice(0, 15) || [],
            categoryId: this.getYouTubeCategoryId(options.contentType),
          },
          status: {
            privacyStatus: options.isPublic ? 'public' : 'private',
            publishAt: options.scheduleTime?.toISOString(),
            selfDeclaredMadeForKids: false,
          },
        },
      });

      const videoId = metadataResponse.data.id;

      // Step 2: Upload video file
      const form = new FormData();
      form.append('file', createReadStream(videoPath));

      const uploadResponse = await http.post(
        `/upload/youtube/v3/videos?uploadType=media&part=snippet,status&id=${videoId}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            ...config.authHeader(accessToken),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      return {
        success: true,
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    } catch (error) {
      console.error('YouTube upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'YouTube upload failed',
      };
    }
  }

  private static async uploadToTikTok(
    account: UserAccount,
    accessToken: string,
    videoPath: string,
    options: UploadOptions
  ): Promise<{ success: boolean; videoId?: string; url?: string; error?: string }> {
    try {
      const config = PLATFORM_APIS.tiktok;
      const http = axios.create({
        baseURL: config.baseUrl,
        headers: config.authHeader(accessToken),
      });

      // TikTok upload requires POST to upload endpoint
      const form = new FormData();
      form.append('video', createReadStream(videoPath));

      const response = await http.post(config.uploadEndpoint, form, {
        headers: {
          ...form.getHeaders(),
          ...config.authHeader(accessToken),
        },
        params: {
          title: options.title.substring(0, 100),
          description: options.description.substring(0, 2200),
          hashtags: options.hashtags?.join(' ') || '',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      return {
        success: true,
        videoId: response.data?.video_id,
        url: response.data?.video_url,
      };
    } catch (error) {
      console.error('TikTok upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'TikTok upload failed',
      };
    }
  }

  private static async uploadToInstagram(
    account: UserAccount,
    accessToken: string,
    videoPath: string,
    options: UploadOptions
  ): Promise<{ success: boolean; videoId?: string; url?: string; error?: string }> {
    try {
      const config = PLATFORM_APIS.instagram;
      const http = axios.create({
        baseURL: config.baseUrl,
        headers: config.authHeader(accessToken),
      });

      // Instagram requires page ID
      const pageId = account.channelId;
      if (!pageId) {
        return { success: false, error: 'Instagram page ID not configured' };
      }

      // Step 1: Upload video
      const form = new FormData();
      form.append('video_file', createReadStream(videoPath));
      form.append('caption', `${options.title}\n\n${options.description}`);
      if (options.hashtags) {
        form.append('hashtags', options.hashtags.join(','));
      }

      const response = await http.post(
        `/v18.0/${pageId}/media`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            ...config.authHeader(accessToken),
          },
          params: {
            access_token: accessToken,
            video_file_chunk: true,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      const creationId = response.data?.id;

      // Step 2: Publish the video
      if (creationId) {
        await http.post(
          `/v18.0/${pageId}/media_publish`,
          {
            creation_id: creationId,
            access_token: accessToken,
          }
        );
      }

      return {
        success: true,
        videoId: creationId,
        url: response.data?.url,
      };
    } catch (error) {
      console.error('Instagram upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Instagram upload failed',
      };
    }
  }

  private static async uploadToFacebook(
    account: UserAccount,
    accessToken: string,
    videoPath: string,
    options: UploadOptions
  ): Promise<{ success: boolean; videoId?: string; url?: string; error?: string }> {
    try {
      const config = PLATFORM_APIS.facebook;
      const http = axios.create({
        baseURL: config.baseUrl,
        headers: config.authHeader(accessToken),
      });

      // Facebook requires page ID
      const pageId = account.channelId;
      if (!pageId) {
        return { success: false, error: 'Facebook page ID not configured' };
      }

      // Upload video
      const form = new FormData();
      form.append('video_file_chunk', createReadStream(videoPath));
      form.append('description', `${options.title}\n\n${options.description}`);

      const response = await http.post(
        `/v18.0/${pageId}/videos`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            ...config.authHeader(accessToken),
          },
          params: {
            access_token: accessToken,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      return {
        success: true,
        videoId: response.data?.id,
        url: response.data?.url,
      };
    } catch (error) {
      console.error('Facebook upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Facebook upload failed',
      };
    }
  }

  private static async uploadToTwitter(
    account: UserAccount,
    accessToken: string,
    videoPath: string,
    options: UploadOptions
  ): Promise<{ success: boolean; videoId?: string; url?: string; error?: string }> {
    try {
      const config = PLATFORM_APIS.twitter;
      const http = axios.create({
        baseURL: config.baseUrl,
        headers: config.authHeader(accessToken),
      });

      // Twitter has a complex upload process
      // Step 1: INIT upload
      const initResponse = await http.post('/2/media/upload', {
        command: 'INIT',
        total_bytes: this.getFileSize(videoPath),
        media_type: 'video/mp4',
        media_category: 'tweet_video',
      });

      const mediaId = initResponse.data?.media_id_string;
      if (!mediaId) {
        return { success: false, error: 'Failed to initialize Twitter upload' };
      }

      // Step 2: APPEND video chunks
      // For simplicity, we'll use a single chunk (Twitter allows up to 5MB per chunk)
      const form = new FormData();
      form.append('command', 'APPEND');
      form.append('media_id', mediaId);
      form.append('segment_index', '0');
      form.append('media', createReadStream(videoPath));

      await http.post('/2/media/upload', form, {
        headers: {
          ...form.getHeaders(),
          ...config.authHeader(accessToken),
        },
      });

      // Step 3: FINALIZE upload
      await http.post('/2/media/upload', {
        command: 'FINALIZE',
        media_id: mediaId,
      });

      // Step 4: Create tweet with video
      const tweetResponse = await http.post('/2/tweets', {
        text: `${options.title}\n\n${options.description}\n\n${options.hashtags?.join(' ') || ''}`,
        media: { media_ids: [mediaId] },
      });

      return {
        success: true,
        videoId: mediaId,
        url: `https://twitter.com/user/status/${tweetResponse.data?.id}`,
      };
    } catch (error) {
      console.error('Twitter upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Twitter upload failed',
      };
    }
  }

  private static async uploadToLinkedIn(
    account: UserAccount,
    accessToken: string,
    videoPath: string,
    options: UploadOptions
  ): Promise<{ success: boolean; videoId?: string; url?: string; error?: string }> {
    try {
      const config = PLATFORM_APIS.linkedin;
      const http = axios.create({
        baseURL: config.baseUrl,
        headers: config.authHeader(accessToken),
      });

      // LinkedIn video upload
      const response = await http.post(
        config.uploadEndpoint,
        {
          author: `urn:li:person:${account.channelId}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            com.linkedin.ugc.ShareContent: {
              shareCommentary: {
                text: `${options.title}\n\n${options.description}`,
              },
              shareMediaCategory: 'VIDEO',
              media: [
                {
                  status: 'READY',
                  description: {
                    text: options.title,
                  },
                  media: videoPath,
                  title: options.title,
                },
              ],
            },
          },
          visibility: {
            com.linkedin.ugc.MemberNetworkVisibility: options.isPublic ? 'PUBLIC' : 'CONNECTIONS',
          },
        }
      );

      return {
        success: true,
        videoId: response.data?.id,
        url: response.data?.url,
      };
    } catch (error) {
      console.error('LinkedIn upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'LinkedIn upload failed',
      };
    }
  }

  private static async uploadToThreads(
    account: UserAccount,
    accessToken: string,
    videoPath: string,
    options: UploadOptions
  ): Promise<{ success: boolean; videoId?: string; url?: string; error?: string }> {
    try {
      const config = PLATFORM_APIS.threads;
      const http = axios.create({
        baseURL: config.baseUrl,
        headers: config.authHeader(accessToken),
      });

      // Threads uses GraphQL
      const response = await http.post(config.uploadEndpoint, {
        query: `
          mutation CreateMediaPost($input: CreateMediaPostInput!) {
            createMediaPost(input: $input) {
              id
              url
            }
          }
        `,
        variables: {
          input: {
            media: videoPath,
            caption: `${options.title}\n\n${options.description}`,
            hashtags: options.hashtags || [],
          },
        },
      });

      return {
        success: true,
        videoId: response.data?.data?.createMediaPost?.id,
        url: response.data?.data?.createMediaPost?.url,
      };
    } catch (error) {
      console.error('Threads upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Threads upload failed',
      };
    }
  }

  private static async uploadToSnapchat(
    account: UserAccount,
    accessToken: string,
    videoPath: string,
    options: UploadOptions
  ): Promise<{ success: boolean; videoId?: string; url?: string; error?: string }> {
    try {
      const config = PLATFORM_APIS.snapchat;
      const http = axios.create({
        baseURL: config.baseUrl,
        headers: config.authHeader(accessToken),
      });

      // Snapchat Spotlight upload
      const form = new FormData();
      form.append('media', createReadStream(videoPath));
      form.append('caption', options.title);
      form.append('tags', options.hashtags?.join(',') || '');

      const response = await http.post(config.uploadEndpoint, form, {
        headers: {
          ...form.getHeaders(),
          ...config.authHeader(accessToken),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      return {
        success: true,
        videoId: response.data?.id,
        url: response.data?.url,
      };
    } catch (error) {
      console.error('Snapchat upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Snapchat upload failed',
      };
    }
  }

  private static async uploadToPinterest(
    account: UserAccount,
    accessToken: string,
    videoPath: string,
    options: UploadOptions
  ): Promise<{ success: boolean; videoId?: string; url?: string; error?: string }> {
    try {
      const config = PLATFORM_APIS.pinterest;
      const http = axios.create({
        baseURL: config.baseUrl,
        headers: config.authHeader(accessToken),
      });

      // Pinterest Idea Pin upload
      const form = new FormData();
      form.append('media', createReadStream(videoPath));
      form.append('title', options.title);
      form.append('description', options.description);
      form.append('board_id', account.channelId || '');

      const response = await http.post(config.uploadEndpoint, form, {
        headers: {
          ...form.getHeaders(),
          ...config.authHeader(accessToken),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      return {
        success: true,
        videoId: response.data?.id,
        url: response.data?.url,
      };
    } catch (error) {
      console.error('Pinterest upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Pinterest upload failed',
      };
    }
  }

  static async uploadToMultiplePlatforms(
    accountId: string,
    videoPath: string,
    platforms: Platform[],
    options: Omit<UploadOptions, 'platform'>
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const platform of platforms) {
      const result = await this.uploadToPlatform(
        platform,
        accountId,
        videoPath,
        { ...options, platform }
      );
      results.push(result);
    }

    return results;
  }

  static async getPlatformAnalytics(
    platform: Platform,
    accountId: string,
    videoId: string,
    days: number = 7
  ): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    reach: number;
    impressions: number;
  }> {
    try {
      const authService = (await import('./../auth/auth.service')).AuthService.getInstance(platform);
      const accessToken = await authService.getAccessToken(accountId);

      if (!accessToken) {
        throw new Error('No access token available');
      }

      const account = await tokenStorage.getAccount(platform, accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      // Platform-specific analytics
      switch (platform) {
        case 'youtube':
          return this.getYouTubeAnalytics(accessToken, videoId, days);
        case 'tiktok':
          return this.getTikTokAnalytics(accessToken, videoId, days);
        case 'instagram':
          return this.getInstagramAnalytics(accessToken, account.channelId || '', videoId, days);
        case 'facebook':
          return this.getFacebookAnalytics(accessToken, account.channelId || '', videoId, days);
        case 'twitter':
          return this.getTwitterAnalytics(accessToken, videoId, days);
        case 'linkedin':
          return this.getLinkedInAnalytics(accessToken, videoId, days);
        case 'threads':
          return this.getThreadsAnalytics(accessToken, videoId, days);
        case 'snapchat':
          return this.getSnapchatAnalytics(accessToken, videoId, days);
        case 'pinterest':
          return this.getPinterestAnalytics(accessToken, videoId, days);
        default:
          return {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            engagementRate: 0,
            reach: 0,
            impressions: 0,
          };
      }
    } catch (error) {
      console.error(`Failed to get analytics for ${platform}:`, error);
      return {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        engagementRate: 0,
        reach: 0,
        impressions: 0,
      };
    }
  }

  private static async getYouTubeAnalytics(
    accessToken: string,
    videoId: string,
    days: number
  ): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    reach: number;
    impressions: number;
  }> {
    try {
      const http = axios.create({
        baseURL: 'https://www.googleapis.com',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await http.get('/youtubeanalytics/v2/reports', {
        params: {
          ids: `channel==${videoId}`,
          startDate,
          endDate,
          metrics: 'views,likes,comments,shares,impressions',
          dimensions: 'day',
          sort: '-day',
        },
      });

      const data = response.data?.rows || [];
      
      let views = 0;
      let likes = 0;
      let comments = 0;
      let shares = 0;
      let impressions = 0;

      for (const row of data) {
        views += parseInt(row[1]?.values?.[0]?.value || '0');
        likes += parseInt(row[2]?.values?.[0]?.value || '0');
        comments += parseInt(row[3]?.values?.[0]?.value || '0');
        shares += parseInt(row[4]?.values?.[0]?.value || '0');
        impressions += parseInt(row[5]?.values?.[0]?.value || '0');
      }

      const engagementRate = views > 0 ? ((likes + comments + shares) / views) * 100 : 0;

      return {
        views,
        likes,
        comments,
        shares,
        engagementRate,
        reach: impressions,
        impressions,
      };
    } catch (error) {
      console.error('YouTube analytics failed:', error);
      return {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        engagementRate: 0,
        reach: 0,
        impressions: 0,
      };
    }
  }

  private static async getTikTokAnalytics(
    accessToken: string,
    videoId: string,
    days: number
  ): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    reach: number;
    impressions: number;
  }> {
    // Placeholder - TikTok API implementation would go here
    return {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      engagementRate: 0,
      reach: 0,
      impressions: 0,
    };
  }

  private static async getInstagramAnalytics(
    accessToken: string,
    pageId: string,
    videoId: string,
    days: number
  ): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    reach: number;
    impressions: number;
  }> {
    // Placeholder - Instagram API implementation would go here
    return {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      engagementRate: 0,
      reach: 0,
      impressions: 0,
    };
  }

  private static async getFacebookAnalytics(
    accessToken: string,
    pageId: string,
    videoId: string,
    days: number
  ): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    reach: number;
    impressions: number;
  }> {
    // Placeholder - Facebook API implementation would go here
    return {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      engagementRate: 0,
      reach: 0,
      impressions: 0,
    };
  }

  private static async getTwitterAnalytics(
    accessToken: string,
    videoId: string,
    days: number
  ): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    reach: number;
    impressions: number;
  }> {
    // Placeholder - Twitter API implementation would go here
    return {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      engagementRate: 0,
      reach: 0,
      impressions: 0,
    };
  }

  private static async getLinkedInAnalytics(
    accessToken: string,
    videoId: string,
    days: number
  ): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    reach: number;
    impressions: number;
  }> {
    // Placeholder - LinkedIn API implementation would go here
    return {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      engagementRate: 0,
      reach: 0,
      impressions: 0,
    };
  }

  private static async getThreadsAnalytics(
    accessToken: string,
    videoId: string,
    days: number
  ): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    reach: number;
    impressions: number;
  }> {
    // Placeholder - Threads API implementation would go here
    return {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      engagementRate: 0,
      reach: 0,
      impressions: 0,
    };
  }

  private static async getSnapchatAnalytics(
    accessToken: string,
    videoId: string,
    days: number
  ): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    reach: number;
    impressions: number;
  }> {
    // Placeholder - Snapchat API implementation would go here
    return {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      engagementRate: 0,
      reach: 0,
      impressions: 0,
    };
  }

  private static async getPinterestAnalytics(
    accessToken: string,
    videoId: string,
    days: number
  ): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    reach: number;
    impressions: number;
  }> {
    // Placeholder - Pinterest API implementation would go here
    return {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      engagementRate: 0,
      reach: 0,
      impressions: 0,
    };
  }

  private static getFileSize(filePath: string): number {
    try {
      const fs = require('fs');
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  private static getYouTubeCategoryId(contentType: string): string {
    const categoryMap: Record<string, string> = {
      'gaming': '20',
      'music': '10',
      'education': '27',
      'comedy': '23',
      'sports': '17',
      'news': '25',
      'entertainment': '24',
      'lifestyle': '26',
      'travel': '19',
      'food': '28',
      'fashion': '22',
      'business': '1',
      'health': '26',
      'science': '28',
      'reel': '23',
      'short': '23',
      'long_video': '22',
      'story': '24',
      'post': '24',
    };
    return categoryMap[contentType.toLowerCase()] || '22';
  }
}

export const platformService = PlatformService;
