export * from '@clipforge/shared';

export interface JobFormData {
  url: string;
  platforms: string[];
  contentType: string;
  title?: string;
  description?: string;
  hashtags?: string;
  aspectRatio?: string;
  autoGenerateMetadata: boolean;
  watermarkRemoval: boolean;
  compressionPreset: 'low' | 'medium' | 'high';
  splitLongVideos: boolean;
  scheduleTime?: string;
}

export interface PlatformConnection {
  platform: string;
  isConnected: boolean;
  username?: string;
  channelId?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}
