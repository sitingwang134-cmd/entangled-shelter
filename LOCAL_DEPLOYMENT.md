# Entangled Shelter — 本地运行

NAS 新版已部署：**http://192.168.31.214:3090/**。发布、备份及检查记录见 [NAS_DEPLOYMENT.md](docs/entangled-shelter/NAS_DEPLOYMENT.md)。公网 Tunnel 映射尚未调整。

主站已重建为独立的 Next.js / React 应用，使用提供的九张原画及真实深度图：

- 主站：`http://127.0.0.1:3000/`
- 保留的 Shopify 原页面参考：`http://127.0.0.1:3000/editions/winter2026`
- 两条路由互不混用。主站的图片、字体、脚本和深度素材全部本地加载。

## 2026-09-08 最新动效策略：始终完整动效

本次更新覆盖此前的系统跟随和站内开关策略：**页面不再显示“减少动效”开关，始终使用完整动效，不根据操作系统的 `prefers-reduced-motion` 自动关闭动画**。网站不会修改 Windows、浏览器或其他网站的设置。

- 旧的 `entangled-shelter:motion:v1` 即使保存了 `reduced` 也不再影响动效；不删除或改写用户的旧存储，选择历史仍独立保留。
- `site-motion.ts` 提供统一的完整动效策略，GSAP、Lenis、ChoiceLab 翻牌、DepthScene 和组件 CSS 使用相同模式。GPU/素材故障时的海报降级仍保留，不代表完整动效被关闭。
- 图片镜头幅度加大：鼠标横/纵向系数由 `0.026 / 0.018` 调为 `0.042 / 0.030`；自动漂移由 `0.0022 / 0.0015` 调为 `0.010 / 0.007`，时间系数由 `0.23 / 0.19` 调为 `0.36 / 0.29`；滚动横/纵向系数由 `0.008 / 0.025` 调为 `0.012 / 0.038`。基础镜头放大由 `1.055` 调为 `1.085`，为更大位移预留边缘余量。上述数值仍会乘以每幅画的独立强度。

**验证版本边界：**历史页面、深度、交互、录屏和性能报告不自动代表此次幅度调整及移除开关后的版本通过。本轮构建、完整动效与旧 `reduced` 存储兼容性、画面边缘及交互回归，均须以本轮实际验证记录为准。

## 生产模式

在 `C:\Users\admin\Documents\codex 2\shopify-winter-2026-clone` 中运行：

```powershell
npm install
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

## 开发模式

```powershell
npm run dev -- --hostname 127.0.0.1 --port 3000
```

修改代码后，生产模式需要重新运行 `npm run build` 并重启 `npm run start`；开发模式会自动刷新。不要让两种模式占用同一个端口。

## 内容与动效

- `src/components/entangled/EntangledShelter.tsx`：首屏、三大章节、固定导航、GSAP 时间轴和 Lenis 滚动。
- `choice-data.ts`：美食、穿搭、旅行候选与纯游戏规则。
- `ChoiceLab.tsx`：筛选/自定义候选、押注、翻牌/猜拳、成功确认、本地历史。
- `site-motion.ts`：统一完整动效策略；不再提供站内开关或读取旧减少动效偏好。
- `DepthScene.tsx`：图片＋真实深度图的实时 WebGL 视差、鼠标/自动/滚动镜头和故障海报降级。
- `public/entangled/`：九张 WebP、九张近白深度 PNG、九条 DepthFlow MP4。
- 结构解析：`docs/entangled-shelter/STRUCTURE_AND_ACCEPTANCE.zh-CN.md`。
- 素材重处理：`docs/entangled-shelter/MEDIA_PIPELINE.md`。

选择历史只保存在当前浏览器的 localStorage，没有账号和服务端数据库。换浏览器不会同步。

参考镜像仍保留 Shopify 外链及远程运行时；这仅是参考路由的限制，不影响独立 Entangled Shelter 主站。

## 验证命令

```powershell
npm run check
node scripts/qa-choice-logic.mjs
node scripts/qa-choice-browser.mjs
node scripts/qa-depth-scenes.mjs
node scripts/qa-entangled-page.mjs
node scripts/qa-motion-performance.mjs
```

浏览器验收脚本默认访问本机 3000 端口，因此需要先启动生产服务。测试使用此机器现有 Edge 与 Codex 内置 Playwright，换机器时应调整脚本中的运行时路径。

验收新策略时，应分别检查：页面不显示动效开关；操作系统报告减少动画时仍为完整动效；旧 localStorage 值为 `reduced`、无值、无效值或存储不可用时均保持完整动效；刷新不会恢复旧的减少动效模式；更大的鼠标、自动及滚动镜头正常工作且不露出画面边缘。报告须绑定实际运行的新构建，不能沿用历史帧率数值作为本轮性能结论。
