import keytar from 'keytar';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { Platform, UserAccount } from '@clipforge/shared';

interface TokenStorageOptions {
  useKeychain?: boolean;
  storagePath?: string;
}

export class TokenStorage {
  private static readonly DEFAULT_STORAGE_PATH = join(homedir(), '.clipforge', 'tokens');
  private static readonly SERVICE_NAME = 'ClipForge';
  
  private useKeychain: boolean;
  private storagePath: string;

  constructor(options: TokenStorageOptions = {}) {
    this.useKeychain = options.useKeychain ?? true;
    this.storagePath = options.storagePath ?? TokenStorage.DEFAULT_STORAGE_PATH;
    
    // Ensure storage directory exists
    this.ensureStoragePath();
  }

  private ensureStoragePath(): void {
    if (!existsSync(this.storagePath)) {
      mkdirSync(this.storagePath, { recursive: true });
    }
  }

  private getKeychainKey(platform: Platform, accountId: string): string {
    return `${this.SERVICE_NAME}_${platform}_${accountId}`;
  }

  private getFilePath(platform: Platform, accountId: string): string {
    return join(this.storagePath, `${platform}_${accountId}.json`);
  }

  async setToken(platform: Platform, accountId: string, token: string): Promise<void> {
    if (this.useKeychain) {
      try {
        await keytar.setPassword(
          this.getKeychainKey(platform, accountId),
          accountId,
          token
        );
      } catch (error) {
        console.warn('Failed to store token in keychain, falling back to file storage:', error);
        this.storeInFile(platform, accountId, { accessToken: token });
      }
    } else {
      this.storeInFile(platform, accountId, { accessToken: token });
    }
  }

  async getToken(platform: Platform, accountId: string): Promise<string | null> {
    if (this.useKeychain) {
      try {
        const token = await keytar.getPassword(
          this.getKeychainKey(platform, accountId)
        );
        if (token) {
          return token;
        }
      } catch (error) {
        console.warn('Failed to retrieve token from keychain, trying file storage:', error);
      }
    }

    return this.getFromFile(platform, accountId);
  }

  async deleteToken(platform: Platform, accountId: string): Promise<void> {
    if (this.useKeychain) {
      try {
        await keytar.deletePassword(
          this.getKeychainKey(platform, accountId)
        );
      } catch (error) {
        console.warn('Failed to delete token from keychain:', error);
      }
    }

    const filePath = this.getFilePath(platform, accountId);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  async storeAccount(platform: Platform, account: UserAccount): Promise<void> {
    const accountData = {
      id: account.id,
      platform: account.platform,
      username: account.username,
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      expiresAt: account.expiresAt?.toISOString(),
      channelId: account.channelId,
      isConnected: account.isConnected,
      createdAt: account.createdAt.toISOString(),
    };

    if (this.useKeychain) {
      try {
        await keytar.setPassword(
          this.getKeychainKey(platform, account.id),
          account.id,
          JSON.stringify(accountData)
        );
      } catch (error) {
        console.warn('Failed to store account in keychain, falling back to file storage:', error);
        this.storeInFile(platform, account.id, accountData);
      }
    } else {
      this.storeInFile(platform, account.id, accountData);
    }
  }

  async getAccount(platform: Platform, accountId: string): Promise<UserAccount | null> {
    let accountData: any = null;

    if (this.useKeychain) {
      try {
        const data = await keytar.getPassword(
          this.getKeychainKey(platform, accountId)
        );
        if (data) {
          accountData = JSON.parse(data);
        }
      } catch (error) {
        console.warn('Failed to retrieve account from keychain, trying file storage:', error);
      }
    }

    if (!accountData) {
      accountData = this.getFromFile(platform, accountId);
    }

    if (!accountData) {
      return null;
    }

    return {
      id: accountData.id,
      platform: accountData.platform,
      username: accountData.username,
      accessToken: accountData.accessToken,
      refreshToken: accountData.refreshToken,
      expiresAt: accountData.expiresAt ? new Date(accountData.expiresAt) : undefined,
      channelId: accountData.channelId,
      isConnected: accountData.isConnected ?? true,
      createdAt: new Date(accountData.createdAt),
    };
  }

  async listAccounts(platform?: Platform): Promise<UserAccount[]> {
    const accounts: UserAccount[] = [];

    // List all files in storage directory
    const { readdirSync } = await import('fs');
    
    try {
      const files = readdirSync(this.storagePath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const match = file.match(/^([^_]+)_([^.]+)\.json$/);
          if (match) {
            const filePlatform = match[1] as Platform;
            const accountId = match[2];
            
            if (!platform || filePlatform === platform) {
              const account = await this.getAccount(filePlatform, accountId);
              if (account) {
                accounts.push(account);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to list accounts:', error);
    }

    // Also try to list from keychain (if available)
    if (this.useKeychain) {
      try {
        // Note: keytar doesn't have a built-in list method, so we rely on file storage
      } catch (error) {
        // Ignore
      }
    }

    return accounts;
  }

  async deleteAccount(platform: Platform, accountId: string): Promise<void> {
    await this.deleteToken(platform, accountId);
    
    const filePath = this.getFilePath(platform, accountId);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  private storeInFile(platform: Platform, accountId: string, data: any): void {
    const filePath = this.getFilePath(platform, accountId);
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private getFromFile(platform: Platform, accountId: string): any {
    const filePath = this.getFilePath(platform, accountId);
    
    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('Failed to read account file:', error);
      return null;
    }
  }

  async clearAll(): Promise<void> {
    // Clear file storage
    const { readdirSync, unlinkSync } = await import('fs');
    
    try {
      const files = readdirSync(this.storagePath);
      for (const file of files) {
        unlinkSync(join(this.storagePath, file));
      }
    } catch (error) {
      console.warn('Failed to clear file storage:', error);
    }

    // Clear keychain (if available)
    if (this.useKeychain) {
      try {
        // Note: keytar doesn't have a built-in clearAll method
        // We would need to track all stored keys
      } catch (error) {
        console.warn('Failed to clear keychain:', error);
      }
    }
  }
}

// Singleton instance
export const tokenStorage = new TokenStorage();
