'use client';

import { ComponentProps } from 'react';
import {
  Youtube,
  Music2 as Tiktok,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  MessageSquare as Threads,
  Ghost as Snapchat,
  Image as Pinterest,
} from 'lucide-react';
import { Platform } from '@/types';

const platformIcons: Record<Platform, React.ComponentType<ComponentProps<'svg'>>> = {
  youtube: Youtube,
  tiktok: Tiktok,
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  threads: Threads,
  snapchat: Snapchat,
  pinterest: Pinterest,
};

interface PlatformIconProps extends ComponentProps<'svg'> {
  platform: Platform;
}

export function PlatformIcon({ platform, ...props }: PlatformIconProps) {
  const Icon = platformIcons[platform];
  return <Icon {...props} />;
}
