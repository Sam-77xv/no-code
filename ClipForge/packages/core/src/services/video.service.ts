import { YtdlpService } from './ytdlp.service';
import { FFmpegService } from './ffmpeg.service';
import { AIService } from './ai.service';
import { VideoInfo, Platform, Job, ProcessingOptions, AspectRatio, ContentType, JobStatus } from '@clipforge/shared';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, unlinkSync, readdirSync, statSync } from 'fs';

interface VideoProcessingResult {
  success: boolean;
  outputPath?: string;
  thumbnailPath?: string;
  processedVideos?: string[];
  metadata?: {
    title?: string;
    description?: string;
    hashtags?: string[];
  };
  error?: string;
}

interface ProcessJobOptions {
  job: Job;
  onProgress?: (progress: number, status: JobStatus, message?: string) => void;
}

export class VideoService {
  private static readonly DEFAULT_DOWNLOAD_PATH = join(homedir(), 'ClipForge', 'downloads');
  private static readonly DEFAULT_PROCESSED_PATH = join(homedir(), 'ClipForge', 'processed');
  private static readonly DEFAULT_OUTPUT_PATH = join(homedir(), 'ClipForge', 'output');

  static async ensureDirectories(): Promise<void> {
    const directories = [
      this.DEFAULT_DOWNLOAD_PATH,
      this.DEFAULT_PROCESSED_PATH,
      this.DEFAULT_OUTPUT_PATH,
    ];

    for (const dir of directories) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
  }

