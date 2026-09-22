'use client';

import { useState } from 'react';
import { 
  Plus, 
  ListTodo as Queue, 
  History, 
  Users, 
  Settings as SettingsIcon,
  Clipboard,
  X,
  Loader2,
  BarChart3
} from 'lucide-react';
import { PlatformIcon } from '../platforms/PlatformIcon';
import { Platform } from '@/types';

interface SidebarProps {
  activeView: 'new' | 'queue' | 'history' | 'accounts' | 'settings' | 'analytics';
  onViewChange: (view: 'new' | 'queue' | 'history' | 'accounts' | 'settings' | 'analytics') => void;
}

const navItems = [
  { id: 'new', label: 'New Job', icon: Plus },
  { id: 'queue', label: 'Queue', icon: Queue },
  { id: 'history', label: 'History', icon: History },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'accounts', label: 'Accounts', icon: Users },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

const platformOrder: Platform[] = [
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

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<Platform>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const togglePlatform = (platform: Platform) => {
    const newSet = new Set(connectedPlatforms);
    if (newSet.has(platform)) {
      newSet.delete(platform);
    } else {
      newSet.add(platform);
    }
    setConnectedPlatforms(newSet);
  };

  return (
    <aside className={`sidebar flex flex-col h-full border-r border-border/40 bg-clipforge-dark`}>
      {/* Header */}
      <div className="p-4 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clipboard className="w-5 h-5 text-clipforge-orange" />
          {!isCollapsed && <span className="font-bold text-clipforge-offWhite text-sm">ClipForge</span>}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-border/40 rounded"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-2 flex-1">
        <div className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as any)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                activeView === item.id
                  ? 'bg-clipforge-orange/20 text-clipforge-orange'
                  : 'text-muted-foreground hover:bg-border/40 hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </div>

        {/* Platforms Section */}
        {!isCollapsed && (
          <>
            <div className="pt-4 pb-2 px-3">
              <span className="text-xs text-muted-foreground/70 uppercase tracking-wider">Platforms</span>
            </div>
            <div className="px-2 space-y-1">
              {platformOrder.map((platform) => (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                    connectedPlatforms.has(platform)
                      ? 'bg-clipforge-orange/20 text-clipforge-orange'
                      : 'text-muted-foreground hover:bg-border/40'
                  }`}
                >
                  <PlatformIcon platform={platform} className="w-4 h-4" />
                  <span className="flex-1 text-left">{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                  {connectedPlatforms.has(platform) ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <div className="w-3 h-3 border border-border/40 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-border/40">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-muted-foreground/70">
          <div className="w-2 h-2 bg-clipforge-orange rounded-full" />
          {!isCollapsed && <span>v1.0.0</span>}
        </div>
      </div>
    </aside>
  );
}
