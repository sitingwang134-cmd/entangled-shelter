# Shopify Editions Winter ’26 页面结构分析

## 结论摘要

这不是一个由 31 个平级内容区块组成的普通落地页，而是一套“固定舞台 + 长滚动章节 + 产品卡片 + 全局弹层”的发布会式页面。桌面提取中的 31 个 `sections` 实际由 1 个 Hero 滚动占位、1 个主内容聚合容器、12 个一级产品章节和 17 个被提取器提升为重点节点的 `article` 组成。原生 `<section>` 只有 12 个，正好对应侧边章节导航。

复刻工程没有把这些区域重新实现为本地 React 组件，而是让 Next.js 将捕获的 Shopify Remix 文档作为顶层页面返回。这个方案能保留原始滚动、WebGL、Rive、视频、焦点与响应式行为，但也意味着当前实现仍依赖 Shopify Oxygen 上的远程 JavaScript 模块，不是完全离线、可独立演进的重写。

## 分析口径与证据

- 页面来源：`source.html`。
- 桌面几何与 31 节点顺序：`desktop-1440-extraction.json`、`PAGE_TOPOLOGY.md`。
- 平板与手机结构差异：`tablet-768-extraction.json`、`mobile-390-extraction.json`、`viewport-summary.json`。
- 行为、布局与宿主实现：`BEHAVIORS.md`、`LAYOUT_ARCHITECTURE.md`、`COMPONENT_INVENTORY.md`、`TECH_STACK_ANALYSIS.md`。
- 尺寸均为 1440 × 900 桌面提取值；Hero 的可视盒因 `translate-y-[-100%]` 在提取结果中显示为 `y=-1350`，本表按其正常文档流位置记为 0–1,350 px。

## 总体层级

```text
body
├─ 固定全局 Header（z-index 9999）
│  ├─ Editions 标识 / 返回顶部
│  ├─ Editions 选择器、搜索、Shopify.com、Start for free
│  └─ 移动端 Menu 与折叠导航
└─ main
   ├─ Hero 舞台层
   │  ├─ 客户端注入的 sticky 全屏 Canvas/WebGL
   │  ├─ 装饰 SVG / Da Vinci 线框
   │  └─ 150svh Hero 滚动占位 div[data-section-id="hero"]
   ├─ 章节侧栏 aside[data-section-name="side-nav"]
   │  ├─ “The Renaissance Edition” 标题
   │  ├─ 12 个章节锚点
   │  └─ © / Terms / Privacy（页面没有传统 footer）
   ├─ #main-content
   │  └─ 12 个一级 section
   │     ├─ 章节 Intro：超大 H2 + 导语
   │     ├─ 1–N 个专题内容组
   │     │  └─ article[data-component-name="product"]
   │     │     ├─ 标题与正文
   │     │     ├─ CTA / 内联链接
   │     │     └─ 图片、视频、Rive、Canvas 或 SVG
   │     ├─ 紧凑产品卡片网格 / 更新清单
   │     └─ 返回导航的键盘焦点入口
   ├─ 全局弹层
   │  ├─ product-modal
   │  ├─ video-modal
   │  └─ merch-modal
   └─ Remix 上下文、loader 数据与 hydration 脚本
```

桌面从 940 px 起启用 `global-lg` 分支：左侧约 20% 为固定章节导航，右侧约 80% 为正文；正文中的主要卡片再使用 12 列网格或 `subgrid`。章节本身常设为 `pointer-events-none`，只有实际内容组恢复 `pointer-events-auto`，以避免透明舞台层截获滚动与指针事件。

## 31 个提取节点的归类与顺序

