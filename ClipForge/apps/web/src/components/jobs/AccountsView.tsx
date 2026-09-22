'use client';

import { useState } from 'react';
import { Users, Plus, Link2, Unlink2, MoreVertical, RefreshCw } from 'lucide-react';
import { PlatformIcon } from '../platforms/PlatformIcon';
import { Platform } from '@/types';

const platforms: Platform[] = [
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

interface Account {
  id: string;
  platform: Platform;
  username: string;
  isConnected: boolean;
  channelId?: string;
}

export function AccountsView() {
  const [accounts, setAccounts] = useState<Account[]>([
    { id: '1', platform: 'youtube', username: 'My Channel', isConnected: true, channelId: 'UC123' },
    { id: '2', platform: 'tiktok', username: '@myusername', isConnected: false },
    { id: '3', platform: 'instagram', username: 'my.instagram', isConnected: true },
  ]);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const toggleConnection = (accountId: string) => {
    setAccounts(prev => 
      prev.map(account => 
        account.id === accountId 
          ? { ...account, isConnected: !account.isConnected }
          : account
      )
    );
  };

  const connectPlatform = (platform: Platform) => {
    setSelectedPlatform(platform);
    setIsConnecting(true);
    // Simulate connection
    setTimeout(() => {
      setAccounts(prev => [...prev, {
        id: `acc_${Date.now()}`,
        platform,
        username: `New ${platform} Account`,
        isConnected: true,
      }]);
      setIsConnecting(false);
      setSelectedPlatform(null);
    }, 2000);
  };

  const disconnectAccount = (accountId: string) => {
    setAccounts(prev => prev.filter(account => account.id !== accountId));
  };

  const getPlatformAccounts = (platform: Platform) => {
    return accounts.filter(acc => acc.platform === platform);
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-clipforge-cyan" />
          <h1 className="text-clipforge-offWhite font-medium">Accounts</h1>
          <span className="text-xs bg-border/40 px-2 py-0.5 rounded">{accounts.length} connected</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Platform Cards */}
        {platforms.map((platform) => {
          const platformAccounts = getPlatformAccounts(platform);
          const isConnected = platformAccounts.some(acc => acc.isConnected);
          
          return (
            <div
              key={platform}
              className={`card p-4 ${isConnected ? 'border-clipforge-orange/30' : 'border-border/40'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <PlatformIcon platform={platform} className="w-6 h-6" />
                  <div>
                    <h3 className="text-clipforge-offWhite font-medium capitalized">
                      {platform}
                    </h3>
                    <p className="text-xs text-muted-foreground/70">
                      {platformAccounts.length} account(s) connected
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded">
                      Connected
                    </span>
                  ) : (
                    <span className="text-xs bg-muted-foreground/20 text-muted-foreground px-2 py-0.5 rounded">
                      Not connected
                    </span>
                  )}
                  {isConnecting && selectedPlatform === platform ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <button
                      onClick={() => connectPlatform(platform)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-clipforge-orange/20 text-clipforge-orange text-xs rounded hover:bg-clipforge-orange/30"
                    >
                      <Plus className="w-3 h-3" />
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Account List */}
              {platformAccounts.length > 0 && (
                <div className="space-y-2">
                  {platformAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 bg-border/20 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <PlatformIcon platform={account.platform} className="w-4 h-4" />
                        <div>
                          <p className="text-sm text-clipforge-offWhite">{account.username}</p>
                          {account.channelId && (
                            <p className="text-xs text-muted-foreground/70">{account.channelId}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleConnection(account.id)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                            account.isConnected
                              ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                              : 'bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30'
                          }`}
                        >
                          {account.isConnected ? (
                            <>
                              <Link2 className="w-3 h-3" />
                              Connected
                            </>
                          ) : (
                            <>
                              <Unlink2 className="w-3 h-3" />
                              Connect
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => disconnectAccount(account.id)}
                          className="p-1 hover:bg-border/40 rounded text-muted-foreground/70 hover:text-foreground"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
