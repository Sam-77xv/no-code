'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Job, JobStatus } from '@/types';

interface JobContextType {
  jobs: Job[];
  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  removeJob: (id: string) => void;
  getJob: (id: string) => Job | undefined;
  clearJobs: () => void;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export function JobProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);

  const addJob = useCallback((job: Job) => {
    setJobs(prev => [...prev, job]);
  }, []);

  const updateJob = useCallback((id: string, updates: Partial<Job>) => {
    setJobs(prev => 
      prev.map(job => job.id === id ? { ...job, ...updates, updatedAt: new Date() } : job)
    );
  }, []);

  const removeJob = useCallback((id: string) => {
    setJobs(prev => prev.filter(job => job.id !== id));
  }, []);

  const getJob = useCallback((id: string) => {
    return jobs.find(job => job.id === id);
  }, [jobs]);

  const clearJobs = useCallback(() => {
    setJobs([]);
  }, []);

  const value: JobContextType = {
    jobs,
    addJob,
    updateJob,
    removeJob,
    getJob,
    clearJobs,
  };

  return (
    <JobContext.Provider value={value}>
      {children}
    </JobContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
}