| # | DOM / ID | 父级归属 | 类型与职责 | 桌面位置（top / height） |
| ---: | --- | --- | --- | ---: |
| 1 | `div[data-section-id="hero"]` | Hero | 结构层；150svh 滚动时间轴占位，驱动首屏 Canvas/WebGL | 0 / 1,350 |
| 2 | `div#main-content` | 主内容 | 聚合层；包住全部 12 个产品章节 | 1,350 / 52,752 |
| 3 | `section#sidekick` | 主内容 | 一级章节；AI 助手总章 | 1,350 / 8,549 |
| 4 | `article#sidekick-video` | Sidekick | 媒体开场；海报 + 播放按钮 +视频弹层 | 2,610 / 308 |
| 5 | `article#sidekick-pulse` | Sidekick | 重点产品；文案、CTA、响应式媒体/Rive | 3,190 / 782 |
| 6 | `article#sidekick-generates-apps` | Sidekick | 互动专题；桌面漂浮应用卡，紧凑宽度改为横向 snap 轮播 | 4,244 / 572 |
| 7 | `article#sidekick-builds-workflows-in-shopify-flow` | Sidekick | 重点产品；内容与演示媒体并排 | 4,920 / 554 |
| 8 | `article#sidekick-generates-theme-edits` | Sidekick | 重点产品；主题编辑演示 | 6,361 / 945 |
| 9 | `article#sidekick-skills` | Sidekick | 高密度互动；20 个 skill tag 与技能链接 | 8,218 / 713 |
| 10 | `section#agentic` | 主内容 | 一级章节；Agentic Storefronts 总章 | 9,899 / 2,735 |
| 11 | `article#shopify-agentic-storefronts` | Agentic | 主产品；文案 + CTA + Rive/海报 | 11,159 / 738 |
| 12 | `article#agentic-storefronts-video` | Agentic | 16:9 全宽视频卡；打开全局 video-modal | 11,897 / 657 |
| 13 | `section#online` | 主内容 | 一级章节；Online 总章 | 12,634 / 5,806 |
| 14 | `article#rollouts` | Online | 重点动效；滚动/可视状态驱动的 Canvas/Rive 演示 | 13,894 / 982 |
| 15 | `article#shopify-simgym-app` | Online | 重点产品；应用介绍与动态演示 | 14,980 / 656 |
| 16 | `article#tinker-app` | Online | 视频型重点卡；“Introducing Tinker” | 17,361 / 959 |
| 17 | `section#retail` | 主内容 | 一级章节；Retail 总章，也是最长产品叙事之一 | 18,440 / 8,196 |
| 18 | `article#pos-hub` | Retail | Sticky 叙事第 1 幕；POS Hub 总览 | 20,150 / 1,485 |
| 19 | `article#connections-that-never-drop` | Retail | Sticky 叙事第 2 幕；连接可靠性 | 21,739 / 1,485 |
| 20 | `article#the-only-hub-with-processing-power` | Retail | Sticky 叙事第 3 幕；硬件能力、兼容项与 CTA | 23,328 / 1,485 |
| 21 | `section#marketing` | 主内容 | 一级章节；Marketing 总章 | 26,637 / 4,127 |
| 22 | `article#shopify-product-network` | Marketing | 章节主产品；媒体、CTA，并可打开视频弹层 | 28,122 / 926 |
| 23 | `section#checkout` | 主内容 | 一级章节；Intro + 小卡网格 + 更新清单 | 30,763 / 2,191 |
| 24 | `section#operations` | 主内容 | 一级章节；Intro + 运营产品卡 + 更新清单 | 32,955 / 2,861 |
| 25 | `section#shop-app` | 主内容 | 一级章节；Intro + Shop 体验卡 + 更新清单 | 35,816 / 2,401 |
| 26 | `section#b2b` | 主内容 | 一级章节；Intro + B2B 产品卡 + 更新清单 | 38,217 / 2,888 |
| 27 | `section#finance` | 主内容 | 一级章节；Intro + Capital/Balance 卡 + 更新清单 | 41,105 / 2,403 |
| 28 | `section#shipping` | 主内容 | 一级章节；Intro + 物流卡 + 更新清单 | 43,508 / 2,219 |
| 29 | `section#developer` | 主内容 | 一级章节；浅色尾章，包含多个开发者子主题 | 45,726 / 8,376 |
| 30 | `article#build-commerce-agents-from-the-dev-dash` | Developer | Agentic Commerce 主产品；文案、开发文档 CTA、Rive | 47,115 / 594 |
| 31 | `article#build-with-full-mcp-support` | Developer | 全宽视频卡；MCP 主题并打开 video-modal | 49,609 / 648 |

### 节点统计为何会随视口变化

