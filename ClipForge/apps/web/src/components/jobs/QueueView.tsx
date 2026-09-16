'use client';

import { useState, useEffect } from 'react';
import { PlayCircle, PauseCircle, XCircle, CheckCircle2, Clock, MoreVertical } from 'lucide-react';
import { useJobs } from '@/store/JobContext';
import { PlatformIcon } from '../platforms/PlatformIcon';
import { Job, JobStatus, Platform } from '@/types';

export function QueueView() {
  const { jobs, updateJob, removeJob } = useJobs();
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());

  const queueJobs = jobs.filter(job => job.status === 'pending' || job.status === 'downloading' || job.status === 'processing' || job.status === 'uploading');

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
    setSelectedJobs(new Set(queueJobs.map(job => job.id)));
  };

  const deselectAll = () => {
    setSelectedJobs(new Set());
  };

  const handleProcessSelected = () => {
    selectedJobs.forEach(jobId => {
      updateJob(jobId, { status: 'processing' });
    });
    deselectAll();
  };

  const handleCancelSelected = () => {
    selectedJobs.forEach(jobId => {
      updateJob(jobId, { status: 'cancelled' });
    });
    deselectAll();
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-muted-foreground/30 text-muted-foreground';
      case 'downloading':
        return 'bg-clipforge-cyan/20 text-clipforge-cyan';
      case 'processing':
        return 'bg-clipforge-orange/20 text-clipforge-orange';
      case 'uploading':
        return 'bg-clipforge-cyan/20 text-clipforge-cyan';
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

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-clipforge-cyan" />
          <h1 className="text-clipforge-offWhite font-medium">Queue</h1>
          <span className="text-xs bg-border/40 px-2 py-0.5 rounded">{queueJobs.length} jobs</span>
        </div>
        <div className="flex items-center gap-2">
          {selectedJobs.size > 0 && (
            <>
              <button
                onClick={handleProcessSelected}
                className="flex items-center gap-1 px-3 py-1.5 bg-clipforge-orange/20 text-clipforge-orange text-xs rounded hover:bg-clipforge-orange/30"
              >
                <PlayCircle className="w-3 h-3" />
                Process ({selectedJobs.size})
              </button>
              <button
                onClick={handleCancelSelected}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-500 text-xs rounded hover:bg-red-500/30"
              >
                <XCircle className="w-3 h-3" />
                Cancel ({selectedJobs.size})
              </button>
            </>
          )}
        </div>
      </div>

      {queueJobs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50">
          <PlayCircle className="w-12 h-12 mb-4" />
          <p>No jobs in queue</p>
          <p className="text-xs mt-2">Add a new job to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Table Header */}
          <div className="grid grid-cols-[40px_200px_150px_100px_100px_80px_40px] gap-2 px-2 py-2 border-b border-border/40">
            <label className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={selectedJobs.size === queueJobs.length && queueJobs.length > 0}
                onChange={selectedJobs.size === queueJobs.length ? deselectAll : selectAll}
                className="w-3 h-3 accent-clipforge-orange"
              />
            </label>
            <span className="text-xs text-muted-foreground/70 uppercase tracking-wider">Job</span>
            <span className="text-xs text-muted-foreground/70 uppercase tracking-wider">Platforms</span>
            <span className="text-xs text-muted-foreground/70 uppercase tracking-wider">Status</span>
            <span className="text-xs text-muted-foreground/70 uppercase tracking-wider">Progress</span>
            <span className="text-xs text-muted-foreground/70 uppercase tracking-wider">Time</span>
            <span></span>
          </div>

          {/* Job Rows */}
          {queueJobs.map((job) => (
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
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(job.status)}`}>
                {job.status}
              </span>

              {/* Progress */}
              <div className="flex items-center gap-2">
                <div className="w-full h-2 bg-border/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-clipforge-orange transition-all"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground/70">{job.progress}%</span>
              </div>

              {/* Time */}
              <span className="text-xs text-muted-foreground/70">{formatDate(job.createdAt)}</span>

              {/* Actions */}
              <button
                onClick={() => removeJob(job.id)}
                className="p-1 hover:bg-border/40 rounded text-muted-foreground/70 hover:text-foreground"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
