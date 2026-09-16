'use client';

import { useState, useCallback } from 'react';
import { 
  Link2, 
  Sparkles, 
  Scissors,
  EyeOff,
  Settings2,
  PlayCircle,
  Clock,
  Plus
} from 'lucide-react';
import { PlatformIcon } from '../platforms/PlatformIcon';
import { Platform, ContentType, AspectRatio, JobStatus } from '@/types';
import { useJobs } from '@/store/JobContext';
import { useToast } from '../ui/useToast';

const platforms: Platform[] = [
  'youtube',
  'tiktok',
  'instagram',
  'facebook',
  'twitter',
  'linkedin',
  'threads',
  'snapchat',
  'pinterest',
];

const contentTypes: ContentType[] = ['reel', 'short', 'long_video', 'story', 'post'];
const aspectRatios: AspectRatio[] = ['9:16', '16:9', '1:1', '4:5'];

export function NewJobView() {
  const { addJob } = useJobs();
  const { addToast } = useToast();
  const [url, setUrl] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set());
  const [contentType, setContentType] = useState<ContentType>('reel');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [watermarkRemoval, setWatermarkRemoval] = useState(false);
  const [compression, setCompression] = useState<'low' | 'medium' | 'high'>('medium');
  const [splitVideos, setSplitVideos] = useState(true);
  const [scheduleTime, setScheduleTime] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const togglePlatform = useCallback((platform: Platform) => {
    setSelectedPlatforms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(platform)) {
        newSet.delete(platform);
      } else {
        newSet.add(platform);
      }
      return newSet;
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      addToast('Please enter a URL', 'error');
      return;
    }

    if (selectedPlatforms.size === 0) {
      addToast('Please select at least one platform', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      const newJob = {
        id: `job_${Date.now()}`,
        url: url.trim(),
        platforms: Array.from(selectedPlatforms),
        contentType,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        hashtags: hashtags.trim() ? hashtags.trim().split(/[,\s]+/).filter(Boolean) : undefined,
        aspectRatio,
        autoGenerateMetadata: autoGenerate,
        watermarkRemoval,
        compressionPreset: compression,
        splitLongVideos: splitVideos,
        scheduleTime: scheduleTime ? new Date(scheduleTime) : undefined,
        status: 'pending' as JobStatus,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addJob(newJob);
      addToast(`Job created: ${newJob.id}`, 'success');
      
      // Reset form
      setUrl('');
      setSelectedPlatforms(new Set());
      setTitle('');
      setDescription('');
      setHashtags('');
    } catch (error) {
      addToast(`Failed to create job: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [url, selectedPlatforms, contentType, title, description, hashtags, aspectRatio, autoGenerate, watermarkRemoval, compression, splitVideos, scheduleTime, addJob, addToast]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedUrl = e.dataTransfer.getData('text/uri-list');
    if (droppedUrl) {
      setUrl(droppedUrl);
    }
  }, []);

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-clipforge-orange" />
          <h1 className="text-clipforge-offWhite font-medium">New Job</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL Input */}
        <div className="card">
          <label className="block text-xs text-muted-foreground/70 mb-2 uppercase tracking-wider">
            Video URL <span className="text-clipforge-orange">*</span>
          </label>
          <div
            className={`border border-dashed border-border/40 rounded p-6 text-center transition-colors ${
              isDragging ? 'bg-border/20 border-clipforge-cyan' : ''
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste video URL here or drop to upload"
              className="w-full bg-transparent border-none outline-none text-clipforge-offWhite placeholder:text-muted-foreground/50 text-sm"
            />
            <p className="text-xs text-muted-foreground/40 mt-2">
              Supported: YouTube, TikTok, Instagram, Twitter, Facebook, and 1000+ sites via yt-dlp
            </p>
          </div>
        </div>

        {/* Platform Selection */}
        <div className="card">
          <label className="block text-xs text-muted-foreground/70 mb-2 uppercase tracking-wider">
            Target Platforms <span className="text-clipforge-orange">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors ${
                  selectedPlatforms.has(platform)
                    ? 'bg-clipforge-orange text-white'
                    : 'bg-border/40 text-muted-foreground hover:bg-border/60'
                }`}
              >
                <PlatformIcon platform={platform} className="w-4 h-4" />
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content Type */}
        <div className="card">
          <label className="block text-xs text-muted-foreground/70 mb-2 uppercase tracking-wider">
            Content Type
          </label>
          <div className="flex flex-wrap gap-2">
            {contentTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setContentType(type)}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  contentType === type
                    ? 'bg-clipforge-orange text-white'
                    : 'bg-border/40 text-muted-foreground hover:bg-border/60'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Aspect Ratio */}
          <div className="card">
            <label className="block text-xs text-muted-foreground/70 mb-2 uppercase tracking-wider">
              Aspect Ratio
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="w-full bg-border/40 border border-border/40 rounded p-2 text-clipforge-offWhite text-sm"
            >
              {aspectRatios.map((ratio) => (
                <option key={ratio} value={ratio} className="bg-clipforge-dark">
                  {ratio}
                </option>
              ))}
            </select>
          </div>

          {/* Compression */}
          <div className="card">
            <label className="block text-xs text-muted-foreground/70 mb-2 uppercase tracking-wider">
              Compression
            </label>
            <select
              value={compression}
              onChange={(e) => setCompression(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full bg-border/40 border border-border/40 rounded p-2 text-clipforge-offWhite text-sm"
            >
              {['low', 'medium', 'high'].map((preset) => (
                <option key={preset} value={preset} className="bg-clipforge-dark">
                  {preset.charAt(0).toUpperCase() + preset.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Metadata Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <label className="text-xs text-muted-foreground/70 uppercase tracking-wider">
              Metadata
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={autoGenerate}
                onChange={(e) => setAutoGenerate(e.target.checked)}
                className="w-3 h-3 accent-clipforge-orange"
              />
              <Sparkles className="w-4 h-4 text-clipforge-cyan" />
              <span className="text-xs text-muted-foreground/70">Auto-generate</span>
            </label>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (auto-generated if empty)"
              disabled={autoGenerate}
              className="w-full bg-border/40 border border-border/40 rounded p-2 text-clipforge-offWhite placeholder:text-muted-foreground/50 text-sm disabled:opacity-50"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (auto-generated if empty)"
              disabled={autoGenerate}
              rows={3}
              className="w-full bg-border/40 border border-border/40 rounded p-2 text-clipforge-offWhite placeholder:text-muted-foreground/50 text-sm disabled:opacity-50 resize-none"
            />
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="Hashtags (comma or space separated)"
              disabled={autoGenerate}
              className="w-full bg-border/40 border border-border/40 rounded p-2 text-clipforge-offWhite placeholder:text-muted-foreground/50 text-sm disabled:opacity-50"
            />
          </div>
        </div>

        {/* Processing Options */}
        <div className="card">
          <label className="block text-xs text-muted-foreground/70 mb-4 uppercase tracking-wider">
            Processing Options
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={splitVideos}
                onChange={(e) => setSplitVideos(e.target.checked)}
                className="w-3 h-3 accent-clipforge-orange"
              />
              <Scissors className="w-4 h-4 text-muted-foreground/70" />
              <span className="text-sm text-muted-foreground/70">Split long videos (≤60s)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={watermarkRemoval}
                onChange={(e) => setWatermarkRemoval(e.target.checked)}
                className="w-3 h-3 accent-clipforge-orange"
              />
              <EyeOff className="w-4 h-4 text-muted-foreground/70" />
              <span className="text-sm text-muted-foreground/70">Watermark removal</span>
            </label>
          </div>
        </div>

        {/* Scheduling */}
        <div className="card">
          <label className="block text-xs text-muted-foreground/70 mb-2 uppercase tracking-wider">
            Scheduling
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="schedule"
                checked={!scheduleTime}
                onChange={() => setScheduleTime('')}
                className="w-3 h-3 accent-clipforge-orange"
              />
              <PlayCircle className="w-4 h-4 text-muted-foreground/70" />
              <span className="text-sm text-muted-foreground/70">Publish immediately</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="schedule"
                checked={!!scheduleTime}
                onChange={() => setScheduleTime(new Date(Date.now() + 3600000).toISOString().slice(0, 16))}
                className="w-3 h-3 accent-clipforge-orange"
              />
              <Clock className="w-4 h-4 text-muted-foreground/70" />
              <input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                disabled={!scheduleTime}
                className="bg-border/40 border border-border/40 rounded p-1 text-clipforge-offWhite text-sm disabled:opacity-50"
              />
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isProcessing || !url.trim() || selectedPlatforms.size === 0}
            className={`flex items-center gap-2 px-6 py-2 rounded text-sm font-medium transition-colors ${
              isProcessing || !url.trim() || selectedPlatforms.size === 0
                ? 'bg-border/40 text-muted-foreground/70 cursor-not-allowed'
                : 'bg-clipforge-orange hover:bg-clipforge-orange/90 text-white'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add to Queue
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
