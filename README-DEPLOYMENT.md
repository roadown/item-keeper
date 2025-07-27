# 部署指南

## 快速部署到 Vercel

### 1. 准备工作
```bash
# 确保代码已提交到 Git
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Vercel 部署步骤

#### 方法一：命令行部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署
vercel --prod
```

#### 方法二：Web 界面部署
1. 访问 [vercel.com](https://vercel.com)
2. 点击 "New Project"
3. 导入你的 GitHub 仓库
4. 配置环境变量：
   - `KIMI_API_KEY`: 你的 Kimi API 密钥

### 3. 环境变量配置
在 Vercel 项目设置中添加：
```
KIMI_API_KEY=sk-Qpjn1kCfQc6Y99KaFBdUz5c6LAhzoWNw5oy76UKwnMT0uOKo
```

### 4. 图标文件生成
1. 在浏览器中打开 `create-icons.html`
2. 会自动下载 `icon-192x192.png` 和 `icon-512x512.png`
3. 将这两个文件放到 `public/` 目录

## PWA 功能

部署后，用户可以：
- 在手机浏览器中"添加到主屏幕"
- 在桌面浏览器中"安装应用"
- 离线基本使用（缓存的页面）

## 验证部署

1. 访问部署的 URL
2. 检查浏览器开发者工具 > Application > Service Workers
3. 测试 PWA 安装功能
4. 验证所有功能正常工作