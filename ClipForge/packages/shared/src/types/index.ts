// Platform types
export type Platform = 
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'threads'
  | 'snapchat'
  | 'pinterest';

export const PLATFORMS: Platform[] = [
  'youtube',
  'tiktok',
  'instagram',
  'facebook',
  'twitter',
  'linkedin',
  'threads',
  'snapchat',
  'pinterest'
];

// Content types
export type ContentType = 'reel' | 'short' | 'long_video' | 'story' | 'post';

export const CONTENT_TYPES: ContentType[] = [
  'reel',
  'short',
  'long_video',
  'story',
  'post'
];

// Video aspect ratios
export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

export const ASPECT_RATIOS: AspectRatio[] = [
  '9:16',
  '16:9',
  '1:1',
  '4:5'
];

// Job status
export type JobStatus = 
  | 'pending'
  | 'downloading'
  | 'processing'
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Upload result
export interface UploadResult {
  platform: Platform;
  success: boolean;
  videoId?: string;
  url?: string;
  error?: string;
  duration?: number;
}

// Job interface
export interface Job {
  id: string;
  url: string;
  platforms: Platform[];
  contentType: ContentType;
  title?: string;
  description?: string;
  hashtags?: string[];
  aspectRatio?: AspectRatio;
  autoGenerateMetadata?: boolean;
  watermarkRemoval?: boolean;
  compressionPreset?: 'low' | 'medium' | 'high';
  splitLongVideos?: boolean;
  scheduleTime?: Date;
  status: JobStatus;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  results?: UploadResult[];
  error?: string;
  retryCount?: number;
}

// Platform-specific metadata
export interface PlatformMetadata {
  title: string;
  description: string;
  hashtags: string[];
  maxTitleLength: number;
  maxDescriptionLength: number;
  maxHashtags: number;
  optimalHashtagLength: number;
}

// Platform config
export interface PlatformConfig {
  name: Platform;
  displayName: string;
  icon: string;
  supportsLongVideo: boolean;
  supportsShorts: boolean;
  supportsStories: boolean;
  maxVideoDuration: number; // in seconds
  maxFileSize: number; // in bytes
  metadata: PlatformMetadata;
}

// User account
export interface UserAccount {
  id: string;
  platform: Platform;
  username: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  channelId?: string;
  isConnected: boolean;
  createdAt: Date;
}

// Settings
export interface AppSettings {
  defaultPlatforms: Platform[];
  defaultContentType: ContentType;
  defaultAspectRatio: AspectRatio;
  autoGenerateMetadata: boolean;
  watermarkRemoval: boolean;
  compressionPreset: 'low' | 'medium' | 'high';
  splitLongVideos: boolean;
  maxRetries: number;
  downloadPath: string;
  theme: 'dark' | 'light' | 'system';
}

// Analytics
export interface UploadAnalytics {
  id: string;
  jobId: string;
  platform: Platform;
  videoId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  timestamp: Date;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Video info from yt-dlp
export interface VideoInfo {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  thumbnail: string;
  url: string;
  width: number;
  height: number;
  fps: number;
  format: string;
  filesize: number; // in bytes
  uploader: string;
  uploadDate: string;
}

// Processing options
export interface ProcessingOptions {
  aspectRatio?: AspectRatio;
  smartCrop?: boolean;
  splitDuration?: number; // in seconds
  watermarkRemoval?: boolean;
  compressionPreset?: 'low' | 'medium' | 'high';
  outputFormat?: 'mp4' | 'mov' | 'webm';
}

export interface AIGenerationOptions {
  prompt?: string;
  model?: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'gemini-1.5';
  temperature?: number;
  maxTokens?: number;
}
