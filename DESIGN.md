# DESIGN.md — 「青柠胶囊 Mint Capsule」UI 风格 Spec v1.1

> 个人主页设计系统 · 李瑞祥 · AI Agent 产品研发
> 关键词：白色为主 · 一丝浅绿点睛 · 简约 · 胶囊元素 · 卡片信息分组

## 1. 设计原则

1. **白色为主**：页面画布纯白 `#FFFFFF`，卡片同为纯白，靠 1px 中性描边与轻阴影分层；绿色不是底色、不是主题色。
2. **绿色点睛预算**：绿色只允许出现在——主 CTA 按钮、「求职中」状态胶囊、时间线轨道与圆点、卡片小图标底、区块标签小圆点、hover/focus 反馈。此外一律中性灰绿（`#F4F6F5` 底 + 深灰绿字）。
3. **胶囊即语言**：按钮、标签、导航、徽章全部使用 `border-radius: 999px` 胶囊形态。
4. **克制的动效**：只做 fade-up 进场与 hover 微反馈，尊重 `prefers-reduced-motion`。

## 2. 色彩 Tokens（CSS 自定义属性）

| Token | 值 | 用途 |
| --- | --- | --- |
| `--bg` | `#FFFFFF` | 页面画布（纯白） |
| `--surface` | `#FFFFFF` | 卡片 / 胶囊 / 导航纯白 |
| `--neutral-soft` | `#F4F6F5` | 默认标签胶囊底（中性灰绿） |
| `--ink` | `#1C2621` | 主文字（墨绿黑） |
| `--ink-2` | `#5C6660` | 次级文字（白底对比度 ≈ 5.5:1） |
| `--ink-3` | `#9AA39D` | 仅装饰性元素，不用于小字正文 |
| `--line` | `#E9ECEA` | 1px 中性描边 |
| `--brand` | `#2FA36B` | 主绿（小圆点、时间线、图标） |
| `--brand-deep` | `#1F7A4D` | 深绿（主按钮、小字绿，白底对比度 ≈ 5.3:1） |
| `--brand-deeper` | `#17653F` | 按钮/文字 hover |
| `--brand-soft` | `#EDF7F1` | 绿胶囊底（仅状态胶囊与图标底） |

Hero 顶部有一缕极淡绿光晕（约 4–5% 透明度的径向渐变），是"背景一丝浅绿"的唯一表达；正文区块不再有绿色底色带。

阴影三层均为中性色（墨黑低透明度），不再使用绿色投影。

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
- **标签胶囊**：`--neutral-soft` 底 + 深灰绿字 `#46534C`，13px / 600，padding 5px 14px（默认中性，不抢眼）
- **状态胶囊**：唯一允许绿底的标签（`--brand-soft` 底 + `--brand-deeper` 字 + 呼吸圆点），仅用于「求职中」
- **CTA 主按钮**：绿渐变底（`#27995C → #1F7A4D`）+ 白字 —— 页面上最大的绿色块，仅此一处
- **CTA 次按钮**：白底 + `--line` 描边 + `--ink` 字，hover 描边转绿、字转深绿
- **导航胶囊**：sticky 顶部浮动，白 88% + `backdrop-filter: blur(12px)`，`--shadow-nav`；品牌圆标为中性灰绿
- **荣誉徽章**：白底卡片化胶囊，线性奖杯图标用主绿勾勒

### 卡片（Card）
- 白底 + 1px `--line` + `--r-card` + `--shadow-card`（中性阴影），内边距 24–28px
- hover：`translateY(-3px)` + `--shadow-pop` + 描边微深（`#D5DCD8`，仅指针设备）
- 卡片标题行 = 40px 图标容器（`--brand-soft` 底、12px 圆角、深绿 1.7px 线性 SVG 图标——这是绿色在卡片内的唯一出现点）+ 标题 + 副标
- 经历区块：时间线轨道与圆点是绿色；指标胶囊中性灰绿，仅「核心项目」徽章用绿底白字强调

## 6. 布局系统

- 容器 `max-width: 1080px`，两侧 padding 24px
- 区块纵向间距 96px（移动端 64px）；各区块间以留白分隔，无彩色底色带
- 断点：960px（时间线收窄、统计 2×2）、640px（导航锚点隐藏、网格单列）
- 时间线：左侧 2px 渐变轨道 + 12px 圆点，桌面端内容偏移 56px，移动端 28px

## 7. 无障碍与性能

- 语义化标签（header/nav/main/section/footer）+ 完整标题层级 h1→h3
- 文字对比度全部 ≥ 4.5:1；`:focus-visible` 2px 深绿描边
- `prefers-reduced-motion` 下关闭平滑滚动与进场动效
- 零框架、零外部请求（字体/图标/JS 均内置），全站单 HTML + 单 CSS + <5KB JS
