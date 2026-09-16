import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform, UserAccount, AIGenerationOptions } from '@clipforge/shared';
import { tokenStorage } from './token.storage';

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
}

interface PlatformOAuthConfig {
  [key: string]: OAuthConfig;
}

const PLATFORM_CONFIGS: PlatformOAuthConfig = {
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID || '',
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
    redirectUri: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/auth/youtube/callback',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  },
  tiktok: {
    clientId: process.env.TIKTOK_CLIENT_ID || '',
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
    redirectUri: process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3000/auth/tiktok/callback',
    authUrl: 'https://www.tiktok.com/oauth/authorize/',
    tokenUrl: 'https://open-api.tiktok.com/oauth/token/',
    scopes: [
      'video.upload',
      'user.info.basic',
    ],
  },
  instagram: {
    clientId: process.env.INSTAGRAM_CLIENT_ID || '',
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
    redirectUri: process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/auth/instagram/callback',
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    scopes: [
      'pages_show_list',
      'pages_read_engagement',
      'instagram_basic',
      'pages_manage_posts',
    ],
  },
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID || '',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    redirectUri: process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/auth/facebook/callback',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scopes: [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_manage_engagement',
      'public_profile',
    ],
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID || '',
    clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
    redirectUri: process.env.TWITTER_REDIRECT_URI || 'http://localhost:3000/auth/twitter/callback',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scopes: [
      'tweet.read',
      'tweet.write',
      'users.read',
      'media.upload',
    ],
  },
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    redirectUri: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/auth/linkedin/callback',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: [
      'r_liteprofile',
      'r_emailaddress',
      'w_member_social',
    ],
  },
  threads: {
    clientId: process.env.THREADS_CLIENT_ID || '',
    clientSecret: process.env.THREADS_CLIENT_SECRET || '',
    redirectUri: process.env.THREADS_REDIRECT_URI || 'http://localhost:3000/auth/threads/callback',
    authUrl: 'https://www.threads.net/oauth/authorize',
    tokenUrl: 'https://www.threads.net/oauth/access_token',
    scopes: [
      'threads_basic',
      'threads_content_publish',
    ],
  },
  snapchat: {
    clientId: process.env.SNAPCHAT_CLIENT_ID || '',
    clientSecret: process.env.SNAPCHAT_CLIENT_SECRET || '',
    redirectUri: process.env.SNAPCHAT_REDIRECT_URI || 'http://localhost:3000/auth/snapchat/callback',
    authUrl: 'https://accounts.snapchat.com/accounts/oauth2/auth',
    tokenUrl: 'https://accounts.snapchat.com/accounts/oauth2/token',
    scopes: [
      'snapchat-marketing-api',
    ],
  },
  pinterest: {
    clientId: process.env.PINTEREST_CLIENT_ID || '',
    clientSecret: process.env.PINTEREST_CLIENT_SECRET || '',
    redirectUri: process.env.PINTEREST_REDIRECT_URI || 'http://localhost:3000/auth/pinterest/callback',
    authUrl: 'https://api.pinterest.com/oauth/',
    tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
    scopes: [
      'boards:read',
      'boards:write',
      'pins:read',
      'pins:write',
    ],
  },
};

export class AuthService {
  private static instances: Map<Platform, AuthService> = new Map();
  
  private platform: Platform;
  private config: OAuthConfig;
  private httpClient: AxiosInstance;

  private constructor(platform: Platform) {
    this.platform = platform;
    this.config = PLATFORM_CONFIGS[platform];
    this.httpClient = axios.create({
      baseURL: this.config.tokenUrl,
      timeout: 30000,
    });
  }

  static getInstance(platform: Platform): AuthService {
    if (!this.instances.has(platform)) {
      this.instances.set(platform, new AuthService(platform));
    }
    return this.instances.get(platform)!;
  }

  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

    if (state) {
      params.set('state', state);
    }

