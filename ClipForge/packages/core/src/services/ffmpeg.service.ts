import { execa } from 'execa';
import { existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { homedir } from 'os';
import { AspectRatio, ProcessingOptions } from '@clipforge/shared';

interface FFmpegResult {
  success: boolean;
  outputPath?: string;
  duration?: number;
  size?: number;
  error?: string;
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  fps: number;
  bitrate: number;
  size: number;
}

export class FFmpegService {
  private static readonly DEFAULT_OUTPUT_PATH = join(homedir(), 'ClipForge', 'processed');
  private static readonly FFMPEG_PATH = 'ffmpeg';
  private static readonly FFPROBE_PATH = 'ffprobe';

  static async ensureOutputPath(outputPath: string): Promise<string> {
    if (!existsSync(outputPath)) {
      mkdirSync(outputPath, { recursive: true });
    }
    return outputPath;
  }

  static async getVideoMetadata(videoPath: string): Promise<VideoMetadata | null> {
    try {
      const result = await execa(this.FFPROBE_PATH, [
        '-v', 'error',
        '-show_entries', 'format=duration,size:stream=codec_name,width,height,r_frame_rate,bit_rate',
        '-of', 'json',
        videoPath
      ], { timeout: 30000 });

      if (result.stdout) {
        const data = JSON.parse(result.stdout);
        return this.mapToVideoMetadata(data);
      }
      return null;
    } catch (error) {
      console.error('Failed to get video metadata:', error);
      return null;
    }
  }

  static async convertAspectRatio(options: {
    inputPath: string;
    outputPath?: string;
    aspectRatio: AspectRatio;
    smartCrop?: boolean;
  }): Promise<FFmpegResult> {
    const { inputPath, outputPath, aspectRatio, smartCrop = false } = options;

    try {
      // Ensure output directory exists
      const outputDir = outputPath ? dirname(outputPath) : this.DEFAULT_OUTPUT_PATH;
      await this.ensureOutputPath(outputDir);

      // Generate output filename
      const timestamp = Date.now();
      const outputFilename = `converted_${timestamp}.mp4`;
      const finalOutputPath = outputPath || join(outputDir, outputFilename);

      // Get aspect ratio dimensions
      const dimensions = this.getAspectRatioDimensions(aspectRatio);

      // Build ffmpeg command based on aspect ratio
      let args: string[];

      switch (aspectRatio) {
        case '9:16':
          args = this.buildVerticalCommand(inputPath, finalOutputPath, smartCrop);
          break;
        case '16:9':
          args = this.buildHorizontalCommand(inputPath, finalOutputPath, smartCrop);
          break;
        case '1:1':
          args = this.buildSquareCommand(inputPath, finalOutputPath, smartCrop);
          break;
        case '4:5':
          args = this.buildPortraitCommand(inputPath, finalOutputPath, smartCrop);
          break;
        default:
          args = this.buildDefaultCommand(inputPath, finalOutputPath);
      }

      // Execute ffmpeg
      await execa(this.FFMPEG_PATH, args, { timeout: 300000 }); // 5 minutes timeout

      // Get output file info
      const stats = statSync(finalOutputPath);

      return {
        success: true,
        outputPath: finalOutputPath,
        size: stats.size,
      };
    } catch (error) {
      console.error('Failed to convert aspect ratio:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async splitVideo(options: {
    inputPath: string;
    outputPath?: string;
    segmentDuration: number; // in seconds
    outputFormat?: 'mp4' | 'mov' | 'webm';
  }): Promise<FFmpegResult[]> {
    const { inputPath, outputPath, segmentDuration = 60, outputFormat = 'mp4' } = options;

    try {
      // Ensure output directory exists
      const outputDir = outputPath ? dirname(outputPath) : this.DEFAULT_OUTPUT_PATH;
      await this.ensureOutputPath(outputDir);

      // Generate output pattern
      const baseName = basename(inputPath, `.${inputPath.split('.').pop()}`);
      const outputPattern = join(outputDir, `${baseName}_%03d.${outputFormat}`);

      // Build ffmpeg command for splitting
      const args = [
        '-i', inputPath,
        '-c', 'copy',
        '-f', 'segment',
        '-segment_time', segmentDuration.toString(),
        '-segment_format', outputFormat,
        '-reset_timestamps', '1',
        outputPattern
      ];

      // Execute ffmpeg
      await execa(this.FFMPEG_PATH, args, { timeout: 600000 }); // 10 minutes timeout

      // Get list of output files
      const outputFiles = this.getOutputFiles(outputDir, `${baseName}_`);

      return outputFiles.map(file => ({
        success: true,
        outputPath: file,
      }));
    } catch (error) {
      console.error('Failed to split video:', error);
      return [{
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }];
    }
  }

  static async compressVideo(options: {
    inputPath: string;
    outputPath?: string;
    preset: 'low' | 'medium' | 'high';
    targetSize?: number; // in bytes
  }): Promise<FFmpegResult> {
    const { inputPath, outputPath, preset = 'medium', targetSize } = options;

    try {
      // Ensure output directory exists
      const outputDir = outputPath ? dirname(outputPath) : this.DEFAULT_OUTPUT_PATH;
      await this.ensureOutputPath(outputDir);

      // Generate output filename
      const timestamp = Date.now();
      const outputFilename = `compressed_${timestamp}.mp4`;
      const finalOutputPath = outputPath || join(outputDir, outputFilename);

      // Get compression settings based on preset
      const settings = this.getCompressionSettings(preset);

      // Build ffmpeg command
      const args = [
        '-i', inputPath,
        '-c:v', settings.videoCodec,
        '-c:a', settings.audioCodec,
        '-b:v', settings.videoBitrate,
        '-b:a', settings.audioBitrate,
        '-crf', settings.crf.toString(),
        '-preset', settings.preset,
        '-movflags', '+faststart',
        finalOutputPath
      ];

      // Execute ffmpeg
      await execa(this.FFMPEG_PATH, args, { timeout: 300000 }); // 5 minutes timeout

      // Get output file info
      const stats = statSync(finalOutputPath);

      return {
        success: true,
        outputPath: finalOutputPath,
        size: stats.size,
      };
    } catch (error) {
      console.error('Failed to compress video:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async removeWatermark(options: {
    inputPath: string;
    outputPath?: string;
    watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  }): Promise<FFmpegResult> {
    const { inputPath, outputPath, watermarkPosition = 'center' } = options;

    try {
      // Ensure output directory exists
      const outputDir = outputPath ? dirname(outputPath) : this.DEFAULT_OUTPUT_PATH;
      await this.ensureOutputPath(outputDir);

      // Generate output filename
      const timestamp = Date.now();
      const outputFilename = `nowatermark_${timestamp}.mp4`;
      const finalOutputPath = outputPath || join(outputDir, outputFilename);

      // Get video dimensions
      const metadata = await this.getVideoMetadata(inputPath);
      if (!metadata) {
        throw new Error('Failed to get video metadata');
      }

      // Calculate crop parameters based on watermark position
      const cropParams = this.getWatermarkCropParams(metadata, watermarkPosition);

      // Build ffmpeg command
      const args = [
        '-i', inputPath,
        '-vf', `crop=${cropParams.width}:${cropParams.height}:${cropParams.x}:${cropParams.y}`,
        '-c:v', 'libx264',
        '-c:a', 'copy',
        '-movflags', '+faststart',
        finalOutputPath
      ];

      // Execute ffmpeg
      await execa(this.FFMPEG_PATH, args, { timeout: 300000 }); // 5 minutes timeout

      // Get output file info
      const stats = statSync(finalOutputPath);

      return {
        success: true,
        outputPath: finalOutputPath,
        size: stats.size,
      };
    } catch (error) {
      console.error('Failed to remove watermark:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async addWatermark(options: {
    inputPath: string;
    outputPath?: string;
    watermarkPath: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity?: number; // 0-1
  }): Promise<FFmpegResult> {
    const { inputPath, outputPath, watermarkPath, position = 'bottom-right', opacity = 0.5 } = options;

    try {
      // Ensure output directory exists
      const outputDir = outputPath ? dirname(outputPath) : this.DEFAULT_OUTPUT_PATH;
      await this.ensureOutputPath(outputDir);

      // Generate output filename
      const timestamp = Date.now();
      const outputFilename = `watermarked_${timestamp}.mp4`;
      const finalOutputPath = outputPath || join(outputDir, outputFilename);

      // Get position coordinates
      const positionParams = this.getWatermarkPositionParams(position);

      // Build ffmpeg command
      const args = [
        '-i', inputPath,
        '-i', watermarkPath,
        '-filter_complex', `[0:v][1:v] scale2ref=w=iw/4:h=ih/4 [video][watermark]; [video][watermark] overlay=${positionParams.x}:${positionParams.y}:format=auto, enable='between(t,0,20)'`,
        '-c:v', 'libx264',
        '-c:a', 'copy',
        '-movflags', '+faststart',
        finalOutputPath
      ];

      // Execute ffmpeg
      await execa(this.FFMPEG_PATH, args, { timeout: 300000 }); // 5 minutes timeout

      // Get output file info
      const stats = statSync(finalOutputPath);

      return {
        success: true,
        outputPath: finalOutputPath,
        size: stats.size,
      };
    } catch (error) {
      console.error('Failed to add watermark:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async processVideo(options: ProcessingOptions & { inputPath: string; outputPath?: string }): Promise<FFmpegResult> {
    const { inputPath, outputPath, aspectRatio, smartCrop = false, splitDuration, watermarkRemoval, compressionPreset, outputFormat = 'mp4' } = options;

    try {
      // Start with the input file
      let currentPath = inputPath;

      // Step 1: Convert aspect ratio if specified
      if (aspectRatio) {
        const result = await this.convertAspectRatio({
          inputPath: currentPath,
          aspectRatio,
          smartCrop,
        });
        if (!result.success || !result.outputPath) {
          throw new Error(result.error || 'Failed to convert aspect ratio');
        }
        currentPath = result.outputPath;
      }

      // Step 2: Split video if specified
      if (splitDuration) {
        const results = await this.splitVideo({
          inputPath: currentPath,
          segmentDuration: splitDuration,
          outputFormat,
        });
        if (results.some(r => !r.success)) {
          throw new Error('Failed to split video');
        }
        // For now, just use the first segment
        currentPath = results[0].outputPath!;
      }

      // Step 3: Compress if specified
      if (compressionPreset) {
        const result = await this.compressVideo({
          inputPath: currentPath,
          preset: compressionPreset,
        });
        if (!result.success || !result.outputPath) {
          throw new Error(result.error || 'Failed to compress video');
        }
        currentPath = result.outputPath;
      }

      // Step 4: Remove watermark if specified
      if (watermarkRemoval) {
        const result = await this.removeWatermark({
          inputPath: currentPath,
        });
        if (!result.success || !result.outputPath) {
          throw new Error(result.error || 'Failed to remove watermark');
        }
        currentPath = result.outputPath;
      }

      // Final output
      const finalOutputPath = outputPath || currentPath;

      // Clean up intermediate files if different from final output
      if (currentPath !== inputPath && currentPath !== finalOutputPath) {
        // In a real implementation, we would clean up here
        // For now, we'll just return the current path
      }

      return {
        success: true,
        outputPath: finalOutputPath,
      };
    } catch (error) {
      console.error('Failed to process video:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private static getAspectRatioDimensions(aspectRatio: AspectRatio): { width: number; height: number } {
    const ratios: Record<AspectRatio, { width: number; height: number }> = {
      '9:16': { width: 9, height: 16 },
      '16:9': { width: 16, height: 9 },
      '1:1': { width: 1, height: 1 },
      '4:5': { width: 4, height: 5 },
    };
    return ratios[aspectRatio] || { width: 16, height: 9 };
  }

  private static buildVerticalCommand(inputPath: string, outputPath: string, smartCrop: boolean): string[] {
    if (smartCrop) {
      return [
        '-i', inputPath,
        '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-movflags', '+faststart',
        outputPath
      ];
    }
    return [
      '-i', inputPath,
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-movflags', '+faststart',
      outputPath
    ];
  }

  private static buildHorizontalCommand(inputPath: string, outputPath: string, smartCrop: boolean): string[] {
    if (smartCrop) {
      return [
        '-i', inputPath,
        '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-movflags', '+faststart',
        outputPath
      ];
    }
    return [
      '-i', inputPath,
      '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-movflags', '+faststart',
      outputPath
    ];
  }

  private static buildSquareCommand(inputPath: string, outputPath: string, smartCrop: boolean): string[] {
    if (smartCrop) {
      return [
        '-i', inputPath,
        '-vf', 'scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-movflags', '+faststart',
        outputPath
      ];
    }
    return [
      '-i', inputPath,
      '-vf', 'scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-movflags', '+faststart',
      outputPath
    ];
  }

  private static buildPortraitCommand(inputPath: string, outputPath: string, smartCrop: boolean): string[] {
    if (smartCrop) {
      return [
        '-i', inputPath,
        '-vf', 'scale=1080:1350:force_original_aspect_ratio=decrease,pad=1080:1350:(ow-iw)/2:(oh-ih)/2',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-movflags', '+faststart',
        outputPath
      ];
    }
    return [
      '-i', inputPath,
      '-vf', 'scale=1080:1350:force_original_aspect_ratio=decrease,pad=1080:1350:(ow-iw)/2:(oh-ih)/2',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-movflags', '+faststart',
      outputPath
    ];
  }

  private static buildDefaultCommand(inputPath: string, outputPath: string): string[] {
    return [
      '-i', inputPath,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-movflags', '+faststart',
      outputPath
    ];
  }

  private static getCompressionSettings(preset: 'low' | 'medium' | 'high'): {
    videoCodec: string;
    audioCodec: string;
    videoBitrate: string;
    audioBitrate: string;
    crf: number;
    preset: string;
  } {
    const settings = {
      low: {
        videoCodec: 'libx264',
        audioCodec: 'aac',
        videoBitrate: '1000k',
        audioBitrate: '128k',
        crf: 28,
        preset: 'ultrafast',
      },
      medium: {
        videoCodec: 'libx264',
        audioCodec: 'aac',
        videoBitrate: '2500k',
        audioBitrate: '192k',
        crf: 23,
        preset: 'fast',
      },
      high: {
        videoCodec: 'libx264',
        audioCodec: 'aac',
        videoBitrate: '5000k',
        audioBitrate: '256k',
        crf: 18,
        preset: 'slow',
      },
    };
    return settings[preset] || settings.medium;
  }

  private static getWatermarkCropParams(metadata: VideoMetadata, position: string): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    // Assume watermark is in the center and we want to crop it out
    // This is a simplified approach - in reality, you'd need computer vision
    const { width, height } = metadata;
    
    // Calculate safe crop area (remove 10% from each side)
    const cropWidth = Math.floor(width * 0.8);
    const cropHeight = Math.floor(height * 0.8);
    const cropX = Math.floor(width * 0.1);
    const cropY = Math.floor(height * 0.1);

    return { x: cropX, y: cropY, width: cropWidth, height: cropHeight };
  }

  private static getWatermarkPositionParams(position: string): { x: string; y: string } {
    const positions = {
      'top-left': { x: '10', y: '10' },
      'top-right': { x: 'W-w-10', y: '10' },
      'bottom-left': { x: '10', y: 'H-h-10' },
      'bottom-right': { x: 'W-w-10', y: 'H-h-10' },
      'center': { x: '(W-w)/2', y: '(H-h)/2' },
    };
    return positions[position as keyof typeof positions] || positions['bottom-right'];
  }

  private static getOutputFiles(directory: string, prefix: string): string[] {
    // In a real implementation, we would read the directory and filter files
    // For now, return a mock array
    return [join(directory, `${prefix}001.mp4`)];
  }

  private static mapToVideoMetadata(data: any): VideoMetadata {
    const format = data.format || {};
    const streams = data.streams || [];
    const videoStream = streams.find((s: any) => s.codec_type === 'video') || {};

    return {
      duration: parseFloat(format.duration || '0'),
      width: parseInt(videoStream.width || '0'),
      height: parseInt(videoStream.height || '0'),
      codec: videoStream.codec_name || '',
      fps: parseFloat(videoStream.r_frame_rate || '0'),
      bitrate: parseInt(format.bit_rate || '0'),
      size: parseInt(format.size || '0'),
    };
  }
}
