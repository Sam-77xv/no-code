'use client';

import { useState } from 'react';
import { History, Clock, CheckCircle2, XCircle, MoreVertical, Eye, Trash2 } from 'lucide-react';
import { useJobs } from '@/store/JobContext';
import { PlatformIcon } from '../platforms/PlatformIcon';
import { Job, JobStatus, Platform } from '@/types';

export function HistoryView() {
  const { jobs, removeJob } = useJobs();
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed' | 'cancelled'>('all');

  const historyJobs = jobs.filter(job => 
    job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled'
  );

  const filteredJobs = filter === 'all' 
    ? historyJobs 
    : historyJobs.filter(job => job.status === filter);

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedJobs(new Set(filteredJobs.map(job => job.id)));
  };

  const deselectAll = () => {
    setSelectedJobs(new Set());
  };

  const handleDeleteSelected = () => {
    selectedJobs.forEach(jobId => {
      removeJob(jobId);
    });
    deselectAll();
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-500';
      case 'failed':
        return 'bg-red-500/20 text-red-500';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-500';
      default:
        return 'bg-muted-foreground/30 text-muted-foreground';
    }
  };

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'completed':
        return CheckCircle2;
      case 'failed':
        return XCircle;
      case 'cancelled':
        return XCircle;
      default:
        return Clock;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start: Date, end?: Date) => {
    if (!end) return '0s';
    const diff = (end.getTime() - start.getTime()) / 1000;
    if (diff < 60) return `${Math.round(diff)}s`;
    if (diff < 3600) return `${Math.round(diff / 60)}m`;
    return `${Math.round(diff / 3600)}h`;
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-clipforge-cyan" />
          <h1 className="text-clipforge-offWhite font-medium">History</h1>
          <span className="text-xs bg-border/40 px-2 py-0.5 rounded">{historyJobs.length} jobs</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-border/40 border border-border/40 rounded p-1.5 text-clipforge-offWhite text-xs"
          >
            <option value="all" className="bg-clipforge-dark">All</option>
            <option value="completed" className="bg-clipforge-dark">Completed</option>
            <option value="failed" className="bg-clipforge-dark">Failed</option>
            <option value="cancelled" className="bg-clipforge-dark">Cancelled</option>
          </select>
          {selectedJobs.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-500 text-xs rounded hover:bg-red-500/30"
            >
              <Trash2 className="w-3 h-3" />
              Delete ({selectedJobs.size})
            </button>
          )}
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50">
          <History className="w-12 h-12 mb-4" />
          <p>No history yet</p>
          <p className="text-xs mt-2">Completed jobs will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Table Header */}
          <div className="grid grid-cols-[40px_200px_150px_100px_100px_80px_40px] gap-2 px-2 py-2 border-b border-border/40">
            <label className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={selectedJobs.size === filteredJobs.length && filteredJobs.length > 0}
                onChange={selectedJobs.size === filteredJobs.length ? deselectAll : selectAll}
                className="w-3 h-3 accent-clipforge-orange"
              />
            </label>
            <span className="text-xs text-muted-foreground/70 uppercase tracking-wider">Job</span>
            <span className="text-xs text-muted-foreground/70 uppercase tracking-wider">Platforms</span>
            <span className="text-xs text-muted-foreground/70 uppercase tracking-wider">Status</span>
            <span className="text-xs text-muted-foreground/70 uppercase tracking-wider">Duration</span>
            <span className="text-xs text-muted-foreground/70 uppercase tracking-wider">Time</span>
            <span></span>
          </div>

          {/* Job Rows */}
          {filteredJobs.map((job) => {
            const StatusIcon = getStatusIcon(job.status);
            return (
              <div
                key={job.id}
                className={`grid grid-cols-[40px_200px_150px_100px_100px_80px_40px] gap-2 px-2 py-2 rounded transition-colors ${
                  selectedJobs.has(job.id) ? 'bg-border/40' : 'hover:bg-border/20'
                }`}
              >
                <label className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedJobs.has(job.id)}
                    onChange={() => toggleJobSelection(job.id)}
                    className="w-3 h-3 accent-clipforge-orange"
                  />
                </label>
                
                {/* Job Info */}
                <div className="flex flex-col">
                  <span className="text-sm text-clipforge-offWhite truncate">{job.url}</span>
                  <span className="text-xs text-muted-foreground/50">{job.id}</span>
                </div>

                {/* Platforms */}
                <div className="flex gap-1">
                  {job.platforms.slice(0, 3).map((platform) => (
                    <PlatformIcon key={platform} platform={platform as Platform} className="w-4 h-4" />
                  ))}
                  {job.platforms.length > 3 && (
                    <span className="text-xs text-muted-foreground/50">+{job.platforms.length - 3}</span>
                  )}
                </div>

                {/* Status */}
                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getStatusColor(job.status)}`}>
                  <StatusIcon className="w-3 h-3" />
                  {job.status}
                </span>

                {/* Duration */}
                <span className="text-xs text-muted-foreground/70">{formatDuration(job.createdAt, job.updatedAt)}</span>

                {/* Time */}
                <span className="text-xs text-muted-foreground/70">{formatDate(job.updatedAt)}</span>

                {/* Actions */}
                <button
                  onClick={() => removeJob(job.id)}
                  className="p-1 hover:bg-border/40 rounded text-muted-foreground/70 hover:text-foreground"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
