'use client';

import { useState } from 'react';
import { Settings as SettingsIcon, Save, Undo, FolderOpen, Cpu, Palette, Trash2 } from 'lucide-react';
import { useSettings } from '@/store/SettingsContext';
import { Platform, ContentType, AspectRatio } from '@/types';

export function SettingsView() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [tempSettings, setTempSettings] = useState({ ...settings });
  const [isChanged, setIsChanged] = useState(false);

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

  const handleChange = <K extends keyof typeof tempSettings>(key: K, value: (typeof tempSettings)[K]) => {
    setTempSettings(prev => ({ ...prev, [key]: value }));
    setIsChanged(true);
  };

  const togglePlatform = (platform: Platform) => {
    setTempSettings(prev => {
      const currentPlatforms = prev.defaultPlatforms || [];
      const newPlatforms = currentPlatforms.includes(platform)
        ? currentPlatforms.filter(p => p !== platform)
        : [...currentPlatforms, platform];
      return { ...prev, defaultPlatforms: newPlatforms };
    });
    setIsChanged(true);
  };

  const handleSave = () => {
    updateSettings(tempSettings);
    setIsChanged(false);
  };

  const handleReset = () => {
    setTempSettings({ ...settings });
    setIsChanged(false);
  };

  const handleFactoryReset = () => {
    resetSettings();
    setTempSettings({ ...settings });
    setIsChanged(false);
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-clipforge-cyan" />
          <h1 className="text-clipforge-offWhite font-medium">Settings</h1>
        </div>
        <div className="flex items-center gap-2">
          {isChanged && (
            <>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-3 py-1.5 bg-muted-foreground/20 text-muted-foreground text-xs rounded hover:bg-muted-foreground/30"
              >
                <Undo className="w-3 h-3" />
                Revert
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-1.5 bg-clipforge-orange/20 text-clipforge-orange text-xs rounded hover:bg-clipforge-orange/30"
              >
                <Save className="w-3 h-3" />
                Save
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Default Platforms */}
        <div className="card p-4">
          <h3 className="text-sm text-clipforge-offWhite mb-4">Default Platforms</h3>
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => {
              const isSelected = (tempSettings.defaultPlatforms || []).includes(platform);
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors ${
                    isSelected
                      ? 'bg-clipforge-orange text-white'
                      : 'bg-border/40 text-muted-foreground hover:bg-border/60'
                  }`}
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Settings */}
        <div className="card p-4">
          <h3 className="text-sm text-clipforge-offWhite mb-4">Content Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground/70">Default Content Type</label>
              <select
                value={tempSettings.defaultContentType || 'reel'}
                onChange={(e) => handleChange('defaultContentType', e.target.value as ContentType)}
                className="bg-border/40 border border-border/40 rounded p-1.5 text-clipforge-offWhite text-sm"
              >
                {contentTypes.map((type) => (
                  <option key={type} value={type} className="bg-clipforge-dark">
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground/70">Default Aspect Ratio</label>
              <select
                value={tempSettings.defaultAspectRatio || '9:16'}
                onChange={(e) => handleChange('defaultAspectRatio', e.target.value as AspectRatio)}
                className="bg-border/40 border border-border/40 rounded p-1.5 text-clipforge-offWhite text-sm"
              >
                {aspectRatios.map((ratio) => (
                  <option key={ratio} value={ratio} className="bg-clipforge-dark">
                    {ratio}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Processing Settings */}
        <div className="card p-4">
          <h3 className="text-sm text-clipforge-offWhite mb-4">Processing Settings</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-muted-foreground/70">Auto-generate metadata</span>
              <input
                type="checkbox"
                checked={tempSettings.autoGenerateMetadata ?? true}
                onChange={(e) => handleChange('autoGenerateMetadata', e.target.checked)}
                className="w-4 h-4 accent-clipforge-orange"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-muted-foreground/70">Watermark removal</span>
              <input
                type="checkbox"
                checked={tempSettings.watermarkRemoval ?? false}
                onChange={(e) => handleChange('watermarkRemoval', e.target.checked)}
                className="w-4 h-4 accent-clipforge-orange"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-muted-foreground/70">Split long videos (≤60s)</span>
              <input
                type="checkbox"
                checked={tempSettings.splitLongVideos ?? true}
                onChange={(e) => handleChange('splitLongVideos', e.target.checked)}
                className="w-4 h-4 accent-clipforge-orange"
              />
            </label>
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground/70">Compression Preset</label>
              <select
                value={tempSettings.compressionPreset || 'medium'}
                onChange={(e) => handleChange('compressionPreset', e.target.value as 'low' | 'medium' | 'high')}
                className="bg-border/40 border border-border/40 rounded p-1.5 text-clipforge-offWhite text-sm"
              >
                {['low', 'medium', 'high'].map((preset) => (
                  <option key={preset} value={preset} className="bg-clipforge-dark">
                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground/70">Max Retries</label>
              <input
                type="number"
                value={tempSettings.maxRetries || 3}
                onChange={(e) => handleChange('maxRetries', Number(e.target.value))}
                min="1"
                max="10"
                className="w-16 bg-border/40 border border-border/40 rounded p-1.5 text-clipforge-offWhite text-sm text-center"
              />
            </div>
          </div>
        </div>

        {/* Path Settings */}
        <div className="card p-4">
          <h3 className="text-sm text-clipforge-offWhite mb-4">Path Settings</h3>
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground/70">Download Path</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempSettings.downloadPath || ''}
                onChange={(e) => handleChange('downloadPath', e.target.value)}
                placeholder="Default download location"
                className="w-64 bg-border/40 border border-border/40 rounded p-1.5 text-clipforge-offWhite text-sm"
              />
              <button className="p-1.5 hover:bg-border/40 rounded text-muted-foreground/70 hover:text-foreground">
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="card p-4">
          <h3 className="text-sm text-clipforge-offWhite mb-4">Appearance</h3>
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground/70">Theme</label>
            <select
              value={tempSettings.theme || 'dark'}
              onChange={(e) => handleChange('theme', e.target.value as 'dark' | 'light' | 'system')}
              className="bg-border/40 border border-border/40 rounded p-1.5 text-clipforge-offWhite text-sm"
            >
              {['dark', 'light', 'system'].map((theme) => (
                <option key={theme} value={theme} className="bg-clipforge-dark">
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card p-4 border-red-500/30">
          <h3 className="text-sm text-red-500 mb-4">Danger Zone</h3>
          <button
            onClick={handleFactoryReset}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-500 text-sm rounded hover:bg-red-500/30"
          >
            <Trash2 className="w-4 h-4" />
            Reset all settings to default
          </button>
        </div>
      </div>
    </div>
  );
}
