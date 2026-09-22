'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Platform, UploadAnalytics, PLATFORMS } from '@/types';
import { PlatformIcon } from '../platforms/PlatformIcon';

export function AnalyticsView() {
  const [activeTab, setActiveTab] = useState<'overview' | 'platforms' | 'trend' | 'top'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<{
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalEngagement: number;
    byPlatform: Record<Platform, {
      views: number;
      likes: number;
      comments: number;
      shares: number;
      engagement: number;
      uploadCount: number;
    }>;
    recentJobs: UploadAnalytics[];
  } | null>(null);
  const [trendData, setTrendData] = useState<{
    dates: string[];
    views: number[];
    likes: number[];
    engagement: number[];
  } | null>(null);
  const [topJobs, setTopJobs] = useState<{
    jobId: string;
    videoId: string;
    platform: Platform;
    analytics: UploadAnalytics;
  }[]>([]);

  // Mock data - in production, this would come from the analytics service
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock aggregated data
      const mockAnalytics = {
        totalViews: 1568420,
        totalLikes: 89234,
        totalComments: 12456,
        totalShares: 5678,
        totalEngagement: 0.185,
        byPlatform: {
          youtube: { views: 452100, likes: 23456, comments: 3456, shares: 1234, engagement: 0.15, uploadCount: 15 },
          tiktok: { views: 678200, likes: 45678, comments: 5678, shares: 2345, engagement: 0.22, uploadCount: 25 },
          instagram: { views: 234500, likes: 12345, comments: 2345, shares: 1567, engagement: 0.18, uploadCount: 18 },
          facebook: { views: 123400, likes: 5678, comments: 890, shares: 456, engagement: 0.12, uploadCount: 12 },
          twitter: { views: 89200, likes: 2345, comments: 456, shares: 123, engagement: 0.10, uploadCount: 8 },
          linkedin: { views: 34500, likes: 1234, comments: 345, shares: 123, engagement: 0.15, uploadCount: 5 },
          threads: { views: 23400, likes: 890, comments: 234, shares: 45, engagement: 0.12, uploadCount: 3 },
          snapchat: { views: 12300, likes: 456, comments: 89, shares: 23, engagement: 0.10, uploadCount: 2 },
          pinterest: { views: 45600, likes: 2345, comments: 567, shares: 345, engagement: 0.20, uploadCount: 6 },
        },
        recentJobs: [
          { id: '1', jobId: 'job_001', platform: 'youtube', videoId: 'abc123', views: 45200, likes: 2345, comments: 345, shares: 123, engagementRate: 0.15, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
          { id: '2', jobId: 'job_002', platform: 'tiktok', videoId: 'def456', views: 67800, likes: 4567, comments: 567, shares: 234, engagementRate: 0.22, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
          { id: '3', jobId: 'job_003', platform: 'instagram', videoId: 'ghi789', views: 23400, likes: 1234, comments: 234, shares: 156, engagementRate: 0.18, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          { id: '4', jobId: 'job_004', platform: 'tiktok', videoId: 'jkl012', views: 56700, likes: 3456, comments: 456, shares: 190, engagementRate: 0.20, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
          { id: '5', jobId: 'job_005', platform: 'youtube', videoId: 'mno345', views: 34500, likes: 1890, comments: 290, shares: 98, engagementRate: 0.16, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        ],
      };

      setAnalyticsData(mockAnalytics);

      // Mock trend data
      const mockTrend = {
        dates: Array.from({ length: 30 }, (_, i) => {
          const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
          return date.toISOString().split('T')[0];
        }),
        views: Array.from({ length: 30 }, (_, i) => Math.floor(Math.random() * 50000) + 20000),
        likes: Array.from({ length: 30 }, (_, i) => Math.floor(Math.random() * 2000) + 500),
        engagement: Array.from({ length: 30 }, () => Math.random() * 0.3),
      };
      setTrendData(mockTrend);

      // Mock top jobs
      setTopJobs([
        { jobId: 'job_002', videoId: 'def456', platform: 'tiktok', analytics: mockAnalytics.recentJobs[1] },
        { jobId: 'job_004', videoId: 'jkl012', platform: 'tiktok', analytics: mockAnalytics.recentJobs[3] },
        { jobId: 'job_001', videoId: 'abc123', platform: 'youtube', analytics: mockAnalytics.recentJobs[0] },
        { jobId: 'job_003', videoId: 'ghi789', platform: 'instagram', analytics: mockAnalytics.recentJobs[2] },
        { jobId: 'job_005', videoId: 'mno345', platform: 'youtube', analytics: mockAnalytics.recentJobs[4] },
      ]);

      setIsLoading(false);
    };

    fetchAnalytics();
  }, []);

  const filteredPlatforms = useMemo(() => {
    if (selectedPlatforms.size === 0) return PLATFORMS;
    return PLATFORMS.filter(p => selectedPlatforms.has(p));
  }, [selectedPlatforms]);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(platform)) {
        newSet.delete(platform);
      } else {
        newSet.add(platform);
      }
      return newSet;
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return (num * 100).toFixed(1) + '%';
  };

  const getPlatformStats = (platform: Platform) => {
    if (!analyticsData) return null;
    return analyticsData.byPlatform[platform];
  };

  const getTotalMetrics = () => {
    if (!analyticsData) return { views: 0, likes: 0, comments: 0, shares: 0, engagement: 0 };
    return {
      views: analyticsData.totalViews,
      likes: analyticsData.totalLikes,
      comments: analyticsData.totalComments,
      shares: analyticsData.totalShares,
      engagement: analyticsData.totalEngagement,
    };
  };

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-clipforge-cyan" />
          <h1 className="text-clipforge-offWhite font-medium">Analytics</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-border/40 rounded px-2 py-1">
            <Calendar className="w-3 h-3 text-muted-foreground/70" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-transparent text-xs text-clipforge-offWhite border-none outline-none"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          <button
            onClick={() => {}}
            className="flex items-center gap-1 px-3 py-1.5 bg-border/40 text-clipforge-offWhite text-xs rounded hover:bg-border/60"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50">
          <RefreshCw className="w-12 h-12 animate-spin mb-4" />
          <p>Loading analytics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-border/40">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 text-xs rounded-t transition-colors ${
                activeTab === 'overview'
                  ? 'bg-clipforge-orange/20 text-clipforge-orange'
                  : 'text-muted-foreground hover:bg-border/40'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('platforms')}
              className={`px-3 py-2 text-xs rounded-t transition-colors ${
                activeTab === 'platforms'
                  ? 'bg-clipforge-orange/20 text-clipforge-orange'
                  : 'text-muted-foreground hover:bg-border/40'
              }`}
            >
              By Platform
            </button>
            <button
              onClick={() => setActiveTab('trend')}
              className={`px-3 py-2 text-xs rounded-t transition-colors ${
                activeTab === 'trend'
                  ? 'bg-clipforge-orange/20 text-clipforge-orange'
                  : 'text-muted-foreground hover:bg-border/40'
              }`}
            >
              Trend
            </button>
            <button
              onClick={() => setActiveTab('top')}
              className={`px-3 py-2 text-xs rounded-t transition-colors ${
                activeTab === 'top'
                  ? 'bg-clipforge-orange/20 text-clipforge-orange'
                  : 'text-muted-foreground hover:bg-border/40'
              }`}
            >
              Top Jobs
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-border/20 rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-clipforge-cyan" />
                      <span className="text-xs text-muted-foreground/70 uppercase">Total Views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-clipforge-offWhite">{formatNumber(getTotalMetrics().views)}</span>
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +12.5%
                      </span>
                    </div>
                  </div>

                  <div className="bg-border/20 rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-muted-foreground/70 uppercase">Total Likes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-clipforge-offWhite">{formatNumber(getTotalMetrics().likes)}</span>
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +8.3%
                      </span>
                    </div>
                  </div>

                  <div className="bg-border/20 rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-clipforge-orange" />
                      <span className="text-xs text-muted-foreground/70 uppercase">Comments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-clipforge-offWhite">{formatNumber(getTotalMetrics().comments)}</span>
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +15.2%
                      </span>
                    </div>
                  </div>

                  <div className="bg-border/20 rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Share2 className="w-4 h-4 text-clipforge-cyan" />
                      <span className="text-xs text-muted-foreground/70 uppercase">Shares</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-clipforge-offWhite">{formatNumber(getTotalMetrics().shares)}</span>
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +10.1%
                      </span>
                    </div>
                  </div>

                  <div className="bg-border/20 rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-muted-foreground/70 uppercase">Engagement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-clipforge-offWhite">{formatPercentage(getTotalMetrics().engagement)}</span>
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +5.7%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-border/20 rounded p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm text-clipforge-offWhite font-medium">Recent Activity</h3>
                    <span className="text-xs text-muted-foreground/70">Last 10 uploads</span>
                  </div>
                  <div className="space-y-2">
                    {analyticsData?.recentJobs.map((job, index) => (
                      <div
                        key={job.id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-border/40 transition-colors"
                      >
                        <PlatformIcon platform={job.platform} className="w-5 h-5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-clipforge-offWhite truncate">{job.videoId}</span>
                            <span className="text-xs text-muted-foreground/50">{job.jobId}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground/70">{formatNumber(job.views)} views</span>
                          <span className="text-xs text-muted-foreground/70">{formatNumber(job.likes)} likes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'platforms' && (
              <div className="space-y-4">
                {/* Platform Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground/70 uppercase">Filter Platforms:</span>
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        selectedPlatforms.has(platform)
                          ? 'bg-clipforge-orange/20 text-clipforge-orange'
                          : 'bg-border/40 text-muted-foreground hover:bg-border/60'
                      }`}
                    >
                      <PlatformIcon platform={platform} className="w-3 h-3" />
                      <span>{platform}</span>
                    </button>
                  ))}
                </div>

                {/* Platform Stats Table */}
                <div className="bg-border/20 rounded overflow-hidden">
                  <div className="grid grid-cols-[150px_100px_100px_100px_100px_100px_80px] gap-2 px-4 py-3 border-b border-border/40">
                    <span className="text-xs text-muted-foreground/70 uppercase">Platform</span>
                    <span className="text-xs text-muted-foreground/70 uppercase">Views</span>
                    <span className="text-xs text-muted-foreground/70 uppercase">Likes</span>
                    <span className="text-xs text-muted-foreground/70 uppercase">Comments</span>
                    <span className="text-xs text-muted-foreground/70 uppercase">Shares</span>
                    <span className="text-xs text-muted-foreground/70 uppercase">Engagement</span>
                    <span className="text-xs text-muted-foreground/70 uppercase">Uploads</span>
                  </div>
                  {filteredPlatforms.map((platform) => {
                    const stats = getPlatformStats(platform);
                    if (!stats) return null;
                    
                    return (
                      <div
                        key={platform}
                        className="grid grid-cols-[150px_100px_100px_100px_100px_100px_80px] gap-2 px-4 py-3 rounded hover:bg-border/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <PlatformIcon platform={platform} className="w-4 h-4" />
                          <span className="text-sm text-clipforge-offWhite">{platform}</span>
                        </div>
                        <span className="text-sm text-clipforge-offWhite">{formatNumber(stats.views)}</span>
                        <span className="text-sm text-clipforge-offWhite">{formatNumber(stats.likes)}</span>
                        <span className="text-sm text-clipforge-offWhite">{formatNumber(stats.comments)}</span>
                        <span className="text-sm text-clipforge-offWhite">{formatNumber(stats.shares)}</span>
                        <span className="text-sm text-clipforge-offWhite">{formatPercentage(stats.engagement)}</span>
                        <span className="text-sm text-muted-foreground/70">{stats.uploadCount}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Platform Performance Chart Placeholder */}
                <div className="bg-border/20 rounded p-4 h-64 flex flex-col items-center justify-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground/50">Platform Performance Chart</p>
                  <p className="text-xs text-muted-foreground/40">(Visualization would be rendered here)</p>
                </div>
              </div>
            )}

            {activeTab === 'trend' && (
              <div className="space-y-4">
                {/* Trend Chart Placeholder */}
                <div className="bg-border/20 rounded p-4 h-96 flex flex-col items-center justify-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground/50">Analytics Trend Chart</p>
                  <p className="text-xs text-muted-foreground/40">
                    Time series visualization of {timeRange} data
                  </p>
                  <p className="text-xs text-muted-foreground/40 mt-2">
                    Views: {trendData?.views.reduce((a, b) => a + b, 0) ?? 0} | 
                    Likes: {trendData?.likes.reduce((a, b) => a + b, 0) ?? 0}
                  </p>
                </div>

                {/* Trend Data Table */}
                <div className="bg-border/20 rounded overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                    <h3 className="text-sm text-clipforge-offWhite">Daily Metrics</h3>
                    <span className="text-xs text-muted-foreground/70">Last {timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : timeRange === '90d' ? '90' : 'all'} days</span>
                  </div>
                  <div className="p-4 space-y-2 max-h-64 overflow-auto">
                    {trendData?.dates.map((date, index) => (
                      <div
                        key={date}
                        className="grid grid-cols-[120px_100px_100px_100px] gap-2 px-2 py-1.5 rounded hover:bg-border/40 transition-colors"
                      >
                        <span className="text-xs text-muted-foreground/70">{date}</span>
                        <span className="text-sm text-clipforge-offWhite">{formatNumber(trendData.views[index])}</span>
                        <span className="text-sm text-clipforge-offWhite">{formatNumber(trendData.likes[index])}</span>
                        <span className="text-sm text-clipforge-offWhite">{formatPercentage(trendData.engagement[index])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'top' && (
              <div className="space-y-4">
                {/* Top Jobs List */}
                <div className="bg-border/20 rounded overflow-hidden">
                  <div className="grid grid-cols-[40px_200px_100px_100px_100px_100px_80px] gap-2 px-4 py-3 border-b border-border/40">
                    <span className="text-xs text-muted-foreground/70 uppercase">Rank</span>
                    <span className="text-xs text-muted-foreground/70 uppercase">Job</span>
                    <span className="text-xs text-muted-foreground/70 uppercase">Platform</span>
                    <span className="text-xs text-muted-foreground/70 uppercase">Views</span>
                    <span className="text-xs text-muted-foreground/70 uppercase">Likes</span>
                    <span className="text-xs text-muted-foreground/70 uppercase">Engagement</span>
                    <span className="text-xs text-muted-foreground/70 uppercase">Actions</span>
                  </div>
                  {topJobs.map((item, index) => (
                    <div
                      key={item.jobId}
                      className="grid grid-cols-[40px_200px_100px_100px_100px_100px_80px] gap-2 px-4 py-3 rounded hover:bg-border/40 transition-colors"
                    >
                      <span className="text-sm text-muted-foreground/70">#{index + 1}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-clipforge-offWhite truncate">{item.videoId}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <PlatformIcon platform={item.platform} className="w-4 h-4" />
                        <span className="text-sm text-muted-foreground/70">{item.platform}</span>
                      </div>
                      <span className="text-sm text-clipforge-offWhite">{formatNumber(item.analytics.views)}</span>
                      <span className="text-sm text-clipforge-offWhite">{formatNumber(item.analytics.likes)}</span>
                      <span className="text-sm text-clipforge-offWhite">{formatPercentage(item.analytics.engagementRate)}</span>
                      <button className="text-xs text-clipforge-cyan hover:text-clipforge-cyan/80">View</button>
                    </div>
                  ))}
                </div>

                {/* Top Platforms Summary */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {filteredPlatforms.map((platform) => {
                    const stats = getPlatformStats(platform);
                    if (!stats) return null;
                    
                    return (
                      <div key={platform} className="bg-border/20 rounded p-4 text-center">
                        <PlatformIcon platform={platform} className="w-8 h-8 mx-auto mb-2" />
                        <span className="text-sm text-clipforge-offWhite block">{platform}</span>
                        <span className="text-2xl font-bold text-clipforge-cyan block my-1">{formatNumber(stats.views)}</span>
                        <span className="text-xs text-muted-foreground/70">Top: {formatNumber(Math.max(...topJobs.filter(t => t.platform === platform).map(t => t.analytics.views), 0))}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
