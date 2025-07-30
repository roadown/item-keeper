# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "智能物品管家 (Smart Item Keeper)" - an AI-powered application that helps users record and query the location of their belongings using natural language. Users can input statements like "我把身份证放在书桌抽屉里" (I put my ID card in the desk drawer) and later query "身份证在哪？" (Where is my ID card?).

## Project Status

This project has completed **all planned implementation phases**. The application is fully functional with cloud synchronization, user authentication, offline-first design, and intelligent data merging capabilities. The voice input phase was skipped as users can utilize system-level voice-to-text functionality.

## Current Architecture

The application uses a modern, scalable architecture:

### Frontend (PWA + Responsive) ✅
- React + Next.js 14 with TypeScript
- Tailwind CSS for responsive UI design
- PWA support with offline capabilities
- Mobile-first responsive design

### Backend (Data Storage + Auth) ✅
- Supabase for authentication and database
- Row Level Security (RLS) for data protection
- Real-time synchronization capabilities
- OAuth integration (Google login)

### AI Module (Semantic Analysis) ✅
- Kimi AI (Moonshot API) for natural language processing
- Intent detection and semantic search
- Fallback to local parsing if API unavailable

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

## Development Commands

- `npm install` - Install dependencies (includes openai package for Kimi API and Supabase)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linting
- `npm run type-check` - TypeScript type checking

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

## Interface Design

The application uses a single textarea approach similar to ChatGPT:
- **Multi-line Input**: 4-row default height, expandable to 8 rows with auto-resize
- **Mobile Optimized**: Responsive layout with touch-friendly controls
- **Smart Interactions**: Enter to send, Shift+Enter for new line
- **Manual Controls**: Quick delete buttons on search results and record lists
- **AI Processing**: Automatic intent detection with visual feedback
- **Context Awareness**: Handles complex references like "delete this result"
- **Progressive Web App**: Installable with offline capabilities
- **Cloud Synchronization**: Supabase-based multi-device sync
- **User Authentication**: Email/password and OAuth (Google) login
- **Offline-first Design**: Works without internet, syncs when available
- **Intelligent Sync**: Smart merging of local and cloud data
- **Real-time Backup**: Automatic cloud backup of all operations

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