桌面提取为 31 个节点，而 768 px 与 390 px 均为 77 个节点。增加的 46 个不是新增一级章节；12 个章节的顺序和锚点完全不变。紧凑宽度下，大量在桌面被并排、叠置或合并呈现的小产品卡进入独立纵向流，因此被提取器识别为单独 `article`。例如 Sidekick 从 6 个重点子节点扩展到 13 个，Retail 额外暴露 5 个小卡，Developer 额外暴露 10 个小卡。维护时应以 12 个 `data-section-id` 作为信息架构真相，以 31/77 作为特定视口下的提取结果，不能把二者混用。

## 12 个一级章节的内容节奏

| 顺序 | 章节 | 主要表现模式 | 桌面高度 |
| ---: | --- | --- | ---: |
| 1 | Sidekick | 视频开场、AI 产品演示、漂浮卡、技能标签；内容最密集 | 8,549 px |
| 2 | Agentic | 单一主产品 + 全宽视频收束 | 2,735 px |
| 3 | Online | Rive/Canvas 演示、应用卡、主题与渠道更新 | 5,806 px |
| 4 | Retail | 三段 165svh Sticky POS Hub 叙事 + 小卡/清单 | 8,196 px |
| 5 | Marketing | Product Network 主卡 + 营销小卡/清单 | 4,127 px |
| 6 | Checkout | 轻量卡片网格 + 更新清单 | 2,191 px |
| 7 | Operations | 运营/移动端/Apple Watch 卡片 + 清单 | 2,861 px |
| 8 | Shop app | Shop 店面与视频化购物卡片 + 清单 | 2,401 px |
| 9 | B2B | Collective、付款与供应链卡片 + 清单 | 2,888 px |
| 10 | Finance | Capital、Balance 产品卡 + 清单 | 2,403 px |
| 11 | Shipping | 退货标签与包裹设置卡片 + 清单 | 2,219 px |
| 12 | Developer | 浅色尾章；Agentic Commerce、开发平台、MCP 与扩展能力 | 8,376 px |

## 关键组件关系

### 导航与章节状态

- 固定 Header 和固定章节侧栏是两个独立导航系统。Header 管 Editions、搜索与站点级入口；侧栏只管理本页 12 个锚点。
- 一级章节以 `data-section-id`、`data-section-index` 和 `data-component-extra-section-handle` 建立章节身份。侧栏链接直接指向同名 hash。
- 内容块通过 `data-nav-theme="dark|light"` 与 `data-nav-style="solid"` 向滚动状态机声明导航颜色。运行时再把状态写到 `<html>` 的 `data-nav-theme`、`data-nav-bg`、`data-sidebar-theme`，Header 渐变与侧栏文字据此切换。
- Developer 是唯一在一级 section 上使用 `text-dark` 的尾章；前 11 章以 `text-light` 为章节基调，内部卡片可再次切换浅色内容面。

### 章节模板与产品卡

- 所有一级章共用“章节 Intro → 专题内容组 → 产品卡/媒体 → 更多更新列表 → 返回导航”的骨架。
- 产品实体以 `article[data-component-name="product"]` 为核心，可通过 `data-component-extra-handle`、标题 `card-heading-*`、CTA 和媒体容器串联。
- 布局层反复使用 `grid-template-with-gaps`、12 列网格和 `grid-cols-subgrid`；桌面正文宽 80%，专题为了做全出血效果会用 `100cqw` 和 `left:-20cqw` 暂时扩回全屏。
- 图片组件使用 `srcset`、`sizes`、固定 aspect-ratio、lazy loading 与 `object-fit: cover`；Rive 容器以静态海报作为加载/降级层。

### 动态媒体与弹层

- 页面有 5 个明确的视频弹层触发器：Sidekick 开场、Agentic Storefronts、Tinker、Shopify Product Network、Build with full MCP support。
- 触发器通过 `data-transition-id` 与全局 `video-modal` 对接，而不是每个卡片各自挂弹层。全局 modal 负责遮罩、关闭按钮、焦点与转场。
- 21 个 `data-viewable-component="true"` 节点用于在接近视口时启动 Rive/动态媒体；静态海报先存在，避免首屏等待运行时绘制。
- Retail 的三个重点 article 各有 `safe-min-h-165-svh` 外壳，内部内容 `sticky top-110`。外层提供滚动距离，内层固定一屏，从而形成连续三幕硬件叙事。

## 交互模型

