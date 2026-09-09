# 选择室 V3：60 个候选与油画游戏室

## 本轮范围

在现有 Next.js / React / GSAP 网站中改造选择器，主页布局与完整动效策略不变。

- 美食、穿搭、旅行各 20 项，共 60 项；每类 4 个分组、每组 5 项。
- 默认展示 10 项，“换一批”切换另一组 10 项，两批无重复且覆盖全部 20 项。
- 分组筛选只展示匹配项；不足 10 项时展示实际数量，换批按钮禁用。
- 换批保留所有已选候选；新增可直接移除单项、清空的已选清单。
- 自定义候选添加后切到“我的候选”，默认选中；保留最多 8 个、自定义名称最多 36 字和重名拦截。
- 游戏继续只从已选候选中进行，不自动将未选项加入游戏。

## 美术与交互

方向：主页的古典油画、奶油纸色、深灰绿色、衬线标题和细线几何延续到全屏选择室。

- 左侧复用每个章节的原油画背景，加入缓慢镜头漂移与几何轨道。
- 15 张从 Unsplash 下载的免费照片作为候选的氛围配图，每类 5 张复用；它们不是 60 张一一对应的菜品、商品或目的地实拍。界面已明确注明“图片为氛围参考，以文字描述为准”。
- 照片保存在 `public/entangled/choices/`，WebP 格式，宽 800px，无运行时第三方图片请求；`sources.json` 记录原始链接、授权链接、尺寸、文件大小与 SHA-256。排除 Unsplash+ 图片。
- 游戏牌背使用原手掌油画和几何雕刻纹样；牌桌使用天使油画、纸金色边框。
- 石头、剪刀、布改为同一套原创线刻 SVG 手势，不依赖操作系统 emoji 外观。
- 换批逐张发牌、候选勾选轻弹、悬停照片推进、洗牌展开、轻触牌背揭晓、胜利散花、确认盖章。
- 依旧支持键盘按钮、焦点约束、关闭后恢复主页，抽取期间阻止重复触发和切换。
- UUID 增加 `getRandomValues` 回退，兼容 NAS 的非 HTTPS 局域网地址。

## 主要文件

- `src/components/entangled/choice-data.ts`：60 项文案、图片引用、换批纯函数、随机游戏规则与 UUID。
- `src/components/entangled/ChoiceLab.tsx`：三步流程、换批与已选清单、图片和动效。
- `src/components/entangled/ChoiceLab.module.css`：全屏油画选择室、游戏美术、响应式与 CSS 动效。
- `src/components/entangled/ChoiceArtwork.tsx`：几何轨道与三个手势 SVG。
- `scripts/media/download-choice-assets.mjs`：可复现图片下载与来源清单。

## 代码验证

- `npm run lint`：代码规范。
- `npm run typecheck`：TypeScript。
- `node scripts/qa-choice-logic.mjs`：672 条断言，包含 60 项数据、换批覆盖/循环/筛选、自定义尾批、跨批候选、52 张扑克、9 种猜拳组合、胜负保护、历史记录、HTTP UUID 回退。
- `node scripts/qa-choice-render.mjs`：不启动浏览器，直接进行服务端组件渲染；检查三类各渲染 10 张图片卡、换批按钮、已选清单、完整动效标记；同时检查 CSS 引用、15 张图片解码和哈希。
- `npm run build:static`：生产静态构建。
- `scripts/qa-choice-browser.mjs`：已同步换批和自定义筛选的新流程，但本轮不执行。

视觉、真实浏览器交互观感、移动端实际排版与帧率由用户人工验收；本轮不声称这些已通过。

素材授权参考：https://unsplash.com/license