    return `${this.config.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    tokenType?: string;
  }> {
    try {
      const response = await this.httpClient.post('', new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
      };
    } catch (error) {
      console.error('Failed to exchange code for token:', error);
      throw new Error('Failed to exchange code for token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn?: number;
  }> {
    try {
      const response = await this.httpClient.post('', new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  async getUserInfo(accessToken: string): Promise<{
    id: string;
    username: string;
    channelId?: string;
    email?: string;
  }> {
    try {
      // Platform-specific user info endpoints
      const userInfoEndpoints: Record<Platform, string> = {
        youtube: 'https://www.googleapis.com/oauth2/v2/userinfo',
        tiktok: 'https://open-api.tiktok.com/oauth/userinfo/',
        instagram: 'https://graph.instagram.com/me',
        facebook: 'https://graph.facebook.com/me',
        twitter: 'https://api.twitter.com/2/users/me',
        linkedin: 'https://api.linkedin.com/v2/me',
        threads: 'https://www.threads.net/api/graphql',
        snapchat: 'https://accounts.snapchat.com/accounts/api/me',
        pinterest: 'https://api.pinterest.com/v5/user_account',
      };

      const endpoint = userInfoEndpoints[this.platform];
      
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = response.data;

      // Map platform-specific responses to our format
      switch (this.platform) {
        case 'youtube':
          return {
            id: data.sub,
            username: data.name || data.email,
            email: data.email,
          };
        case 'tiktok':
          return {
            id: data.data.user.open_id,
            username: data.data.user.username,
          };
        case 'instagram':
        case 'facebook':
          return {
            id: data.id,
            username: data.name,
          };
        case 'twitter':
          return {
            id: data.data.id,
            username: data.data.username,
          };
        case 'linkedin':
          return {
            id: data.id,
            username: `${data.localizedFirstName} ${data.localizedLastName}`,
          };
        default:
          return {
            id: data.id || data.sub || data.user_id,
            username: data.username || data.name || data.email,
          };
      }
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw new Error('Failed to get user info');
    }
  }

  async authenticate(code: string, state?: string): Promise<UserAccount> {
    try {
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForToken(code);
      
      // Get user info
      const userInfo = await this.getUserInfo(tokens.accessToken);

      // Create account
      const account: UserAccount = {
        id: `acc_${this.platform}_${Date.now()}`,
        platform: this.platform,
        username: userInfo.username,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : undefined,
        channelId: userInfo.channelId,
        isConnected: true,
        createdAt: new Date(),
      };

      // Store account
      await tokenStorage.storeAccount(this.platform, account);

      return account;
    } catch (error) {
      console.error('Failed to authenticate:', error);
      throw new Error('Failed to authenticate');
    }
  }

  async getAccessToken(accountId: string): Promise<string | null> {
    // Try to get from storage
    let account = await tokenStorage.getAccount(this.platform, accountId);
    
    if (!account) {
      return null;
    }

    // Check if token is expired
    if (account.expiresAt && account.expiresAt < new Date()) {
      // Try to refresh
      if (account.refreshToken) {
        try {
          const newTokens = await this.refreshAccessToken(account.refreshToken);
          
          // Update account with new token
          account = {
            ...account,
            accessToken: newTokens.accessToken,
            expiresAt: newTokens.expiresIn ? new Date(Date.now() + newTokens.expiresIn * 1000) : undefined,
          };
          
          // Store updated account
          await tokenStorage.storeAccount(this.platform, account);
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          return null;
        }
      } else {
        return null;
      }
    }

    return account.accessToken;
  }

  async revokeAccess(accountId: string): Promise<void> {
    try {
      // Platform-specific revoke endpoints
      const revokeEndpoints: Record<Platform, string> = {
        youtube: 'https://oauth2.googleapis.com/revoke',
        tiktok: 'https://open-api.tiktok.com/oauth/revoke/',
        instagram: 'https://graph.instagram.com/access_token',
        facebook: 'https://graph.facebook.com/access_token',
        twitter: 'https://api.twitter.com/2/oauth2/revoke',
        linkedin: 'https://api.linkedin.com/oauth/v2/revokeToken',
        threads: 'https://www.threads.net/oauth/revoke',
        snapchat: 'https://accounts.snapchat.com/accounts/oauth2/revoke',
        pinterest: 'https://api.pinterest.com/v5/oauth/revoke',
      };

      const account = await tokenStorage.getAccount(this.platform, accountId);
      if (!account) {
        return;
      }

      const endpoint = revokeEndpoints[this.platform];
      
      await axios.post(endpoint, new URLSearchParams({
        token: account.accessToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Delete from storage
      await tokenStorage.deleteAccount(this.platform, accountId);
    } catch (error) {
      console.error('Failed to revoke access:', error);
      // Still try to delete from storage
      await tokenStorage.deleteAccount(this.platform, accountId);
    }
  }
}

export const authService = {
  getInstance: AuthService.getInstance,
  tokenStorage,
};
