# DESIGN.md — 「青柠胶囊 Mint Capsule」UI 风格 Spec

> 个人主页设计系统 v1.0 · 李瑞祥 · AI Agent 产品研发
> 关键词：简约 · 一丝浅绿 · 纯白卡片 · 胶囊元素 · 卡片信息分组

## 1. 设计原则

1. **内容优先**：绿色只做氛围点缀，不做大面积色块；信息靠留白与层级区分。
2. **胶囊即语言**：按钮、标签、导航、徽章全部使用 `border-radius: 999px` 胶囊形态。
3. **卡片承载信息**：每个信息组一块纯白卡片，页面底色透一丝浅绿，形成"白卡片浮于青雾之上"的层次。
4. **克制的动效**：只做 fade-up 进场与 hover 微反馈，尊重 `prefers-reduced-motion`。

## 2. 色彩 Tokens（CSS 自定义属性）

| Token | 值 | 用途 |
| --- | --- | --- |
| `--bg` | `#F6FAF7` | 页面底色（白中透一丝浅绿） |
| `--bg-wash` | `#ECF5EE` | Hero 光晕、区块淡绿装饰 |
| `--surface` | `#FFFFFF` | 卡片 / 胶囊 / 导航纯白 |
| `--ink` | `#182720` | 主文字（墨绿黑） |
| `--ink-2` | `#5A6C60` | 次级文字（白底对比度 ≈ 5.6:1） |
| `--ink-3` | `#93A699` | 仅装饰性元素，不用于小字正文 |
| `--brand` | `#2FA36B` | 主绿（图形、大字号、图标） |
| `--brand-deep` | `#1F7A4D` | 深绿（小字、按钮底，白底对比度 ≈ 5.3:1） |
| `--brand-deeper` | `#17653F` | 按钮 hover |
| `--brand-soft` | `#E4F3E9` | 胶囊底色（配 `--brand-deep` 文字，对比度 ≈ 4.65:1） |
| `--line` | `#E2ECE4` | 1px 描边 |

阴影三层：`--shadow-sm`（细描边补充）、`--shadow-card`（卡片静置）、`--shadow-pop`（hover 浮起，带绿色氛围）。

## 3. 字体

系统字体栈，**不加载任何外部字体**（保证国内访问速度）：

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", Inter,
  "PingFang SC", "HarmonyOS Sans SC", "MiSans", "Microsoft YaHei UI",
  "Microsoft YaHei", "Noto Sans SC", sans-serif;
```

| 层级 | 规格 |
| --- | --- |
| Hero 姓名 | 44–52px / 700 / letter-spacing -0.5px |
| 区块标题 h2 | 28–30px / 650 |
| 卡片标题 h3 | 17–18px / 600 |
| 正文 | 15–16px / 400 / 行高 1.7 |
| 辅助说明 | 13px / 400 / `--ink-2` |

## 4. 形状 Tokens

- 胶囊 `--r-pill: 999px`：按钮、标签、导航、徽章、头像外框
- 卡片 `--r-card: 20px`（小卡 14px，图标容器 12px）
- 按钮高度 44px（移动端 42px），水平内边距 20–24px

## 5. 组件规范

### 胶囊（Pill）
- **标签胶囊**：`--brand-soft` 底 + `--brand-deep` 字，13px / 600，padding 5px 14px
- **状态胶囊**：白底 + `--line` 描边 + 圆点图标，用于 Hero 状态行
- **CTA 主按钮**：绿渐变底（`#27995C → #1F7A4D`）+ 白字，hover 上浮 1px + `--shadow-pop`
- **CTA 次按钮**：白底 + `--line` 描边 + `--ink` 字，hover 描边转绿、字转深绿
- **导航胶囊**：sticky 顶部浮动，白 85% + `backdrop-filter: blur(12px)`，`--shadow-card`
- **荣誉徽章**：白底卡片化胶囊，内含线性奖杯图标

### 卡片（Card）
- 白底 + 1px `--line` + `--r-card` + `--shadow-card`，内边距 24–28px
- hover：`translateY(-3px)` + `--shadow-pop` + 描边转 `--brand-soft`（仅指针设备）
- 卡片标题行 = 40px 图标容器（`--brand-soft` 底、12px 圆角、深绿 1.7px 线性 SVG 图标）+ 标题 + 副标
- 进场动画由 `.reveal` + `IntersectionObserver` 驱动：opacity 0→1、translateY 10px→0，400ms，组内错峰 60ms（`--d` 变量控制）

## 6. 布局系统

- 容器 `max-width: 1080px`，两侧 padding 24px
- 区块纵向间距 96px（移动端 64px）
- 断点：960px（时间线收窄、统计 2×2）、640px（导航锚点隐藏、网格单列）
- 时间线：左侧 2px 渐变轨道 + 12px 圆点，桌面端内容偏移 56px，移动端 28px

## 7. 无障碍与性能

- 语义化标签（header/nav/main/section/footer）+ 完整标题层级 h1→h3
- 文字对比度全部 ≥ 4.5:1；`:focus-visible` 2px 深绿描边
- `prefers-reduced-motion` 下关闭平滑滚动与进场动效
- 零框架、零外部请求（字体/图标/JS 均内置），全站单 HTML + 单 CSS + <5KB JS
