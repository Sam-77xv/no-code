import OpenAI from 'openai';
import { AIGenerationOptions, Platform, PlatformConfig, PlatformMetadata } from '@clipforge/shared';

// Platform-specific metadata rules
const PLATFORM_METADATA_RULES: Record<Platform, PlatformMetadata> = {
  youtube: {
    title: '',
    description: '',
    hashtags: [],
    maxTitleLength: 100,
    maxDescriptionLength: 5000,
    maxHashtags: 15,
    optimalHashtagLength: 20,
  },
  tiktok: {
    title: '',
    description: '',
    hashtags: [],
    maxTitleLength: 100,
    maxDescriptionLength: 2200,
    maxHashtags: 10,
    optimalHashtagLength: 15,
  },
  instagram: {
    title: '',
    description: '',
    hashtags: [],
    maxTitleLength: 250,
    maxDescriptionLength: 2200,
    maxHashtags: 30,
    optimalHashtagLength: 10,
  },
  facebook: {
    title: '',
    description: '',
    hashtags: [],
    maxTitleLength: 250,
    maxDescriptionLength: 63206,
    maxHashtags: 20,
    optimalHashtagLength: 15,
  },
  twitter: {
    title: '',
    description: '',
    hashtags: [],
    maxTitleLength: 280,
    maxDescriptionLength: 280,
    maxHashtags: 10,
    optimalHashtagLength: 10,
  },
  linkedin: {
    title: '',
    description: '',
    hashtags: [],
    maxTitleLength: 200,
    maxDescriptionLength: 3000,
    maxHashtags: 10,
    optimalHashtagLength: 15,
  },
  threads: {
    title: '',
    description: '',
    hashtags: [],
    maxTitleLength: 500,
    maxDescriptionLength: 2500,
    maxHashtags: 10,
    optimalHashtagLength: 15,
  },
  snapchat: {
    title: '',
    description: '',
    hashtags: [],
    maxTitleLength: 250,
    maxDescriptionLength: 1000,
    maxHashtags: 5,
    optimalHashtagLength: 10,
  },
  pinterest: {
    title: '',
    description: '',
    hashtags: [],
    maxTitleLength: 100,
    maxDescriptionLength: 500,
    maxHashtags: 20,
    optimalHashtagLength: 15,
  },
};

// Platform-specific hashtag suggestions
const PLATFORM_HASHTAGS: Record<Platform, string[]> = {
  youtube: [
    'viral', 'trending', 'new', '2024', 'video', 'youtube',
    'like', 'subscribe', 'share', 'comment', 'mustwatch'
  ],
  tiktok: [
    'fyp', 'viral', 'trending', 'foryou', 'forupage', 'tiktok',
    'like', 'share', 'follow', 'new', '2024'
  ],
  instagram: [
    'instagood', 'photooftheday', 'beautiful', 'picoftheday',
    'love', 'art', 'photography', 'fashion', 'followme'
  ],
  facebook: [
    'video', 'trending', 'new', '2024', 'like', 'share',
    'comment', 'follow', 'viral'
  ],
  twitter: [
    'trending', 'now', 'new', '2024', 'thread', 'viral',
    'like', 'retweet', 'follow'
  ],
  linkedin: [
    'business', 'career', 'success', 'leadership', 'innovation',
    'technology', 'marketing', 'entrepreneur'
  ],
  threads: [
    'new', 'trending', 'viral', '2024', 'thread',
    'discussion', 'opinion', 'thoughts'
  ],
  snapchat: [
    'spotlight', 'trending', 'new', '2024', 'viral'
  ],
  pinterest: [
    'inspiration', 'ideas', 'diy', 'crafts', 'home',
    'fashion', 'food', 'art', 'design', 'style'
  ],
};

// Video category keywords for better AI generation
const VIDEO_CATEGORIES = [
  'technology', 'gaming', 'music', 'education', 'comedy',
  'sports', 'news', 'entertainment', 'lifestyle', 'travel',
  'food', 'fashion', 'business', 'health', 'science',
  'animation', 'art', 'photography', 'fitness', 'beauty'
];

export class AIService {
  private static instance: OpenAI | null = null;
  private static apiKey: string = process.env.OPENAI_API_KEY || '';
  private static model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'gemini-1.5' = 'gpt-4';

  static initialize(apiKey?: string, model?: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'gemini-1.5') {
    if (apiKey) {
      this.apiKey = apiKey;
    }
    if (model) {
      this.model = model;
    }
    
    if (!this.instance && this.apiKey) {
      this.instance = new OpenAI({ apiKey: this.apiKey });
    }
  }

