# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "智能物品管家 (Smart Item Keeper)" - an AI-powered application that helps users record and query the location of their belongings using natural language. Users can input statements like "我把身份证放在书桌抽屉里" (I put my ID card in the desk drawer) and later query "身份证在哪？" (Where is my ID card?).

## Project Status

This project is currently in the **planning/documentation phase**. The codebase contains only a README.md file with project specifications. No actual code has been implemented yet.

## Planned Architecture

Based on the README.md specifications:

### Frontend (PWA + Responsive)
- React + Next.js (recommended)
- Tailwind CSS for UI
- PWA support for desktop/mobile

### Backend (Data Storage + Auth)
- Supabase or Firebase
- Real-time database / auth system / cloud functions

### AI Module (Semantic Analysis)
- OpenAI / Claude / Gemini API
- Or local NLP modules (Spacy / Transformers)

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

- `npm install` - Install dependencies (includes openai package for Kimi API)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linting
- `npm run type-check` - TypeScript type checking

## Development Environment Requirements

- Node.js 18+
- npm 9+
- Kimi API key (Moonshot AI) for AI features
- Environment variables in `.env.local`:
  - `KIMI_API_KEY=your_kimi_api_key`

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
6. 🔜 **Multi-platform Sync** - User accounts and cloud synchronization
7. 🔜 **Voice Input** - Whisper/Vosk integration for speech recognition

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

## Interface Design

The application uses a single textarea approach similar to ChatGPT:
- **Multi-line Input**: 4-row default height, expandable to 8 rows with auto-resize
- **Mobile Optimized**: Responsive layout with touch-friendly controls
- **Smart Interactions**: Enter to send, Shift+Enter for new line
- **Manual Controls**: Quick delete buttons on search results and record lists
- **AI Processing**: Automatic intent detection with visual feedback
- **Context Awareness**: Handles complex references like "delete this result"
- **Progressive Web App**: Installable with offline capabilities

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