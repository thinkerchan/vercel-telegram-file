# Vercel-Telegram-File

一个基于 Vercel Edge Functions 的轻量化Telegram图床 （也支持视频和音频）

## 功能特点

- 文件上传到 Telegram
- 通过原始 Telegram 文件 ID 访问已上传的文件
- 支持防盗链设置
- 基于 Edge Functions 的高性能响应
- 支持文件缓存
- 对webp/png/gif的上传进行文件还原处理 (默认情况下传上去都是jpg)

## 环境变量配置

需要在 `.env` 文件中配置以下环境变量:

```
#.env文件
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

## 部署
- 先fork本项目
- vercel导入项目
- 配置环境变量 （把.env文件内容复制到vercel环境变量中）
- 部署


## 注意事项
- 访问文件的时候，telegram根据原始id请求并不返回原始文件类型,若有人修改URL的文件类型，只要还在白名单内的，都可以请求回数据
- 只要上传了文件到telegram, 除非官方主动删除，否则文件一直存在