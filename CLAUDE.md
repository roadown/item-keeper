# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "智能物品管家 (Smart Item Keeper)" - an AI-powered application that helps users record and query the location of their belongings using natural language. Users can input statements like "我把身份证放在书桌抽屉里" (I put my ID card in the desk drawer) and later query "身份证在哪？" (Where is my ID card?).

## Project Status

**Latest Update (2025-07-30):** 🎨 **Major UI Redesign & Architecture Modernization**

The project has undergone a complete UI redesign with modern design system implementation and infrastructure modernization:

- ✅ **UI/UX Overhaul**: Complete redesign with modern design system, ChatGPT-style interface
- ✅ **GitHub Integration**: Migrated from manual Vercel deployment to GitHub-based CI/CD
- ✅ **Component Library**: Built comprehensive UI component system with Tailwind CSS
- ✅ **Mobile Optimization**: Enhanced responsive design for multi-platform deployment
- ✅ **Animation System**: Added smooth transitions and micro-interactions

**Core Functionality Status:**
This project has completed **all planned implementation phases**. The application is fully functional with cloud synchronization, user authentication, offline-first design, and intelligent data merging capabilities. The voice input phase was skipped as users can utilize system-level voice-to-text functionality.

## Current Architecture

The application uses a modern, scalable architecture optimized for multi-platform deployment:

### Frontend (Modern PWA + Design System) ✅
- **Framework**: React + Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with comprehensive design system
- **UI Library**: Custom component library (Button, Input, Card, Badge, etc.)
- **Design**: Modern gradient backgrounds, glass morphism effects
- **Responsive**: Mobile-first design with optimized touch interactions
- **PWA**: Offline capabilities and installable features
- **Animations**: Smooth transitions and micro-interactions

### Backend (Cloud Infrastructure) ✅
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with OAuth (Google login)
- **Real-time**: Live synchronization across devices
- **Security**: Data isolation and secure API endpoints

### AI Module (Natural Language Processing) ✅
- **Primary**: Kimi AI (Moonshot API) for semantic analysis
- **Features**: Intent detection, fuzzy search, context awareness
- **Fallback**: Local parsing for offline functionality
- **Smart Operations**: Contextual delete, classification, statistics

### DevOps & Deployment ✅
- **Repository**: GitHub with automated CI/CD
- **Deployment**: Vercel with automatic builds on push
- **Environment**: Secure environment variable management
- **Monitoring**: Build logs and deployment status tracking

## Data Structure Design

The application will store records in this format:
```json
{
  "user_id": "abc123",
  "item": "身份证",
  "location": "书桌左边抽屉",
  "created_at": "2025-07-27T11:05:00Z",
  "raw_input": "我把身份证放在书桌左边的抽屉里",
  "source": "text",
  "tags": ["证件", "重要物品"]
}
```

## Design System & Technology Stack

### Modern Design System
- **Color Palette**: Primary (sky blue), Accent (orange), Success/Warning/Error semantic colors
- **Typography**: Inter font family with proper line heights and font weights
- **Spacing**: Consistent 8px-based spacing system
- **Border Radius**: Modern rounded corners (xl: 12px, 2xl: 16px)
- **Shadows**: Layered shadow system with glow effects
- **Animation**: Custom keyframes for fade-in, slide-up, scale-in transitions

### UI Component Library
- **Button**: Multiple variants (primary, secondary, accent, success, warning, error, ghost, outline)
- **Input/Textarea**: Auto-resize, error states, icon support
- **Card**: Hover effects, glass morphism variants
- **Badge/Tag**: Status indicators with consistent styling
- **Layout**: Container utilities for different content widths

### Responsive Design
- **Breakpoints**: xs(475px), sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1536px)
- **Mobile-first**: Optimized for touch interactions and small screens
- **Progressive Enhancement**: Graceful degradation for older browsers

## Development Commands

- `npm install` - Install dependencies (includes clsx, tailwind-merge, openai, supabase)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linting
- `npm run type-check` - TypeScript type checking

## Repository & Deployment

- **GitHub Repository**: https://github.com/roadown/item-keeper
- **Live Demo**: Auto-deployed via Vercel on every push to main branch
- **CI/CD**: Automated build, test, and deployment pipeline

## Development Environment Requirements

- Node.js 18+
- npm 9+
- Kimi API key (Moonshot AI) for AI features
- Supabase project for cloud sync and user authentication
- Environment variables in `.env.local`:
  - `KIMI_API_KEY=your_kimi_api_key`
  - `NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`
  - `SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key` (optional)

## Database Setup

The application requires the following Supabase database tables:

```sql
-- 创建物品记录表
CREATE TABLE item_records (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  raw_input TEXT NOT NULL,
  source TEXT DEFAULT 'text',
  tags TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建回收站表
CREATE TABLE recycle_bin (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  raw_input TEXT NOT NULL,
  source TEXT DEFAULT 'text',
  tags TEXT[] DEFAULT '{}',
  deleted_at TIMESTAMPTZ NOT NULL,
  delete_reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE item_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycle_bin ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：用户只能访问自己的数据
CREATE POLICY "Users can only access their own records"
ON item_records FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own recycle bin"
ON recycle_bin FOR ALL USING (auth.uid() = user_id);
```

## API Integration

### Kimi API Setup
- Base URL: `https://api.moonshot.cn/v1`
- Model: `kimi-k2-0711-preview`
- Used for intent detection and semantic search
- Fallback mechanism to basic parsing if API fails