1. 用户滚动 150svh Hero；Lenis 提供平滑滚动，滚动进度驱动 sticky Canvas/WebGL 舞台。
2. 进入 `#main-content` 后，侧边章节导航维持在左侧，右侧章节按文档顺序推进；章节 hash 只改变导航上下文，不替换页面。
3. 章节 Intro 和媒体在接近视口时 reveal；Rive、视频海报和 lazy image 分阶段启动。
4. 进入带 `data-nav-theme` 的内容面时，Header/侧栏根据深浅背景切换主题，并在需要时由透明态变为 solid 渐变态。
5. Retail 等超长产品段通过外层滚动距离 + 内层 sticky 形成 scrollytelling；Sidekick 的紧凑宽度卡组改用横向 scroll snap。
6. CTA 分为外链、应用/帮助/开发文档链接、内联 tooltip 链接和视频弹层按钮；hover 仅做颜色、边框或媒体响应。
7. 键盘路径包含 Skip to main content、章节链接、弹层关闭、章节末尾 “Back to navigation”；`prefers-reduced-motion` 分支由源页面样式和运行时负责。

## 响应式策略

### 已观察断点

| 断点前缀 | 最小宽度 | 主要用途 |
| --- | ---: | --- |
| `sm` | 300 px | 极窄屏基础修正 |
| `global-sm` | 375 px | Header 间距与小屏优化 |
| `sm-tablet` | 640 px | 两列小卡、50% 轮播卡宽 |
| `md` | 769 px | 12 列内容网格、较大纵向间距、桌面式媒体比例 |
| `global-lg` | 940 px | 固定 20/80 侧栏布局、全屏回拉、桌面导航与固定侧栏 |
| `lg` | 1,080 px | 更细的 12 列排版和 Sidekick 漂浮卡坐标 |
| `xl` | 1,280 px | 最大画布对齐与侧栏定位 |

最需要注意的是 `md` 从 769 px 开始，因此 768 px 研究视口仍走紧凑布局；只做“768 等于桌面平板”的常见假设会产生明显偏差。

### 三个基准视口

| 视口 | 文档高度 | 内容形态 |
| --- | ---: | --- |
| 1440 × 900 | 54,102 px | 固定 20% 侧栏 + 80% 正文；31 个提取节点；12 列布局与叠置/Sticky 叙事充分展开 |
| 768 × 1024 | 57,322 px | 12 px 左右 gutter，常见两列各约 366 px；仍低于 769 px 的 `md`；77 个提取节点 |
| 390 × 844 | 57,897 px | 366 px 内容列 + 两侧各 12 px；卡片大多单列，横向 snap 轮播保留；77 个提取节点 |

### 尺寸与性能策略

- Hero 使用 `svh`，Sticky 使用 `lvh`/`h-screen`，以降低移动浏览器地址栏伸缩造成的跳动。
- 内容段普遍使用 `contain-intrinsic-size-auto-screen`，减少超长页面首次布局成本；修改卡片高度时要同时验证滚动占位是否仍准确。
- 媒体通过 aspect-ratio 保持版式，配合 `srcset`/`sizes` 选择资源；小屏不是简单缩放桌面，而是重排、拆卡和轮播化。
- 章节外层 `overflow-clip` 配合全出血负偏移，能截断装饰和媒体，但也使任何横向尺寸误差更难被察觉。

## 技术栈与本地宿主

### 原站运行时

- Remix 应用，页面 HTML 内包含 `window.__remixContext`、序列化 loader 数据和路由 hydration 模块。
- Shopify Oxygen CDN 提供 manifest、entry、root、页面 route、Rive 等带 hash 的 JavaScript 模块。
- Tailwind 风格的编译后 utility CSS，包含项目自定义断点、容器单位、subgrid、动态属性选择器和 reduced-motion 分支。
- Lenis 平滑滚动；WebGL/Canvas Hero；Rive 帧序列；HTML video；inline SVG；响应式图片。
- 桌面运行态观测到 345 张图片、12 个 video 节点、124 个 inline SVG、366 个交互节点和 1 个 Canvas。
- 字体为 Inter Variable、Neue Montreal Bold、HW Cigars 和 Imperial Script；后三者构成主要品牌视觉。

### 当前克隆宿主

