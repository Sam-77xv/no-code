# ClipForge

<div align="center">

```
     ██████╗ ██╗██████╗ ███████╗ ██████╗ ███████╗
    ██╔════╝██║██╔══██╗██╔════╝██╔═══██╗██╔════╝
    ██║     ██║██████╔╝█████╗  ██║   ██║███████╗
    ██║     ██║██╔══██╗██╔══╝  ██║   ██║╚════██║
    ╚██████╗██║██║  ██║███████╗╚██████╔╝███████║
     ╚═════╝╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
```

**A unified content pipeline tool that lets creators fetch, process, and publish videos to multiple platforms with zero manual intervention.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black.svg)](https://nextjs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-orange.svg)](https://tauri.app/)

</div>

---

## ✨ Features

### 🎯 Core Functionality
- **Fetch/Download**: Grab videos from any supported source (Reels, Shorts, TikTok, long-form) by pasting a URL
- **Multi-Platform Publishing**: Upload to one or multiple target platforms simultaneously
- **Auto-Generate Metadata**: AI-powered title, description, and hashtag generation
- **Zero Manual Intervention**: Fully automated pipeline from download to upload

### 🔌 Supported Platforms

| Platform | Download | Upload | Analytics |
|----------|----------|--------|-----------|
| YouTube | ✅ | ✅ | ✅ |
| TikTok | ✅ | ✅ | ✅ |
| Instagram | ✅ | ✅ | ✅ |
| Facebook | ✅ | ✅ | ✅ |
| X/Twitter | ✅ | ✅ | ✅ |
| LinkedIn | ✅ | ✅ | ✅ |
| Threads | ✅ | ✅ | ❌ |
| Snapchat Spotlight | ✅ | ✅ | ❌ |
| Pinterest (Idea Pins) | ✅ | ✅ | ✅ |

### ⚙️ Video Processing Pipeline
- **Aspect Ratio Conversion**: 9:16, 16:9, 1:1, 4:5
- **Smart Cropping**: Face/subject tracking via OpenCV
- **Auto-Splitting**: Split long videos into ≤60s clips for Shorts/Reels
- **Watermark Removal**: Optional watermark removal (ethical use only)
- **Compression**: FFmpeg with quality presets (low, medium, high)

### 🤖 AI-Powered Features
- **Description Generator**: OpenAI/Claude/Gemini API integration
- **Platform-Optimized Metadata**: Each platform has different optimal length + hashtag rules
- **Best-Time-to-Post Suggestions**: AI-driven recommendations

### 📅 Scheduling System
- **Immediate Upload**: Process and upload right away
- **Schedule for Later**: Cron-based scheduling with local queue
- **Best Time to Post**: AI suggestions based on your audience

### 📊 Analytics Dashboard
- **Track Metrics**: Views, likes, comments, shares, engagement rate
- **Platform Comparison**: Compare performance across platforms
- **Trend Analysis**: Time-series analytics with 7d/30d/90d/all filters
- **Top Jobs**: See your best-performing uploads

### 🔄 Batch Processing
- **Queue System**: Process multiple URLs in sequence
- **Parallel Uploads**: Upload to N platforms simultaneously
- **Progress Tracking**: Real-time progress for each job

### 💾 Data Management
- **Local History**: Searchable log of all uploads
- **Secure Storage**: OAuth tokens stored in system keychain or encrypted SQLite
- **Error Retry**: Exponential backoff with jitter
- **Rate Limit Awareness**: Per-platform rate limiting

---

## 🚀 Quick Start

### Prerequisites

1. **Node.js**: Version 18.0.0 or higher
   ```bash
   # Using nvm (recommended)
   nvm install 18
   nvm use 18
   
   # Or download directly
   # https://nodejs.org/
   ```

2. **pnpm**: Package manager (required for monorepo)
   ```bash
   npm install -g pnpm
   ```

3. **System Dependencies**: Required for video processing
   - **yt-dlp**: Video downloader
     ```bash
     # macOS
     brew install yt-dlp
     
     # Linux (Debian/Ubuntu)
     sudo apt install yt-dlp
     
     # Windows (via Chocolatey)
     choco install yt-dlp
     
     # Or via pip
     pip install yt-dlp
     ```
   - **FFmpeg**: Video processing
     ```bash
     # macOS
     brew install ffmpeg
     
     # Linux (Debian/Ubuntu)
     sudo apt install ffmpeg
     
     # Windows (via Chocolatey)
     choco install ffmpeg
     ```

4. **Redis**: Required for BullMQ queue (optional for standalone mode)
   ```bash
   # macOS
   brew install redis
   
   # Linux (Debian/Ubuntu)
   sudo apt install redis-server
   
   # Start Redis
   redis-server
   ```

5. **Rust**: Required for Tauri desktop app
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env
   ```

### Installation

```bash
# Clone the repository
git clone https://github.com/machbrandido-art/no-code.git
cd no-code/ClipForge

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env with your API keys
nano .env
```

### Configuration

Edit `.env` file with your API keys:

```bash
# OAuth 2.0 Credentials (from each platform's developer portal)
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
# ... (other platform credentials)

# AI API Keys
OPENAI_API_KEY=your_openai_key
# or
CLAUDE_API_KEY=your_claude_key
# or
GEMINI_API_KEY=your_gemini_key

# Encryption key (generate with: openssl rand -base64 32)
ENCRYPTION_KEY=your_32_byte_base64_key
```

See [.env.example](./.env.example) for all available options.

### Running the Application

#### Web Application
```bash
# Development mode
pnpm --filter @clipforge/web dev

# Production mode
pnpm --filter @clipforge/web build
pnpm --filter @clipforge/web start
```

Access at: http://localhost:3000

#### Desktop Application
```bash
# Development mode
cd apps/desktop
pnpm tauri dev

# Production build
pnpm tauri build
```

Builds will be in `apps/desktop/src-tauri/target/release/`

---

## 📦 Project Structure

```
ClipForge/
├── apps/
│   ├── web/                    # Next.js 15 web application
│   │   ├── src/
│   │   │   ├── app/           # App router pages
│   │   │   ├── components/    # React components
│   │   │   │   ├── jobs/      # Job-related components
│   │   │   │   ├── layout/    # Layout components
│   │   │   │   ├── platforms/ # Platform components
│   │   │   │   └── ui/        # UI utilities
│   │   │   ├── store/         # React contexts
│   │   │   └── types/         # TypeScript types
│   │   ├── public/            # Static assets
│   │   └── ...
│   └── desktop/               # Tauri desktop wrapper
│       ├── src/              # Desktop-specific code
│       └── src-tauri/         # Tauri configuration
│           ├── Cargo.toml     # Rust dependencies
│           ├── tauri.conf.json # Tauri config
│           └── src/main.rs     # Rust main
├── packages/
│   ├── core/                  # Core backend services
│   │   ├── src/
│   │   │   ├── auth/         # Authentication services
│   │   │   ├── queue/        # Queue system (BullMQ)
│   │   │   ├── services/     # Platform services
│   │   │   └── utils/        # Utilities
│   ├── shared/                # Shared TypeScript types
│   └── ui/                   # Shared UI components
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Web app Dockerfile
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
├── package.json               # Monorepo root
├── pnpm-workspace.yaml        # Workspace config
└── turbo.json                 # Turbo build config
```

---

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Start all services (web, redis, yt-dlp)
docker-compose up -d

# View logs
docker-compose logs -f web

# Stop all services
docker-compose down
```

### Build Docker Images

```bash
# Build web app image
docker build -t clipforge-web -f apps/web/Dockerfile .

# Build desktop app image
docker build -t clipforge-desktop -f apps/desktop/Dockerfile .
```

### Environment Variables in Docker

Create a `.env.docker` file and pass it to Docker:

```bash
docker run -d \
  --name clipforge \
  -p 3000:3000 \
  --env-file .env.docker \
  -v $(pwd)/data:/app/data \
  clipforge-web
```

---

## 📦 Installer Builds

### macOS (.dmg)
```bash
cd apps/desktop
pnpm tauri build --target universal-apple-darwin
```

Output: `src-tauri/target/release/bundle/dmg/ClipForge_1.0.0_x64.dmg`

### Windows (.exe)
```bash
cd apps/desktop
pnpm tauri build --target x86_64-pc-windows-msvc
```

Output: `src-tauri/target/release/bundle/msi/ClipForge_1.0.0_x64_en-US.msi`

### Linux (.AppImage)
```bash
cd apps/desktop
pnpm tauri build --target x86_64-unknown-linux-gnu
```

Output: `src-tauri/target/release/bundle/appimage/ClipForge_1.0.0_amd64.AppImage`

---

## 🔧 API Keys Setup Guide

### YouTube Data API v3
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "YouTube Data API v3"
4. Create OAuth 2.0 credentials
5. Set redirect URI: `http://localhost:3000/api/auth/youtube/callback`

### TikTok Content Posting API
1. Go to [TikTok Developer Portal](https://developers.tiktok.com/)
2. Create an app
3. Request "Content Posting API" permissions
4. Configure OAuth redirect URI

### Instagram Graph API (Meta)
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create an app
3. Add Instagram Basic Display product
4. Configure Valid OAuth Redirect URIs

### Facebook Graph API (Meta)
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create an app
3. Add Facebook Login product
4. Configure Valid OAuth Redirect URIs

### X/Twitter API v2
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a project and app
3. Request elevated access (for posting)
4. Configure callback URLs

### LinkedIn Marketing API
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create an app
3. Request "Marketing Developer Platform" access
4. Configure Auth 2.0 settings

### Threads API
1. Go to [Threads Developer](https://developers.facebook.com/docs/threads/)
2. Register your app
3. Request API access

### Snapchat Spotlight (Snap Kit)
1. Go to [Snapchat Developer Portal](https://www.snapchat.com/developer)
2. Create an app
3. Request Spotlight API access

### Pinterest API v5
1. Go to [Pinterest Developer Portal](https://developers.pinterest.com/)
2. Create an app
3. Request API access
4. Configure redirect URIs

### OpenAI API
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account
3. Generate API key in Account Settings

### Anthropic Claude API
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account
3. Generate API key in Account Settings

### Google Gemini API
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an account
3. Generate API key in Settings

---

## 📝 Usage Guide

### Creating a New Job

1. Click "New Job" in the sidebar
2. Paste the video URL you want to download
3. Select the target platforms (YouTube, TikTok, Instagram, etc.)
4. Choose content type (Reel/Short, Long Video 8min+, Story, Post)
5. Configure processing options:
   - Aspect ratio (9:16, 16:9, 1:1, 4:5)
   - Smart cropping (enable/disable)
   - Split long videos (enable/disable)
   - Watermark removal (enable/disable)
   - Compression preset (low, medium, high)
6. Enable "Auto-generate metadata" or enter manually:
   - Title
   - Description
   - Hashtags
7. Choose scheduling:
   - Immediate upload
   - Schedule for later
   - Best time to post (AI suggestion)
8. Click "Create Job"

### Managing the Queue

- View all pending jobs in "Queue" tab
- Select multiple jobs for batch processing
- Monitor progress with real-time updates
- Cancel or retry failed jobs

### Viewing Analytics

- Navigate to "Analytics" tab
- View overview with total metrics
- Filter by platform or time range
- See trend charts over time
- Track top-performing jobs

### Managing Accounts

- Go to "Accounts" tab
- Connect each platform via OAuth 2.0
- View connection status
- Refresh expired tokens
- Revoke access if needed

### Application Settings

- Configure default settings in "Settings" tab
- Set default platforms, content type, aspect ratio
- Configure processing defaults
- Manage file paths
- Choose theme (dark, light, system)

---

## ⚠️ Legal & Ethics

### Important Disclaimers

> **⚠️ IMPORTANT: You are solely responsible for copyright compliance.**

- Only re-upload content that you own or have explicit permission for
- Respect each platform's Terms of Service and API rate limits
- Do not use this tool for copyright infringement
- Do not scrape or collect credentials improperly
- Official OAuth 2.0 authentication only

### Platform Terms of Service

Each platform has its own Terms of Service that you must comply with:

- [YouTube Terms of Service](https://www.youtube.com/t/terms)
- [TikTok Terms of Service](https://www.tiktok.com/legal/terms-of-service)
- [Instagram Terms of Use](https://help.instagram.com/581066165581870)
- [Facebook Terms of Service](https://www.facebook.com/legal/terms)
- [X/Twitter Terms of Service](https://twitter.com/tos)
- [LinkedIn User Agreement](https://www.linkedin.com/legal/user-agreement)
- [Threads Terms](https://www.threads.net/legal/terms)
- [Snapchat Terms of Service](https://www.snapchat.com/en-US/terms)
- [Pinterest Terms of Service](https://policy.pinterest.com/en/terms-of-service)

### API Rate Limits

Respect platform API rate limits to avoid being blocked:

| Platform | Requests/Minute | Requests/Hour |
|----------|-----------------|---------------|
| YouTube | 100 | 10,000 |
| TikTok | 60 | 5,000 |
| Instagram | 200 | 10,000 |
| Facebook | 200 | 10,000 |
| Twitter | 900 | 15,000 |
| LinkedIn | 50 | 5,000 |
| Threads | 60 | 5,000 |
| Snapchat | 100 | 10,000 |
| Pinterest | 200 | 10,000 |

---

## 🛠️ Development

### Project Scripts

```bash
# Install all dependencies
pnpm install

# Run all tests
pnpm test

# Run specific app
pnpm --filter @clipforge/web dev
pnpm --filter @clipforge/web build

# Run Tauri desktop
cd apps/desktop
pnpm tauri dev
pnpm tauri build

# Clean build artifacts
pnpm clean
```

### Architecture

ClipForge uses a **monorepo** structure with:

- **pnpm workspaces**: For dependency management across packages
- **Turbo**: For optimized builds and caching
- **TypeScript**: For type safety across the entire codebase
- **Next.js 15**: For the web frontend with App Router
- **Tauri**: For lightweight desktop applications
- **BullMQ + Redis**: For job queue management
- **Prisma ORM**: For database operations
- **yt-dlp**: For video downloading
- **FFmpeg**: For video processing

### Adding a New Platform

To add support for a new platform:

1. Add platform to `Platform` type in `packages/shared/src/types/index.ts`
2. Add platform configuration in `packages/core/src/services/platform.service.ts`
3. Add OAuth configuration in `packages/core/src/auth/auth.service.ts`
4. Add platform to `PLATFORMS` array in shared types
5. Add platform icon in `apps/web/src/components/platforms/PlatformIcon.tsx`
6. Add rate limit config in `packages/core/src/utils/rate.limiter.ts`
7. Add retry config in `packages/core/src/utils/retry.handler.ts`

### Adding a New Feature

1. Create service in `packages/core/src/services/`
2. Export from `packages/core/src/services/index.ts`
3. Create UI component in `apps/web/src/components/`
4. Add navigation in `apps/web/src/components/layout/Sidebar.tsx`
5. Add view in `apps/web/src/components/layout/Workspace.tsx`

---

## 🐛 Troubleshooting

### Common Issues

#### yt-dlp not found
```bash
# Install yt-dlp
pip install yt-dlp
# or
brew install yt-dlp
```

#### FFmpeg not found
```bash
# Install FFmpeg
brew install ffmpeg
# or
sudo apt install ffmpeg
```

#### Redis connection failed
```bash
# Start Redis
redis-server
# or
docker run -d -p 6379:6379 redis
```

#### OAuth authentication failed
- Check your client ID and secret in `.env`
- Verify redirect URIs match your configuration
- Ensure you've enabled the correct API permissions

#### Video download failed
- Check the URL is valid and accessible
- Try a different video format
- Check if the platform is supported

#### Upload failed
- Verify your OAuth tokens are valid
- Check platform API rate limits
- Ensure the video meets platform requirements (duration, size, format)

### Debug Mode

Enable debug logging:

```bash
# Set DEBUG environment variable
DEBUG=clipforge:* pnpm --filter @clipforge/web dev
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Use Prettier (configured in project)
- **Linting**: Use ESLint (configured in project)
- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/)

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @clipforge/core test
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](../LICENSE) file for details.

---

## 🙏 Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Video downloader
- [FFmpeg](https://ffmpeg.org/) - Video processing
- [Next.js](https://nextjs.org/) - React framework
- [Tauri](https://tauri.app/) - Desktop application framework
- [BullMQ](https://docs.bullmq.io/) - Job queue
- [Prisma](https://www.prisma.io/) - ORM
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animations

---

<div align="center">

**Made with ❤️ for creators**

*ClipForge - Your unified content pipeline*

</div>
