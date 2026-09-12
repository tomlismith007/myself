# 李瑞祥 · 个人主页与技术作品集

> **AI Agent 产品研发** 方向个人主页，纯原生现代化单页站点（Zero Framework，零第三方前端依赖），兼顾极简美学、微动效与极致性能。站点统计接入自托管 Umami（`umami.ruinexai.com`），尊重 Do Not Track。

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/zh-CN/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-Modern_Tokens-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/zh-CN/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/Vanilla_JS-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript)
[![Deploy](https://img.shields.io/badge/Deploy-Cloudflare_Pages-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)

---

## ✨ 核心亮点与设计系统

遵循现代前端美学规范与自然物理光照系统（详见 [DESIGN.md](./DESIGN.md)）：

1. **自然物理光照层级**：
   - 画布底色采用柔和净白（`#F6F8F7`，~97.5% 明度）；
   - 抬升卡片采用至纯白（`#FFFFFF`，100% 明度），配合精工微边框与超柔环境遮挡阴影（Ambient Occlusion），形成纯白卡片自然浮起、向前发光的通透层次感。
2. **顶层流动翡翠极光**：
   - 页面根部无缝铺设 CSS 硬件加速环境光（`page-glow`），三色团轻盈弥散，与毛玻璃胶囊导航栏深度融合。
3. **黑曜石质感行为按键**：
   - 作品卡与推荐卡的 GitHub 行为按键采用深碳黑曜石胶囊（`#111827`，纯白文字对比度 > 15:1）；
   - 页面主操作（复制邮箱等）采用纯白微边框幽灵胶囊，复制成功后瞬时反色为黑曜石底，提供触感反馈。
4. **全端居左自适应网格**：
   - **桌面端（> 960px）**：双列大图文编排；
   - **平板端（641px ~ 960px）**：紧凑双列，头像固定居左；
   - **手机端（≤ 640px）**：精巧流式网格，左上方证件照 + 右上方姓名与方向 + 下方通栏正文与按键，全端严格保持头像靠左，消除大面积无效留白。
5. **极简零依赖与极致性能**：
   - 零框架、零第三方前端库、内联 SVG 图标系统；
   - 统计仅接入自托管 Umami 脚本（`defer` 加载，`data-domains` 限定生产域名，尊重 Do Not Track）；
   - 支持 `prefers-reduced-motion` 无障碍动态减弱。

---

## 📂 项目结构

```text
├── index.html                  # 页面结构与全部语义化区块
├── DESIGN.md                   # 视觉设计系统与规范文档 (Spec v2.2)
├── README.md                   # 项目说明文档
├── .gitignore                  # Git 忽略规则
└── assets/
    ├── css/
    │   └── style.css           # Design Tokens、组件样式与响应式断点
    ├── js/
    │   └── main.js             # 进场动效、ScrollSpy、Skills 轮盘、复制交互与埋点委托
    └── img/
        ├── avatar.jpg          # 个人证件照
        ├── favicon.svg         # 站点矢量图标
        └── og-cover.png        # Open Graph 社交分享预览卡片
```

---

## 🚀 本地运行与预览

本项目为纯静态前端站点，可使用任意本地静态服务器启动：

```bash
# 使用 Python 内置 HTTP 服务
python -m http.server 8080

# 或使用 Node.js / npx
npx serve .
```

启动后在浏览器打开 `http://localhost:8080` 即可实时预览。

> 💡 **提示**：请通过 HTTP/HTTPS 服务打开页面，以确保浏览器正常处理路径锚点与字体加载策略。

---

## 🌐 部署指南

### 方式一：Cloudflare Pages（推荐，直连 Git 自动部署）

无需任何 CI 配置，使用 Pages 原生 Git 集成：

1. Cloudflare 控制台 → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**，选择本仓库；
2. 构建设置：**Build command 留空**，**Build output directory 填 `/`**；
3. 保存后每次推送 `main` 分支即自动发布，毫秒级上线。

### 方式二：GitHub Pages

1. 进入 GitHub 仓库设置 `Settings -> Pages`；
2. 在 **Build and deployment** 下，Source 选择 **Deploy from a branch**；
3. 分支选择 `main`，目录选择 `/ (root)`，点击保存即可获得免费主页。

> 📊 **统计说明**：页面内置 Umami 统计脚本（`umami.ruinexai.com`，自托管），由 `data-domains` 限定只在生产域名 `liruixiang.ruinexai.com` 上报，本地预览与测试环境不产生数据。统计服务的部署与运维不在本仓库范围内。

---

## 📝 个人信息定制

- **个人简介与经历**：直接编辑 `index.html` 中的相应语义化 `<section>` 区块；
- **联系方式**：邮箱、电话（脱敏展示）等联系信息维护在 `index.html` 的 Hero 与联系区块；
- **证件照片**：替换 `assets/img/avatar.jpg`。
