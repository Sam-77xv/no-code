import { execa } from 'yt-dlp-exec';
import { VideoInfo } from '@clipforge/shared';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface YtdlpOptions {
  url: string;
  outputPath?: string;
  format?: string;
  quality?: string;
  getInfo?: boolean;
  getThumbnail?: boolean;
}

interface YtdlpResult {
  success: boolean;
  videoPath?: string;
  thumbnailPath?: string;
  info?: VideoInfo;
  error?: string;
}

export class YtdlpService {
  private static readonly DEFAULT_OUTPUT_PATH = join(homedir(), 'ClipForge', 'downloads');
  private static readonly DEFAULT_FORMAT = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';

  static async ensureOutputPath(outputPath: string): Promise<string> {
    if (!existsSync(outputPath)) {
      mkdirSync(outputPath, { recursive: true });
    }
    return outputPath;
  }

  static async getVideoInfo(url: string): Promise<VideoInfo | null> {
    try {
      const result = await execa('yt-dlp', [
        '--dump-single-json',
        '--no-warnings',
        '--force-generic-extractor',
        url
      ], { timeout: 30000 });

      if (result.stdout) {
        const data = JSON.parse(result.stdout);
        return this.mapToVideoInfo(data);
      }
      return null;
    } catch (error) {
      console.error('Failed to get video info:', error);
      return null;
    }
  }

  static async downloadVideo(options: YtdlpOptions): Promise<YtdlpResult> {
    const {
      url,
      outputPath = this.DEFAULT_OUTPUT_PATH,
      format = this.DEFAULT_FORMAT,
      quality = 'highest',
      getThumbnail = true,
    } = options;

    try {
      // Ensure output directory exists
      await this.ensureOutputPath(outputPath);

      // Generate unique filename
      const timestamp = Date.now();
      const videoFilename = `video_${timestamp}.mp4`;
      const thumbnailFilename = `thumb_${timestamp}.jpg`;
      const videoPath = join(outputPath, videoFilename);
      const thumbnailPath = join(outputPath, thumbnailFilename);

      // Build yt-dlp command
      const args = [
        '-f', format,
        '-o', join(outputPath, videoFilename),
        '--restrict-filenames',
        '--no-warnings',
        '--force-generic-extractor',
        url
      ];

      // Download video
      await execa('yt-dlp', args, { timeout: 300000 }); // 5 minutes timeout

      let thumbnailPathResult: string | undefined;

      // Download thumbnail if requested
      if (getThumbnail) {
        try {
          await execa('yt-dlp', [
            '--skip-download',
            '--write-thumbnail',
            '-o', join(outputPath, thumbnailFilename),
            '--no-warnings',
            url
          ], { timeout: 30000 });
          thumbnailPathResult = thumbnailPath;
        } catch (thumbnailError) {
          console.warn('Failed to download thumbnail:', thumbnailError);
        }
      }

      // Get video info
      const info = await this.getVideoInfo(url);

      return {
        success: true,
        videoPath,
        thumbnailPath: thumbnailPathResult,
        info,
      };
    } catch (error) {
      console.error('Failed to download video:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getAvailableFormats(url: string): Promise<string[]> {
    try {
      const result = await execa('yt-dlp', [
        '-F',
        '--no-warnings',
        url
      ], { timeout: 30000 });

      if (result.stdout) {
        const lines = result.stdout.split('\n');
        const formats: string[] = [];
        for (const line of lines) {
          if (line.includes('video only') || line.includes('audio only') || line.includes('video+audio')) {
            const match = line.match(/^(\d+)\s+/);
            if (match) {
              formats.push(match[1]);
            }
          }
        }
        return formats;
      }
      return [];
    } catch (error) {
      console.error('Failed to get available formats:', error);
      return [];
    }
  }

  static async listExtractors(): Promise<string[]> {
    try {
      const result = await execa('yt-dlp', [
        '--list-extractors',
        '--flat'
      ], { timeout: 30000 });

      if (result.stdout) {
        return result.stdout.split('\n').filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Failed to list extractors:', error);
      return [];
    }
  }

  private static mapToVideoInfo(data: any): VideoInfo {
    return {
      id: data.id || '',
      title: data.title || data.fulltitle || '',
      description: data.description || '',
      duration: data.duration || 0,
      thumbnail: data.thumbnail || data.url || '',
      url: data.url || '',
      width: data.width || 0,
      height: data.height || 0,
      fps: data.fps || 0,
      format: data.ext || '',
      filesize: data.filesize || 0,
      uploader: data.uploader || data.channel || '',
      uploadDate: data.upload_date || '',
    };
  }

  static async getSupportedSites(): Promise<string[]> {
    try {
      const result = await execa('yt-dlp', [
        '--list-extractors',
        '--flat'
      ], { timeout: 30000 });

      if (result.stdout) {
        return result.stdout.split('\n')
          .filter(Boolean)
          .map(site => site.replace(/^\s+|\s+$/g, ''));
      }
      return [];
    } catch (error) {
      console.error('Failed to get supported sites:', error);
      return [];
    }
  }
}