## Implementation Phases

1. ✅ **MVP (Web Prototype)** - Basic input/query interface with local storage
2. ✅ **AI Enhancement** - Kimi API integration with semantic analysis
3. ✅ **Data Persistence** - localStorage with backup/restore capabilities
4. ✅ **PWA Deployment** - Vercel deployment with mobile PWA support
5. ✅ **UX Optimization** - Mobile responsive design and manual controls
6. ✅ **Multi-platform Sync** - User accounts and cloud synchronization with Supabase
7. ❌ **Voice Input** - Skipped (users can use system voice input)

## Core Features Implemented

- **Single Input Interface**: Unified textarea with AI-powered intent detection
- **Kimi AI Integration**: Natural language processing with Moonshot API
- **Comprehensive Operations**: Record, search, delete, classify, and statistics
- **Semantic Search**: AI-powered fuzzy matching and context understanding
- **Recycle Bin System**: Safe deletion with restore capabilities
- **Smart Context Awareness**: Handles "delete this result" type references
- **Manual Delete Controls**: Quick delete buttons in search results and record lists
- **Data Persistence**: localStorage with auto-save functionality
- **Data Management**: Export/import, backup/restore capabilities
- **Progressive Web App**: PWA with offline support and installable features
- **Mobile Responsive**: Optimized for mobile devices with touch-friendly interface
- **Auto-cleanup**: 30-day automatic recycle bin maintenance
- **Multi-platform Sync**: Supabase-based cloud synchronization with user authentication
- **Offline-first Design**: Works without internet connection, syncs when available
- **Real-time Sync**: Automatic cloud backup of all user operations
- **Intelligent Sync**: Smart merge of local and cloud data without conflicts

## Modern Interface Design

The application features a ChatGPT-inspired modern interface:

### Visual Design
- **Gradient Backgrounds**: Subtle color transitions from neutral to brand colors
- **Glass Morphism**: Semi-transparent cards with backdrop blur effects
- **Modern Typography**: Inter font with improved readability and spacing
- **Consistent Iconography**: Emoji-based icons with proper spacing and sizing
- **Brand Identity**: Professional logo and consistent color application

### Interaction Design
- **Smart Input Area**: Auto-resizing textarea with keyboard shortcuts
- **Floating Action Button**: Prominent send button with loading states
- **Contextual Feedback**: Animated status cards for different operations
- **Hover Effects**: Subtle animations on interactive elements
- **Touch Optimization**: Larger touch targets for mobile devices

### Layout Structure
- **Container System**: Responsive containers for different content types
- **Card-based Layout**: Organized information in distinct visual groups
- **Progressive Disclosure**: Collapsible menus and expandable sections
- **Mobile Navigation**: Optimized header and action buttons for small screens

## AI Features

### Intent Detection
- Record: `我把身份证放在书桌抽屉里`
- Search: `身份证在哪里？`
- Delete: `删除身份证` or `删除这条结果`
- Classify: `给身份证加上证件标签`
- Statistics: `统计我的物品`

### Safety Features
- Contextual delete protection (prevents accidental mass deletion)
- Recycle bin with detailed deletion history
- Restore functionality for mistaken deletions
- Fallback to simple parsing if AI fails

### Data Management
- **Auto-save**: Real-time localStorage persistence
- **Export**: JSON backup files with timestamp
- **Import**: Restore data from backup files
- **Version control**: Data structure compatibility checking
- **Storage info**: Display usage statistics and item counts
- **Clear data**: Safe reset with confirmation dialog
- **Cloud sync**: Multi-device synchronization via Supabase
- **User management**: Authentication and data isolation
- **Sync status**: Real-time sync status monitoring
- **Conflict resolution**: Intelligent merge strategies

## Multi-Platform Deployment Strategy

### Current Status
- ✅ **Web Application**: Deployed on Vercel with modern UI
- ✅ **PWA Support**: Installable progressive web app
- ✅ **Mobile Responsive**: Optimized for all screen sizes

### Planned Platform Releases

#### 📱 **Mobile Applications**
- **Android**: Capacitor + PWA wrapper approach
- **iOS**: Capacitor + App Store deployment
- **Target**: Native app store distribution with web codebase

#### 💻 **Desktop Applications**
- **Electron**: Desktop wrapper for Windows, macOS, Linux
- **Tauri**: Lightweight alternative for better performance
- **Target**: Native desktop experience with same codebase

#### 🌐 **Enhanced Web Features**
- **WebAssembly**: Performance-critical operations
- **Service Workers**: Advanced offline capabilities
- **Push Notifications**: Real-time updates across devices

### Technical Advantages for Multi-Platform
- **Single Codebase**: React/Next.js foundation works across all platforms
- **Modern Design System**: Consistent UI components and styling
- **Cloud Sync**: Seamless data synchronization across all devices
- **PWA Foundation**: Already optimized for mobile and offline use
- **Component Architecture**: Reusable UI elements for any platform

### Development Roadmap
1. **Phase 1**: Finalize web application and test all features
2. **Phase 2**: Implement Capacitor for mobile app packaging
3. **Phase 3**: Test and deploy to app stores (Google Play, App Store)
4. **Phase 4**: Develop desktop applications with Electron/Tauri
5. **Phase 5**: Advanced platform-specific optimizations

The current modern UI redesign has established the foundation for seamless multi-platform deployment while maintaining code reusability and consistent user experience.