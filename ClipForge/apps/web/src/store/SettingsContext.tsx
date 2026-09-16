'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { AppSettings, Platform, ContentType, AspectRatio } from '@/types';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  defaultPlatforms: ['youtube', 'tiktok', 'instagram'],
  defaultContentType: 'reel',
  defaultAspectRatio: '9:16',
  autoGenerateMetadata: true,
  watermarkRemoval: false,
  compressionPreset: 'medium',
  splitLongVideos: true,
  maxRetries: 3,
  downloadPath: '',
  theme: 'dark',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('clipforge_settings');
    if (savedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      } catch (error) {
        console.error('Failed to parse settings:', error);
      }
    }
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      // Save to localStorage
      localStorage.setItem('clipforge_settings', JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.removeItem('clipforge_settings');
  }, []);

  const value: SettingsContextType = {
    settings,
    updateSettings,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
