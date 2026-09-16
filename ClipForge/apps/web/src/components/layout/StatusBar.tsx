'use client';

import { useState, useEffect } from 'react';
import { Wifi, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export function StatusBar() {
  const [time, setTime] = useState(new Date());
  const [logs, setLogs] = useState<string[]>([
    '$ ready',
    '$ ClipForge v1.0.0 initialized',
  ]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="status-bar flex items-center justify-between min-h-[32px]">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-clipforge-cyan" />
          <span className="text-xs text-clipforge-cyan">● connected</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground/70" />
          <span className="text-xs text-muted-foreground/70">{formatTime(time)}</span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex gap-4 text-xs">
          {logs.map((log, index) => (
            <span key={index} className="text-muted-foreground/70 truncate">
              {log}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground/70">⌘K</span>
      </div>
    </div>
  );
}