  static async processJob(options: ProcessJobOptions): Promise<VideoProcessingResult> {
    const { job, onProgress } = options;

    try {
      await this.ensureDirectories();

      // Update progress
      onProgress?.(0, 'downloading', 'Starting download...');

      // Step 1: Download video
      const downloadResult = await YtdlpService.downloadVideo({
        url: job.url,
        outputPath: this.DEFAULT_DOWNLOAD_PATH,
        getThumbnail: true,
      });

      if (!downloadResult.success || !downloadResult.videoPath) {
        return {
          success: false,
          error: downloadResult.error || 'Failed to download video',
        };
      }

      onProgress?.(20, 'downloading', `Downloaded: ${downloadResult.videoPath}`);

      // Step 2: Get video info
      let videoInfo = downloadResult.info;
      if (!videoInfo) {
        videoInfo = await YtdlpService.getVideoInfo(job.url);
      }

      // Step 3: Generate metadata if auto-generate is enabled
      let metadata = {
        title: job.title,
        description: job.description,
        hashtags: job.hashtags,
      };

      if (job.autoGenerateMetadata && videoInfo) {
        onProgress?.(25, 'processing', 'Generating AI metadata...');
        
        const aiMetadata = await AIService.generateTitleAndDescription(
          { title: videoInfo.title, description: videoInfo.description },
          job.platforms,
          job.contentType
        );

        // Use metadata for the first platform (or merge all)
        const firstPlatform = job.platforms[0];
        const platformMetadata = aiMetadata[firstPlatform] || aiMetadata[Object.keys(aiMetadata)[0]];

        metadata = {
          title: platformMetadata?.title || job.title || videoInfo.title,
          description: platformMetadata?.description || job.description || videoInfo.description,
          hashtags: platformMetadata?.hashtags || job.hashtags || [],
        };
      }

      onProgress?.(30, 'processing', 'Processing video...');

      // Step 4: Process video based on options
      const processingOptions: ProcessingOptions = {
        aspectRatio: job.aspectRatio,
        smartCrop: true,
        splitDuration: job.splitLongVideos ? 60 : undefined,
        watermarkRemoval: job.watermarkRemoval,
        compressionPreset: job.compressionPreset,
        outputFormat: 'mp4',
      };

      let processedPath = downloadResult.videoPath;

      // Process only if there are processing options
      if (processingOptions.aspectRatio || 
          processingOptions.splitDuration || 
          processingOptions.watermarkRemoval || 
          processingOptions.compressionPreset) {

        const processResult = await FFmpegService.processVideo({
          inputPath: downloadResult.videoPath,
          outputPath: join(this.DEFAULT_PROCESSED_PATH, `processed_${Date.now()}.mp4`),
          ...processingOptions,
        });

        if (!processResult.success || !processResult.outputPath) {
          return {
            success: false,
            error: processResult.error || 'Failed to process video',
          };
        }

        processedPath = processResult.outputPath;
        onProgress?.(60, 'processing', `Processed: ${processedPath}`);
      }

      // Step 5: Split video if needed and content type is short/reel
      let finalOutputPaths: string[] = [processedPath];

      if (job.splitLongVideos && (job.contentType === 'reel' || job.contentType === 'short')) {
        onProgress?.(65, 'processing', 'Splitting video into 60s clips...');

        const videoMetadata = await FFmpegService.getVideoMetadata(processedPath);
        if (videoMetadata && videoMetadata.duration > 60) {
          const splitResults = await FFmpegService.splitVideo({
            inputPath: processedPath,
            segmentDuration: 60,
            outputFormat: 'mp4',
          });

          if (splitResults.every(r => r.success)) {
            finalOutputPaths = splitResults
              .filter(r => r.outputPath)
              .map(r => r.outputPath!) as string[];
            onProgress?.(75, 'processing', `Split into ${finalOutputPaths.length} clips`);
          }
        }
      }

      onProgress?.(80, 'processing', 'Preparing for upload...');

      // Step 6: Prepare final output
      const timestamp = Date.now();
      const finalOutputs: string[] = [];

      for (let i = 0; i < finalOutputPaths.length; i++) {
        const outputPath = join(
          this.DEFAULT_OUTPUT_PATH,
          `${job.contentType}_${timestamp}_${i}.mp4`
        );

        // For now, just use the processed path
        // In a real implementation, we would copy/rename the file
        finalOutputs.push(finalOutputPaths[i]);
      }

      onProgress?.(90, 'uploading', 'Ready for upload');

      return {
        success: true,
        outputPath: finalOutputs[0],
        processedVideos: finalOutputs,
        thumbnailPath: downloadResult.thumbnailPath,
        metadata,
      };
    } catch (error) {
      console.error('Failed to process job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async downloadAndProcess(
    url: string,
    options: {
      platforms: Platform[];
      contentType: ContentType;
      aspectRatio?: AspectRatio;
      autoGenerateMetadata?: boolean;
      watermarkRemoval?: boolean;
      compressionPreset?: 'low' | 'medium' | 'high';
      splitLongVideos?: boolean;
      onProgress?: (progress: number, status: JobStatus, message?: string) => void;
    }
  ): Promise<VideoProcessingResult> {
    const job: Job = {
      id: `job_${Date.now()}`,
      url,
      platforms: options.platforms,
      contentType: options.contentType,
      aspectRatio: options.aspectRatio,
      autoGenerateMetadata: options.autoGenerateMetadata ?? true,
      watermarkRemoval: options.watermarkRemoval ?? false,
      compressionPreset: options.compressionPreset ?? 'medium',
      splitLongVideos: options.splitLongVideos ?? true,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.processJob({ job, onProgress: options.onProgress });
  }

  static async getVideoInfo(url: string): Promise<VideoInfo | null> {
    return YtdlpService.getVideoInfo(url);
  }

  static async validateVideoUrl(url: string): Promise<boolean> {
    try {
      const info = await YtdlpService.getVideoInfo(url);
      return !!info;
    } catch (error) {
      return false;
    }
  }

  static async getSupportedSites(): Promise<string[]> {
    return YtdlpService.getSupportedSites();
  }

  static async cleanupOldFiles(days: number = 7): Promise<{
    deleted: number;
    errors: number;
  }> {
    let deleted = 0;
    let errors = 0;

    const directories = [
      this.DEFAULT_DOWNLOAD_PATH,
      this.DEFAULT_PROCESSED_PATH,
      this.DEFAULT_OUTPUT_PATH,
    ];

    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    const cutoff = now - (days * msInDay);

    for (const dir of directories) {
      if (existsSync(dir)) {
        try {
          const files = readdirSync(dir);
          
          for (const file of files) {
            try {
              const filePath = join(dir, file);
              const stats = statSync(filePath);
              
              if (stats.mtimeMs < cutoff) {
                unlinkSync(filePath);
                deleted++;
              }
            } catch (error) {
              errors++;
            }
          }
        } catch (error) {
          errors++;
        }
      }
    }

    return { deleted, errors };
  }

  static async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = statSync(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  static async getFileDuration(filePath: string): Promise<number> {
    try {
      const metadata = await FFmpegService.getVideoMetadata(filePath);
      return metadata?.duration || 0;
    } catch (error) {
      return 0;
    }
  }

  static async optimizeForPlatform(
    videoPath: string,
    platform: Platform,
    contentType: ContentType
  ): Promise<VideoProcessingResult> {
    try {
      await this.ensureDirectories();

      // Get platform-specific requirements
      const platformRequirements: Record<Platform, {
        aspectRatio?: AspectRatio;
        maxDuration?: number;
        maxFileSize?: number;
      }> = {
        youtube: {
          aspectRatio: contentType === 'short' ? '9:16' : '16:9',
          maxDuration: contentType === 'short' ? 60 : 8 * 60, // 8 minutes for long-form
        },
        tiktok: {
          aspectRatio: '9:16',
          maxDuration: 60,
        },
        instagram: {
          aspectRatio: contentType === 'reel' ? '9:16' : '1:1',
          maxDuration: contentType === 'reel' ? 90 : 60,
        },
        facebook: {
          aspectRatio: contentType === 'reel' ? '9:16' : '16:9',
          maxDuration: contentType === 'reel' ? 90 : 240,
        },
        twitter: {
          aspectRatio: '16:9',
          maxDuration: 140,
        },
        linkedin: {
          aspectRatio: '16:9',
          maxDuration: 600,
        },
        threads: {
          aspectRatio: '9:16',
          maxDuration: 60,
        },
        snapchat: {
          aspectRatio: '9:16',
          maxDuration: 60,
        },
        pinterest: {
          aspectRatio: '1:1',
          maxDuration: 300,
        },
      };

      const requirements = platformRequirements[platform] || {};
      const outputPath = join(
        this.DEFAULT_PROCESSED_PATH,
        `optimized_${platform}_${Date.now()}.mp4`
      );

      // Step 1: Convert aspect ratio if needed
      let currentPath = videoPath;
      if (requirements.aspectRatio) {
        const result = await FFmpegService.convertAspectRatio({
          inputPath: currentPath,
          outputPath,
          aspectRatio: requirements.aspectRatio,
          smartCrop: true,
        });

        if (!result.success || !result.outputPath) {
          throw new Error(result.error || 'Failed to convert aspect ratio');
        }
        currentPath = result.outputPath;
      }

      // Step 2: Check and split if duration exceeds max
      if (requirements.maxDuration) {
        const metadata = await FFmpegService.getVideoMetadata(currentPath);
        if (metadata && metadata.duration > requirements.maxDuration) {
          const splitResults = await FFmpegService.splitVideo({
            inputPath: currentPath,
            segmentDuration: requirements.maxDuration,
          });

          if (splitResults.every(r => r.success)) {
            return {
              success: true,
              processedVideos: splitResults
                .filter(r => r.outputPath)
                .map(r => r.outputPath!) as string[],
            };
          }
        }
      }

      return {
        success: true,
        outputPath: currentPath,
      };
    } catch (error) {
      console.error('Failed to optimize for platform:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async createThumbnail(
    videoPath: string,
    outputPath?: string
  ): Promise<string | null> {
    try {
      // Use yt-dlp to extract thumbnail
      const result = await YtdlpService.downloadVideo({
        url: videoPath,
        getThumbnail: true,
        outputPath: outputPath ? join(outputPath, '..') : undefined,
      });

      return result.thumbnailPath || null;
    } catch (error) {
      console.error('Failed to create thumbnail:', error);
      return null;
    }
  }

  static async extractAudio(
    videoPath: string,
    outputPath?: string
  ): Promise<string | null> {
    try {
      // This would use FFmpeg to extract audio
      // For now, return null as this is a placeholder
      return null;
    } catch (error) {
      console.error('Failed to extract audio:', error);
      return null;
    }
  }
}

export const videoService = VideoService;
