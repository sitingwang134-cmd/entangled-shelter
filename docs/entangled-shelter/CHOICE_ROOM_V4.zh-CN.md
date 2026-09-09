# Choice Room V4 — 2026-09-08

## 本次修改

- 美食、穿搭、旅行各 20 个选项，60 张独立生成配图。每张以该选项的名称、食材 / 衣物 / 活动描述生成，不再复用 15 张氛围照片。图片按 option.id 一对一绑定，单批 10 项，换批保留已选项。
- Imagegen 内置生成模式：暖象牙白、橄榄绿阴影、赭金日光、自然笔触的编辑插画方向。独立原图保存在 `assets/generated-v4/`；逐张提示词和生成记录在 `docs/entangled-shelter/generated-v4/`。生成图片属于创作插画，不是实际商品、店铺或旅行目的地的实拍证明。
- 网页图片为 800 × 800 WebP，60 张共 9,929,650 字节；清单与 SHA-256 位于 `public/entangled/choices-v4/sources.json`。默认生成目录中的原始输出也保留。自定义选项没有配图时显示文字标记，不再塞入不相关的主页图片。
- UI Design 指导下，选择器从侧栏大画廊改为紧凑的纸感插画目录：上方章节介绍、下方整幅图片网格、细线筛选、换批按钮、已选清单、底部操作栏。保留主页字体、橄榄绿与纸张色。
- 扑克为深绿牌桌 + 红黑选择 + 立体洗牌翻牌；猜拳为双人对战台 + 三种手势 + 3/2/1 倒数出拳；先猜后抽为封蜡信封阵列 + 巡游光标 + 开信结果。三者是不同组件和布局，不只是换文字。
- GSAP React / Timeline 用于分开管理三种动画。抽签动画只展示已确定的随机结果，末帧索引与结果一致；忙碌时锁定操作，揭晓完成后才允许确认。

## 代码结构

- `src/components/entangled/choice-data.ts`：60 项内容、分类与分批、随机玩法、抽签序列、历史记录。
- `src/components/entangled/ChoiceLab.tsx`：候选选择、游戏状态机、动画调度、确认流程。
- `src/components/entangled/ChoiceGames.tsx`：扑克 / 猜拳 / 信封抽签三套独立 UI。
- `src/components/entangled/ChoiceRoomV4.module.css`：新版选择器与独立游戏样式。旧 ChoiceLab.module.css 不再被该页面导入。
- `scripts/media/prepare-choice-v4.mjs`：原图归档、WebP 优化、图片清单生成。

## 验证边界

通过 lint、TypeScript、Next.js 16.3.0 静态生产构建；672 项基础逻辑断言；1292+ 项抽签序列与独立游戏 SSR 状态检查；三分类初始页面 SSR 各 10 项；60 张 WebP 解码、路径绑定、唯一哈希校验。

本轮没有运行浏览器、截图或网页视觉验收。旧 `qa-choice-browser.mjs` 与 choice-qa 图片是历史检查资料，不能代表 V4 验收。最终网页视觉、动效观感与实际操作由用户人工验收。

部署仍使用既有 NAS 的 3090 端口，不迁移到 Sites，不更改 Cloudflare 域名路由。部署详情见 NAS_DEPLOYMENT.md。