  static async generateMetadata(
    videoTitle: string,
    videoDescription: string,
    platforms: Platform[],
    options?: AIGenerationOptions
  ): Promise<Record<Platform, PlatformMetadata>> {
    const results: Record<Platform, PlatformMetadata> = {};

    for (const platform of platforms) {
      const metadata = await this.generatePlatformMetadata(
        videoTitle,
        videoDescription,
        platform,
        options
      );
      results[platform] = metadata;
    }

    return results;
  }

  static async generatePlatformMetadata(
    videoTitle: string,
    videoDescription: string,
    platform: Platform,
    options?: AIGenerationOptions
  ): Promise<PlatformMetadata> {
    const rules = PLATFORM_METADATA_RULES[platform];
    const platformHashtags = PLATFORM_HASHTAGS[platform];

    // Extract category from video title/description
    const category = this.extractCategory(videoTitle, videoDescription);

    try {
      if (this.instance && this.model.startsWith('gpt')) {
        // Use OpenAI API
        const response = await this.instance.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are a professional social media content creator. Generate optimized metadata for ${platform} platform. 
              Follow these rules:
              - Title must be under ${rules.maxTitleLength} characters
              - Description must be under ${rules.maxDescriptionLength} characters
              - Use ${rules.maxHashtags} relevant hashtags, each under ${rules.optimalHashtagLength} characters
              - Focus on: ${category || 'general content'}
              - Platform: ${platform}
              - Be engaging, professional, and use platform-specific tone`
            },
            {
              role: 'user',
              content: `Original video title: "${videoTitle}"
              Original video description: "${videoDescription}"
              
              Generate:
              1. An optimized title for ${platform}
              2. An optimized description for ${platform}
              3. ${rules.maxHashtags} relevant hashtags for ${platform}
              
              Return in JSON format: {"title": "...", "description": "...", "hashtags": [...]}`
            }
          ],
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 1000,
        });

        const content = response.choices[0]?.message?.content || '';
        const result = this.parseAIResponse(content);
        
        return {
          title: result.title || videoTitle,
          description: result.description || videoDescription,
          hashtags: result.hashtags || [],
          maxTitleLength: rules.maxTitleLength,
          maxDescriptionLength: rules.maxDescriptionLength,
          maxHashtags: rules.maxHashtags,
          optimalHashtagLength: rules.optimalHashtagLength,
        };
      } else {
        // Fallback to local generation
        return this.generateLocalMetadata(videoTitle, videoDescription, platform, rules, platformHashtags);
      }
    } catch (error) {
      console.error('AI generation failed, falling back to local:', error);
      return this.generateLocalMetadata(videoTitle, videoDescription, platform, rules, platformHashtags);
    }
  }

  static async generateTitleAndDescription(
    videoInfo: { title?: string; description?: string },
    platforms: Platform[],
    contentType: string,
    options?: AIGenerationOptions
  ): Promise<Record<Platform, PlatformMetadata>> {
    const videoTitle = videoInfo.title || 'Untitled Video';
    const videoDescription = videoInfo.description || '';

    return this.generateMetadata(videoTitle, videoDescription, platforms, options);
  }

  static async generateHashtags(
    content: string,
    platform: Platform,
    count: number = 10
  ): Promise<string[]> {
    const rules = PLATFORM_METADATA_RULES[platform];
    const platformHashtags = PLATFORM_HASHTAGS[platform];
    const maxHashtags = Math.min(count, rules.maxHashtags);

    try {
      if (this.instance) {
        const response = await this.instance.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `Generate ${maxHashtags} relevant hashtags for ${platform} based on the content. 
              Each hashtag should be under ${rules.optimalHashtagLength} characters. 
              Include platform-specific and content-relevant hashtags.`
            },
            {
              role: 'user',
              content: `Content: "${content}"
              Platform: ${platform}
              Generate hashtags in JSON format: {"hashtags": ["...", "..."]}`
            }
          ],
          temperature: 0.8,
          max_tokens: 500,
        });

        const content = response.choices[0]?.message?.content || '';
        const result = this.parseAIResponse(content);
        return result.hashtags || [];
      }
    } catch (error) {
      console.error('Hashtag generation failed:', error);
    }

    // Fallback to local hashtag generation
    return this.generateLocalHashtags(content, platform, platformHashtags, maxHashtags);
  }

  static async suggestBestPostingTime(
    platform: Platform,
    contentType: string
  ): Promise<{ time: string; timezone: string; reasoning: string }> {
    const bestTimes: Record<Platform, Record<string, { time: string; timezone: string; reasoning: string }>> = {
      youtube: {
        default: { time: '14:00-16:00', timezone: 'UTC', reasoning: 'Weekday afternoons have highest engagement' },
        gaming: { time: '18:00-22:00', timezone: 'UTC', reasoning: 'Evenings and weekends peak for gaming' },
        music: { time: '12:00-15:00', timezone: 'UTC', reasoning: 'Lunchtime and early afternoon' },
        education: { time: '09:00-11:00', timezone: 'UTC', reasoning: 'Morning hours on weekdays' },
      },
      tiktok: {
        default: { time: '18:00-22:00', timezone: 'local', reasoning: 'Evenings have highest user activity' },
        gaming: { time: '20:00-23:00', timezone: 'local', reasoning: 'Late evenings for gaming content' },
        comedy: { time: '17:00-21:00', timezone: 'local', reasoning: 'Evening entertainment time' },
      },
      instagram: {
        default: { time: '11:00-13:00, 19:00-21:00', timezone: 'local', reasoning: 'Lunchtime and evening commutes' },
        fashion: { time: '12:00-14:00, 18:00-20:00', timezone: 'local', reasoning: 'Lunch breaks and after-work browsing' },
        food: { time: '12:00-14:00, 18:00-20:00', timezone: 'local', reasoning: 'Meal times' },
      },
      facebook: {
        default: { time: '13:00-16:00', timezone: 'local', reasoning: 'Afternoon and early evening' },
        news: { time: '08:00-10:00, 17:00-19:00', timezone: 'local', reasoning: 'Morning and evening news consumption' },
      },
      twitter: {
        default: { time: '08:00-10:00, 12:00-14:00, 17:00-19:00', timezone: 'local', reasoning: 'Commute times and lunch breaks' },
        news: { time: '07:00-09:00, 16:00-18:00', timezone: 'local', reasoning: 'Morning and evening news peaks' },
      },
      linkedin: {
        default: { time: '08:00-10:00, 12:00-14:00', timezone: 'local', reasoning: 'Business hours and lunch breaks' },
        business: { time: '07:30-09:30, 17:00-18:30', timezone: 'local', reasoning: 'Start and end of business day' },
      },
      threads: {
        default: { time: '19:00-22:00', timezone: 'local', reasoning: 'Evening social media time' },
      },
      snapchat: {
        default: { time: '17:00-20:00', timezone: 'local', reasoning: 'After school/work hours' },
      },
      pinterest: {
        default: { time: '20:00-23:00', timezone: 'local', reasoning: 'Evening planning and inspiration time' },
        fashion: { time: '19:00-22:00', timezone: 'local', reasoning: 'Evening browsing for fashion' },
        food: { time: '18:00-21:00', timezone: 'local', reasoning: 'Dinner planning time' },
      },
    };

    const platformTimes = bestTimes[platform] || {};
    const contentTimes = platformTimes[contentType] || platformTimes.default || bestTimes.youtube.default;
    
    return {
      ...contentTimes,
      platform,
      contentType,
    };
  }

  static async analyzeVideoContent(
    videoPath: string,
    options?: AIGenerationOptions
  ): Promise<{
    category: string;
    tags: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    language: string;
    summary: string;
  }> {
    // This would use AI to analyze video content
    // For now, return mock data
    return {
      category: 'general',
      tags: [],
      sentiment: 'neutral',
      language: 'en',
      summary: 'Video content analysis would be performed here',
    };
  }

  static async generateVideoTags(
    videoInfo: { title?: string; description?: string },
    count: number = 10
  ): Promise<string[]> {
    const title = videoInfo.title || '';
    const description = videoInfo.description || '';
    const combined = `${title} ${description}`;

    // Extract keywords from title and description
    const keywords = this.extractKeywords(combined);
    
    // Generate tags
    const tags: string[] = [];
    
    // Add content-based tags
    for (const keyword of keywords.slice(0, Math.min(5, count))) {
      tags.push(keyword.toLowerCase().replace(/\s+/g, ''));
    }

    // Add category tags
    const category = this.extractCategory(title, description);
    if (category && !tags.includes(category)) {
      tags.push(category);
    }

    // Fill remaining with generic tags
    const genericTags = ['video', 'content', 'new', '2024', 'watch', 'share', 'like'];
    while (tags.length < count) {
      const tag = genericTags.find(t => !tags.includes(t));
      if (tag) {
        tags.push(tag);
      } else {
        break;
      }
    }

    return tags.slice(0, count);
  }

  private static parseAIResponse(content: string): { title?: string; description?: string; hashtags?: string[] } {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {};
    } catch (error) {
      return {};
    }
  }

  private static generateLocalMetadata(
    videoTitle: string,
    videoDescription: string,
    platform: Platform,
    rules: PlatformMetadata,
    platformHashtags: string[]
  ): PlatformMetadata {
    // Generate title
    let title = videoTitle;
    if (title.length > rules.maxTitleLength) {
      title = title.substring(0, rules.maxTitleLength - 3) + '...';
    }

    // Generate description
    let description = videoDescription || videoTitle;
    if (description.length > rules.maxDescriptionLength) {
      description = description.substring(0, rules.maxDescriptionLength - 3) + '...';
    }

    // Generate hashtags
    const hashtags = this.generateLocalHashtags(
      `${videoTitle} ${videoDescription}`,
      platform,
      platformHashtags,
      rules.maxHashtags
    );

    return {
      title,
      description,
      hashtags,
      maxTitleLength: rules.maxTitleLength,
      maxDescriptionLength: rules.maxDescriptionLength,
      maxHashtags: rules.maxHashtags,
      optimalHashtagLength: rules.optimalHashtagLength,
    };
  }

  private static generateLocalHashtags(
    content: string,
    platform: Platform,
    platformHashtags: string[],
    maxHashtags: number
  ): string[] {
    const keywords = this.extractKeywords(content);
    const hashtags: string[] = [];

    // Add platform-specific hashtags
    for (const tag of platformHashtags.slice(0, Math.floor(maxHashtags / 2))) {
      if (!hashtags.includes(tag)) {
        hashtags.push(tag);
      }
    }

    // Add content-based hashtags
    for (const keyword of keywords.slice(0, Math.floor(maxHashtags / 2))) {
      const tag = keyword.toLowerCase().replace(/\s+/g, '');
      if (!hashtags.includes(tag) && tag.length <= 20) {
        hashtags.push(tag);
      }
    }

    // Fill remaining with more platform hashtags
    for (const tag of platformHashtags) {
      if (!hashtags.includes(tag) && hashtags.length < maxHashtags) {
        hashtags.push(tag);
      }
    }

    return hashtags.slice(0, maxHashtags);
  }

  private static extractKeywords(text: string): string[] {
    // Remove special characters and split
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && word.length <= 20);

    // Count frequency
    const frequency: Record<string, number> = {};
    for (const word of words) {
      frequency[word] = (frequency[word] || 0) + 1;
    }

    // Sort by frequency and get top keywords
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
  }

  private static extractCategory(title: string, description: string): string | null {
    const combined = `${title} ${description}`.toLowerCase();

    for (const category of VIDEO_CATEGORIES) {
      if (combined.includes(category)) {
        return category;
      }
    }

    return null;
  }

  static async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<string> {
    try {
      if (this.instance) {
        const response = await this.instance.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the following text to ${targetLanguage}.`
            },
            {
              role: 'user',
              content: `Text to translate: "${text}"`
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
        });

        return response.choices[0]?.message?.content || text;
      }
    } catch (error) {
      console.error('Translation failed:', error);
    }

    return text;
  }

  static async detectLanguage(text: string): Promise<string> {
    // Simple language detection based on common words
    const languagePatterns: Record<string, string[]> = {
      en: ['the', 'and', 'of', 'to', 'in', 'is', 'it'],
      ar: ['ال', 'و', 'في', 'من', 'إلى', 'على', 'أن'],
      es: ['el', 'la', 'de', 'que', 'y', 'a', 'en'],
      fr: ['le', 'la', 'de', 'et', 'à', 'les', 'des'],
      de: ['der', 'die', 'das', 'und', 'in', 'den', 'von'],
      it: ['il', 'di', 'e', 'in', 'la', 'a', 'da'],
    };

    const words = text.toLowerCase().split(/\s+/);
    
    for (const [lang, patterns] of Object.entries(languagePatterns)) {
      const matches = patterns.filter(pattern => words.includes(pattern));
      if (matches.length >= 2) {
        return lang;
      }
    }

    return 'en';
  }
}

export const aiService = AIService;
