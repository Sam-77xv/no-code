'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Workspace } from '@/components/layout/Workspace';
import { StatusBar } from '@/components/layout/StatusBar';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { JobProvider } from '@/store/JobContext';
import { SettingsProvider } from '@/store/SettingsContext';

export default function Home() {
  const [activeView, setActiveView] = useState<'new' | 'queue' | 'history' | 'accounts' | 'settings'>('new');

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ToastProvider>
        <SettingsProvider>
          <JobProvider>
            <Sidebar activeView={activeView} onViewChange={setActiveView} />
            <main className="flex-1 flex flex-col min-w-0">
              <Workspace activeView={activeView} />
              <StatusBar />
            </main>
          </JobProvider>
        </SettingsProvider>
      </ToastProvider>
    </div>
  );
}
