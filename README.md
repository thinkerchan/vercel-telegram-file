# Vercel-Telegram-File

一个基于 Vercel Edge Functions 的轻量化Telegram图床 （也支持视频和音频）

## 功能特点

- 文件上传到 Telegram
- 通过原始 Telegram 文件 ID 访问已上传的文件
- 支持防盗链设置
- 基于 Edge Functions 的高性能响应
- 支持文件缓存

## 环境变量配置

需要在 `.env` 文件中配置以下环境变量:

```
TG_BOT_TOKEN=  # 你的Telegram Bot Token，必填
TG_CHAT_ID=  # 你的Telegram聊天ID，必填
HOST=  # ACAO白名单，多个用逗号隔开，选填
REFERRER=  # 防盗链白名单，多个用逗号隔开，选填
```

## 本地开发

1. 安装 Vercel CLI
2. 使用 Vercel CLI 部署

```bash
npm install -g vercel
vercel dev
```