- Next.js 16.3、React 19、Tailwind CSS 4。
- `/` 由 `src/app/page.tsx` 重定向至 `/editions/winter2026`。
- `next.config.ts` 使用 `beforeFiles` rewrite，把该路径映射到 `public/sites/.../mirror-live.html`。
- 捕获文档作为顶层 browsing context 返回，因此只有一个原生滚动容器；wheel、touch、键盘、sticky、Canvas、媒体查询和无障碍焦点都在同一 document 内工作。
- 本地保存 135 个媒体/字体/CSS 资源，共 48,362,588 bytes；没有生成替代图片。
- 当前资产清单不包含 JavaScript bundle。`mirror-live.html` 仍从 Shopify Oxygen 加载带构建 hash 的 Remix/页面/Rive 模块，因此精确表现依赖网络和上游静态资源可用性。

## 潜在维护点

1. **远程 JavaScript 是最高风险依赖。** Oxygen 构建 hash、CORS、CSP、CDN 保留周期或模块内部接口发生变化，都可能让本地 HTML 无法 hydration；届时最先失效的通常是 Hero Canvas、Lenis、Rive、菜单和弹层。
2. **这是一份运行文档快照，不是可编辑组件源码。** 内容来自单行 HTML 和 Remix 序列化 loader 数据。改文案或增删卡片可能同时涉及可见 DOM、serialized data、ARIA 关系和运行时选择器，局部字符串替换很脆弱。
3. **滚动几何与内容高度强耦合。** Hero 150svh、Retail 165svh、sticky top 110、章节高度、负 margin 和 Canvas 时间轴共同决定动画节奏。任何字体、文案或媒体比例变化都要重新做全页滚动 QA。
4. **断点边界不常规。** `md=769`、`global-lg=940`、`lg=1080`；必须至少测试 390、640、768、769、939、940、1080、1440，而不能只测试常见的 375/768/1024。
5. **31 不是稳定的业务组件数。** 它是桌面提取器在特定视觉状态下得到的节点集合；紧凑视口为 77。自动测试应锚定 12 个 section ID、5 个视频触发器和关键 article ID，而不是断言节点总数恒为 31。
6. **Header 是状态机，不是静态固定条。** 必须分别验证首屏透明态、深色章节 solid 态、Developer 浅色态、菜单/搜索展开态和返回顶部；单张首屏截图不能覆盖这些状态。
7. **懒加载和动效会影响截图一致性。** 全页截图前的滚动会激活媒体并改变 Header 阶段；768 px 现有研究截图就记录了不同的状态性 Header。视觉基线应同时记录滚动位置和等待条件。
8. **顶层文档是行为保真的必要条件。** 改回 iframe 会重新引入嵌套滚动、wheel/touch 传递、sticky 参照系、焦点与全屏弹层边界问题。
9. **外链与站点路径仍属 Shopify 语境。** 帮助中心、Shop、Dev Docs、登录/试用和商品入口都会离开本地站点；若目标是离线演示，需要明确区分“保留真实跳转”和“拦截/替换链接”。
10. **无传统 footer。** 法律链接位于固定章节侧栏中；追加普通 footer 会改变 Developer 尾章高度与滚动收束，应先确认是否允许偏离原站。
11. **资源体积与格式值得持续监控。** 本地媒体约 48.4 MB，且部分 `.webp` 下载结果被识别为 PNG/JPEG。部署时应核查正确的 MIME、缓存头、Range 请求和视频首帧，避免本地可用但生产服务器播放失败。
12. **真正离线化需要第二阶段重构。** 最稳妥的演进路径是先冻结并本地化所有远程 JS/Rive 依赖；再按“全局舞台、章节框架、产品卡、媒体、弹层、导航状态机”拆出可维护组件，而不是直接从 31 个提取节点机械生成 31 个 React 组件。

## 建议的回归检查锚点

- 结构：`hero`、`main-content`、12 个一级 section ID 顺序不变。
- 几何：1440 宽 Hero 1,350 px、总高约 54,102 px；390 宽内容列 366 px、总高约 57,897 px。
- 状态：首屏、Sidekick、Retail Sticky 第三幕、Developer、页面末尾各取一组 Header/侧栏状态。
- 交互：Editions/Menu、章节 hash、Sidekick 横向轮播、20 个 skill tag、5 个视频触发器、3 个 modal、Skip link 与 Back to navigation。
- 运行：无横向溢出；wheel/touch/Page Up/Page Down/Home/End 均只控制一个顶层滚动文档；reduced-motion 和键盘焦点不退化。

