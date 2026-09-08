# 李瑞祥 · 个人主页

AI Agent 产品研发方向个人主页，单页纯静态站点，部署于 Cloudflare Pages。

![设计风格](https://img.shields.io/badge/%E9%A3%8E%E6%A0%BC-%E9%9D%92%E6%9F%A0%E8%83%B6%E5%9B%8A-2FA36B)

## 设计系统

详见 [DESIGN.md](./DESIGN.md) ——「青柠胶囊 Mint Capsule」：一丝浅绿的页面底色 + 纯白卡片、全胶囊化按钮/标签/导航、克制的进场动效。零框架、零外部依赖（字体、图标、JS 全部内置）。

## 目录结构

```
├── index.html              # 页面（全部区块）
├── assets/
│   ├── css/style.css       # design tokens + 组件 + 响应式
│   ├── js/main.js          # 进场动效 / 导航高亮 / 复制交互
│   ├── img/                # 头像、favicon、OG 分享图
│   └── resume/             # 简历 PDF
└── .github/workflows/deploy.yml  # push main → Cloudflare Pages
```

## 本地预览

```bash
python -m http.server 8642
# 打开 http://127.0.0.1:8642
```

> 注意：需要通过 HTTP 访问（而非直接双击 index.html），否则部分浏览器策略会影响字体/子资源加载行为。

## 部署（Cloudflare Pages · GitHub 自动部署）

推送 `main` 分支后，GitHub Actions 会自动用 wrangler 将站点部署到 Cloudflare Pages。

首次配置只需两步：

1. 在 Cloudflare 面板创建 API Token（权限：`Cloudflare Pages: Edit`）：
   <https://dash.cloudflare.com/profile/api-tokens>，并在面板右下角查看 **Account ID**
2. 将两者配置为仓库 Secrets：

```bash
gh secret set CLOUDFLARE_API_TOKEN    # 粘贴 API Token
gh secret set CLOUDFLARE_ACCOUNT_ID   # 粘贴 Account ID
```

配置完成后，每次 `git push` 自动发布；上线地址形如 `https://<project-name>.pages.dev`，自定义域名可在 Cloudflare Pages 项目设置中绑定。

### 备选：面板直连 GitHub

也可以不使用 Actions，在 Cloudflare Pages 控制台选择「Connect to Git」→ 选中本仓库 → 构建命令留空、输出目录填 `/`，效果相同。

## 更新简历

替换 `assets/resume/` 下的 PDF（保持文件名或同步修改 `index.html` 中 3 处链接）后推送即可。
