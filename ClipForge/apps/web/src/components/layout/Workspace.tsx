'use client';

import { useState } from 'react';
import { NewJobView } from '../jobs/NewJobView';
import { QueueView } from '../jobs/QueueView';
import { HistoryView } from '../jobs/HistoryView';
import { AccountsView } from '../jobs/AccountsView';
import { SettingsView } from '../jobs/SettingsView';
import { AnalyticsView } from '../jobs/AnalyticsView';

interface WorkspaceProps {
  activeView: 'new' | 'queue' | 'history' | 'accounts' | 'settings' | 'analytics';
}

export function Workspace({ activeView }: WorkspaceProps) {
  return (
    <div className="flex-1 overflow-auto workspace">
      {activeView === 'new' && <NewJobView />}
      {activeView === 'queue' && <QueueView />}
      {activeView === 'history' && <HistoryView />}
      {activeView === 'analytics' && <AnalyticsView />}
      {activeView === 'accounts' && <AccountsView />}
      {activeView === 'settings' && <SettingsView />}
    </div>
  );
}
