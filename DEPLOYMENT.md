# 智能物品管家 - 部署指南

本指南介绍如何部署智能物品管家应用，包括本地模式和云同步模式。

## 🚀 快速部署（本地模式）

最简单的部署方式，数据仅保存在浏览器本地存储中：

```bash
# 1. 克隆项目
git clone https://github.com/your-repo/item-keeper.git
cd item-keeper

# 2. 安装依赖
npm install

# 3. 配置环境变量（.env.local）
echo "KIMI_API_KEY=your_kimi_api_key" > .env.local

# 4. 构建并启动
npm run build
npm start
```

访问 `http://localhost:3000` 即可使用。

## ☁️ 云同步部署（完整功能）

要启用多设备同步和用户认证功能，需要配置 Supabase：

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com/) 并创建新项目
2. 在项目设置中获取：
   - `Project URL`
   - `anon/public key`
   - `service_role key`

### 2. 配置数据库

在 Supabase SQL Editor 中执行 `supabase-schema.sql` 文件内容来创建数据表。

### 3. 配置环境变量

创建 `.env.local` 文件：

```bash
# Kimi AI Configuration (必需)
KIMI_API_KEY=your_kimi_api_key

# Supabase Configuration (云同步功能)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/item-keeper)

或手动部署：

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录并部署
vercel login
vercel

# 3. 在 Vercel 控制台中添加环境变量
```

## 🛠️ 配置说明

### 必需配置

- `KIMI_API_KEY`: Moonshot AI (Kimi) API 密钥，用于自然语言处理

### 可选配置（云同步）

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 匿名密钥
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 服务角色密钥

### 运行模式

应用支持两种运行模式：

1. **本地模式**: 只配置 `KIMI_API_KEY`，数据存储在浏览器本地
2. **云同步模式**: 配置完整的 Supabase 环境变量，支持用户注册/登录和云同步

## 📱 PWA 安装

应用支持 PWA (Progressive Web App) 功能：

- **手机**: 在浏览器中打开应用，点击"添加到主屏幕"
- **桌面**: 在地址栏中点击安装图标

## 🔧 故障排除

### 常见问题

1. **构建错误**: 确保 Node.js 版本 >= 18
2. **AI 功能不工作**: 检查 `KIMI_API_KEY` 是否正确配置
3. **登录失败**: 检查 Supabase 环境变量和数据库配置
4. **同步失败**: 确保 Supabase RLS (行级安全性) 策略已正确设置

### 日志调试

```bash
# 开发模式（详细日志）
npm run dev

# 检查构建
npm run build

# 类型检查
npm run type-check
```

## 🔐 安全配置

### Supabase 安全设置

1. 启用行级安全性 (RLS)
2. 配置正确的安全策略
3. 限制 API 密钥权限
4. 定期轮换密钥

### 环境变量安全

- 不要在客户端代码中暴露服务角色密钥
- 使用 `.env.local` 文件存储敏感信息
- 在生产环境中使用环境变量而非文件

## 📊 监控和维护

### 性能监控

- 使用 Vercel Analytics 监控性能
- 定期检查 Supabase 使用量
- 监控 API 调用次数和成本

### 数据备份

- 应用支持数据导出功能
- Supabase 提供自动备份
- 建议定期下载数据备份

## 🆙 升级指南

### 更新应用

```bash
# 拉取最新代码
git pull origin main

# 更新依赖
npm install

# 重新构建
npm run build
```

### 数据库迁移

如果数据库结构有更新，需要：

1. 备份现有数据
2. 执行新的 SQL 迁移脚本
3. 验证数据完整性

## 📞 技术支持

如果遇到部署问题：

1. 检查 [GitHub Issues](https://github.com/your-repo/item-keeper/issues)
2. 查看项目文档
3. 提交新的 Issue 描述问题