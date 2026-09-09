# Entangled Shelter：结构、修改入口与验收说明

## 2026-09-08 最新变更：加大幅度，移除动效开关

本条覆盖本文此前关于“站内动效开关”、偏好保存及减少动效模式的说明：**当前页面不显示动效开关，始终使用完整动效**。系统的 `prefers-reduced-motion` 和旧 `entangled-shelter:motion:v1` 中的 `reduced` 均不再关闭本站动画；不删除用户旧存储，不修改操作系统、浏览器或其他网站设置。GPU/素材故障时仍允许海报降级，选择历史的存储方式不变。

本轮同时增强图片的鼠标、自动漂移和滚动镜头幅度，并提高基础放大比例，为位移预留边缘余量。具体参数与启动方式见 [LOCAL_DEPLOYMENT.md](../../LOCAL_DEPLOYMENT.md)。下文早期策略、截图、性能数值和 QA 报告保留其历史版本范围，**不能据此声称本次幅度调整和开关移除已经验证通过**；以本轮实际构建及回归记录为准。

## 1. 当前实现是什么

这是一个以“帮助选择困难症做决定”为主题的本地 Next.js 网站。页面总标题是 **Entangled Shelter**，美食、穿搭、旅行三个章节各自打开选择实验室，用户先整理候选，再参与小游戏，成功后才可确认答案。

当前根路径 `/` 已直接渲染可编辑的 React 组件，不再跳转到 Shopify 镜像。`/editions/winter2026` 仍保留原镜像作为参考入口；它和新站是两套不同的实现，不能把镜像的运行或旧截图当作新站验收证据。

本说明已按 2026-09-08 的动效策略更新源码说明；已落盘的 8 视口、三种玩法、冷缓存本地运行、WebGL 场景/降级和 10 段独立性能采样属于 **2026-09-07 基线**。基线桌面/手机截图与滚动录像已目视复核，但不能代替本轮新策略的构建和验收。**这是按参考站动效语言重建的定制网站，不是原站完整 3D/Rive 场景逐帧相同的复制品**。具体证据和版本范围见第 8 节。

### 2026-09-08 更正：默认完整动效，由站内开关控制

本次要求覆盖旧的“自动跟随操作系统减少动画”策略。站点默认 `full`，不再读取 OS 的 `prefers-reduced-motion` 决定是否开启动效；也不修改系统、浏览器或其他网站的偏好。页面右下角按钮显示“动效已开启 / 开启动效”，可主动切换本站的 `full` / `reduced`。

[site-motion.ts](../../src/components/entangled/site-motion.ts) 使用 `useSyncExternalStore` 提供唯一共享状态。`entangled-shelter:motion:v1` 保存到当前浏览器 localStorage，仅明确保存 `reduced` 才减少动效；无设置、无效值或读取失败均默认完整动效。写入失败仍通过内存状态让本次切换生效，不承诺刷新后保存。所有动效消费者统一读取此状态，详见第 5 节；本轮最终验证和新构建 ID 待主验收补充。

## 2. 页面和文件层级

```text
src/app/page.tsx                         根路径入口
└─ EntangledShelter                     页面编排、导航状态、滚动动效
   ├─ 固定 Header / 进度线 / 移动菜单 / 站内动效开关
   ├─ 桌面固定章节侧栏
   ├─ #top                             站台主视觉 + 总标题 + 扑克
   ├─ #intro                           浅色理念介绍
   ├─ #chapters
   │  ├─ #food / Taste                  美食场景 + 内容卡 + 选择入口
   │  ├─ #style / Style                 穿搭场景 + 内容卡 + 选择入口
   │  └─ #travel / Wander               旅行场景 + 内容卡 + 选择入口
   ├─ #ritual                          三种玩法说明 + 天使画作
   ├─ #ending                          手掌画作 + 三个选择入口 + Footer
   ├─ Art → DepthScene                 每幅画的海报 + WebGL 深度视差
   └─ ChoiceLab                        按当前分类挂载的原生 dialog
      ├─ options                       分组筛选 / 多选 / 自定义候选
      ├─ play                          押候选 / 选择玩法 / 揭晓结果
      └─ accepted                      确认票据 / 最近已确认的选择
```

| 文件 | 真正负责什么 |
| --- | --- |
| [page.tsx](../../src/app/page.tsx) | `/` 显示 `EntangledShelter` |
| [layout.tsx](../../src/app/layout.tsx) | 浏览器标题、中文描述、`lang=zh-CN`、本地字体 |
| [EntangledShelter.tsx](../../src/components/entangled/EntangledShelter.tsx) | `chapters` 展示配置、页面结构、入口、Lenis、GSAP/ScrollTrigger |
| [EntangledShelter.module.css](../../src/components/entangled/EntangledShelter.module.css) | 主站布局、字体尺度、sticky 场景、深浅主题和响应式 |
| [site-motion.ts](../../src/components/entangled/site-motion.ts) | 默认完整动效、站内切换、localStorage / 内存偏好、统一订阅与跨标签同步 |
| [choice-data.ts](../../src/components/entangled/choice-data.ts) | 24 个预设、分类、游戏规则、随机抽取、胜负判断、确认保护、历史数据校验 |
| [ChoiceLab.tsx](../../src/components/entangled/ChoiceLab.tsx) | 候选到确认的状态流、翻牌时机、弹层焦点、滚动锁、浏览器保存 |
| [ChoiceLab.module.css](../../src/components/entangled/ChoiceLab.module.css) | 选择实验室、牌桌、3D 牌面、确认票据、小屏布局 |
| [DepthScene.tsx](../../src/components/entangled/DepthScene.tsx) | 原图/深度加载、WebGL 着色器、镜头输入、GPU 资源池、降级和释放 |
| [DepthScene.module.css](../../src/components/entangled/DepthScene.module.css) | 原图与 Canvas 叠层、就绪后显示、站内 `data-motion` 减少动效样式 |
| [next.config.ts](../../next.config.ts) | 本地开发域名与原 Shopify 参考路径 rewrite |

## 3. 具体选项与三种玩法

三个分类各有 4 个分组、8 个具体预设，总计 24 个。展示章节的 `labels` 是引导文案，真正的候选数据在 `choiceCategories`；不能只改引导标签就认为改了抽取池。

| 分类 | 分组及实际预设 |
| --- | --- |
| 美食 `food` | 热气腾腾：沸腾火锅、热汤拉面；轻盈一点：地中海沙拉、一盘寿司；好好约会：意式烛光、街角小馆；深夜快乐：罪恶汉堡、烟火烧烤 |
| 穿搭 `style` | 松弛通勤：黑白极简、柔软中性色；复古角色：美式复古、旧电影主角；出门约会：法式浪漫、午夜丝绒；城市漫游：户外机能、周末运动 |
| 旅行 `travel` | 自然充电：山野徒步、海边发呆；慢慢生活：古镇慢行、乡间小住；城市灵感：城市漫游、美术馆一日；一点冒险：星空露营、短途火车 |

打开实验室默认选中前 4 个候选；用户可取消或追加，至少保留两个不同候选才能进入发牌。自定义候选限制为本次实验室最多 8 个、名称最多 36 字符；空名称和重名会提示错误。关闭后再打开会重建候选状态，**当前没有保存整套自定义候选池的功能**。

共同数据流：

```text
整理至少 2 个候选 → 先押一个候选 → 完成该玩法的预测 → 发牌/出拳
                                                       ↓
                                            playRound 生成本局结果
                                                       ↓
                                      GSAP 翻转到侧面时再显示牌面
                                                       ↓
                           失败/平局：只能重来   成功：出现“就选……”按钮
                                                       ↓
                                     用户确认 → createDecision → 票据
                                                       ↓
                          localStorage 成功则保存；失败仍可保留当次答案
```

| 玩法 | 先做什么 | 随机揭晓什么 | 什么情况下才能确认 |
| --- | --- | --- | --- |
| 命运扑克 `poker` | 押一个候选，再猜红或黑 | 每局从 52 张牌独立随机抽一张，显示点数/花色 | 牌色猜对，确认的是用户预先押的候选；这不是无放回的持久牌堆 |
| 剪刀石头布 `rps` | 押一个候选，再选择手势 | 系统随机出石头、剪刀或布 | 按标准相克规则获胜；平局和失败都不能确认 |
| 先猜后抽 `guess` | 先猜候选池中的一个 | 从整个当前候选池随机抽取一个 | 抽中候选的 ID 与预猜 ID 一致 |

保护不是只有按钮隐藏：`playRound` 验证候选池和预测，`ChoiceLab.accept` 验证揭晓完成及胜利状态，`createDecision` 再拒绝非胜利结果。`busyRef` 阻止揭晓过程中重复发牌，`acceptedRef` 阻止重复确认。随机源来自 Web Crypto，逻辑测试可注入确定性随机数覆盖胜/负/平局。

已确认选择使用 `entangled-shelter:decisions:v1` 存在当前浏览器的 `localStorage`，最多保留 24 条；确认页显示之前最近 3 条。没有账号、后台数据库或跨设备同步。保存不可用时，界面会明确提示未保存，不把失败保存说成成功。

## 4. 九张图片如何接入

所有画面来自用户给的 `C:\Users\admin\Desktop\11`，没有用 Shopify 的主体图片替换用户素材，也没有生成新的替代画作。原图保持不动。

| 素材 ID | 源文件开头 | 当前页面位置 |
| --- | --- | --- |
| `station` | `c6ba27b9…` | 首屏主视觉 |
| `room` | `ab42ed12…` | 美食章节主背景 |
| `doorway` | `22e23f76…` | 美食故事卡 |
| `levitate` | `b9bfda19…` | 穿搭章节主背景 |
| `atelier` | `dfd9a2a0…` | 穿搭故事卡 |
| `salt` | `ca5d5214…` | 旅行章节主背景 |
| `car` | `ff20746e…` | 旅行故事卡 |
| `angels` | `c72c1359…` | 玩法章节后的画作插段 |
| `hands` | `d0f7e775…` | 尾屏画作 |

处理链路为：原图 → WebP；原图 → 官方 DepthFlow 的 DepthAnything V2 Small 估计器 → 近白远黑深度图；原图 + 真实深度 → DepthFlow 离屏渲染 MP4。

- 网页实时层读取 `/entangled/{id}.webp` 和 `/entangled/{id}-depth.png`，每对图片保持相同原始尺寸/比例。
- 当前 `Art` 组件没有播放 MP4；9 个 `/entangled/{id}.mp4` 是已实际完成的 DepthFlow 动态资产和效果对照，不应误写成“网页靠循环视频实现鼠标交互”。
- DepthFlow/模型在制作阶段运行，浏览网页不需要 Python、模型权重、FFmpeg 或本机安装 DepthFlow。
- 这是 2.5D 深度视差，不能补出被遮挡的完整背面，也不会独立驱动手脚、发丝、衣服或纸张。细边和层叠物体采用克制的镜头幅度。

素材制作与验证详见 [MEDIA_PIPELINE.md](MEDIA_PIPELINE.md)；实际文件哈希、模型/运行库版本、尺寸、灰度统计和视频元数据以 [media-manifest.json](../../public/entangled/media-manifest.json) 为证据。9 张 WebP + 9 张深度图约 2.22 MB；9 个视频合计约 8.37 MB。

## 5. 动效系统如何分工

三层职责分离：**Lenis 处理滚动手感，GSAP 处理页面元素的编排，DepthScene 处理画作内部的空间位移**。

三层及翻牌、CSS 共用一条控制链：站内开关 → `setSiteMotion` → `useSiteMotion` 订阅 → GSAP / Lenis / ChoiceLab / DepthScene；对应元素通过 `data-motion` 选择样式。默认 `full` 启用完整效果，只有站内选择 `reduced` 才进入减少动效模式，不再以系统媒体查询作为动效开关。

| 层 | 源码中的实际机制 |
| --- | --- |
| 滚动输入 | Lenis `duration: 1.05`、平滑鼠标滚轮；加入 GSAP ticker，滚动事件更新 ScrollTrigger；菜单/实验室打开时暂停 Lenis |
| 首次入场 | Header 位移淡入、两行总标题依次升起、说明与三张扑克分批进入 |
| 首屏叙事 | 外层桌面 `185svh` / 手机 `155svh`，内层 `100svh` sticky；滚动使画面放大、标题退场、扑克发散、线框旋转 |
| 章节叙事 | `100svh` sticky 背景；图片缩放/纵移，巨型标题反向位移，遮罩与线框同步变化；进入章节时裁切从留边扩展至满屏 |
| 内容层 | `data-reveal` 元素滚入/返回时反向播放；`data-tilt` 卡片在精细指针设备随指针倾斜；玩法卡组有滚动错峰运动 |
| 导航状态 | ScrollTrigger 将当前章节写入 `data-active-section`，根据 `data-theme` 切换 Header/侧栏深浅主题；锚点承担章节跳转 |
| 画内视差 | WebGL 使用原图 + 深度图进行射线步进和交点细化，融合鼠标、章节滚动进度与微弱自动漂移，缓动镜头偏移 |
| 翻牌 | ChoiceLab 单独用 GSAP 时间轴完成轻摆 → 侧面 → 揭晓 → 正面；站内选择减少动效时直接揭晓 |

DepthScene 的代码级性能策略：所有场景共享一个 RAF 调度器，最多 3 个场景持有 GPU 上下文；根据 IntersectionObserver 可见性调度和释放；纹理层以 60 Hz 为上限；桌面目标像素预算 150 万、粗指针设备 72 万、DPR 上限 1.5，并可在持续慢帧后降低分辨率。9 月 7 日的独立组件压力测试已验证 9 个可见场景仅占用 3 个 GPU 槽位，卸载后 Canvas 和后续 RAF 均为 0；本轮切换后的资源释放/恢复需单独验证。

9 月 7 日基线 [性能报告](../design-references/entangled-shelter/motion-qa/PERFORMANCE.md) 覆盖桌面 1440×900、手机模拟视口 390×844 各 5 段：首屏静止、鼠标/轻微漂移、章节滚动、多画面和跨章切换。该旧构建在此机 RTX 3070 / Edge 下，足量样本的实际 WebGL 绘制调用均值约 59.89–60.95 Hz，p95 间隔不超过 18.4 ms，无长任务、运行异常或低于报告阈值的样本。**这测量的是绘制提交节奏，不是 GPU 完成时间或显示器实际呈现帧率，也不是实体手机性能保证；更不能直接当作 9 月 8 日新构建的测量结果**。基线桌面滚轮路径中首屏仍继续占用一个槽位，实际峰值为 3；不把单次深度扫描的 2 槽峰值推广为所有路径的上限。

章节外壳 `.chapter` 已加入 `overflow: clip`，把前一章的 sticky 背景限制在本章边界内，避免其越界绘制并叠加后续场景的开销。这里不使用会建立滚动容器的 `overflow: hidden/auto`，因此保留页面级 sticky 和单一文档滚动关系。9 月 7 日完成该优化后的页面 8 视口和桌面/手机 9 深度场景验证，基线整页扫描的 Canvas 峰值为 2。

图片始终保留为带 `alt` 的真实 `img`。Canvas 准备完成才显示；深度缺失、GPU 不可用或上下文丢失时回到海报，并有有限重试。**只有站内选择减少动效**才停用 Lenis 平滑滚动、主要 GSAP 时间轴和 WebGL 增强，使用静态图片及直接揭晓；重新开启动效则由共享状态通知各层重建。历史 [整页深度测试](../design-references/entangled-shelter/depth-qa/results.json) 和 [组件测试](../design-references/entangled-shelter/depth-qa/component-results.json) 验证了 9 月 7 日的上下文丢失/恢复、海报降级和旧减少动画策略，不证明本轮站内切换已通过浏览器验收。

## 6. 响应式与本地运行边界

主站在 940 px 及以上保留约 20% 侧栏 / 80% 正文；939 px 及以下去掉侧栏，正文铺满；640 px 及以下切换移动菜单、单列卡片和较短 Hero 滚动区。选择实验室另有 1050 / 760 / 440 px 布局调整，760 px 以下铺满视口，440 px 以下牌桌转为上下排列。粗指针设备扩大部分按钮点击高度。

弹层使用原生 `dialog.showModal()`，设有关闭按钮、Escape、Tab 焦点限制、关闭后返回触发元素及页面滚动恢复。这些路径已在 9 月 7 日的 1440×900 和 390×844 [选择实验室浏览器测试](../design-references/entangled-shelter/choice-qa/results.json) 中通过；375×812 另测旧减少动画策略和不可用存储的组合。本轮站内切换与弹层的组合验证待补充。

新站根路径使用本地图片、本地字体、本地打包的 React/GSAP/Lenis，选择逻辑、历史与动效偏好保存均在浏览器中完成。它不调用 Shopify 服务，也不依赖 Shopify 镜像的运行时。**9 月 7 日基线已验证冷缓存且阻断全部外部网络的运行**：1440×900、390×844 完成三类/三玩法流程，375×812 完成旧减少动画策略与存储失败降级；三组 `externalRequested` 均为空，本地请求数分别为 50、49、17。保留的 Shopify 参考路由仍可能访问 Shopify 远程资源，不能拿它代表新站的离线能力。

本地命令见 [package.json](../../package.json)：`npm run dev` 用于开发；`npm run check` 执行 lint、类型检查、构建；生产构建后用 `npm run start -- --hostname 127.0.0.1 --port 3000`。**以下仅为 9 月 7 日构建事实：**`npm run check` 返回 exit 0，收尾 lint 和类型检查也均返回 0；[验证记录](VALIDATION_RECORD.md) 记录当时实际结果，未补造原始 stdout。旧构建 ID `pIYMCoqBfkynAsKpPLVZH` 与当时性能报告的 6 个源文件哈希一致，基线根路径和图标 HTTP 检查均为 200。9 月 8 日修改后必须使用新构建与重启后的服务验收，本轮构建 ID、命令结果和 HTTP 验证由主验收补充，不能沿用旧记录。

## 7. 与 Shopify 参考页的对应关系

原结构分析见 [Shopify STRUCTURE_ANALYSIS.zh-CN.md](../research/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c/STRUCTURE_ANALYSIS.zh-CN.md)。该文档中“当前克隆宿主”的描述是旧镜像阶段事实，不适用于现在的根路径。

| 原页设计机制 | 新站对应实现 | 必须诚实区分的边界 |
| --- | --- | --- |
| 全屏画作/舞台 + 长滚动时间轴 | sticky Hero、三章 sticky 背景、独立 WebGL 深度场景 | 新站是用户图片的 2.5D，不是原站完整 3D/Rive 场景的逐项搬运 |
| 巨型章节字、线框叠层、媒体卡错落 | Taste / Style / Wander 大标题、Geometry、故事卡/选择卡 | 内容和章节数按用户主题大改，不追求 12 个 Shopify 产品章的内容一致 |
| 桌面固定章节侧栏、深浅导航变化 | 20/80 布局、当前章节高亮、light/dark 主题 | 已对照同为 1440 px 的原站章节截图和新站截图，并复核新站连续滚动录像；布局语言对应，素材与内容有意不同 |
| 平滑滚动、滚入媒体、全局弹层 | Lenis、ScrollTrigger、可见场景调度、ChoiceLab | 不能用依赖安装成功或代码中出现 `gsap` 代替交互验收 |

因此当前准确定位是“借鉴参考页叙事和动效语言、使用用户图片重建的定制网站”。9 月 7 日基线已实现并验收全屏画作、巨型标题、固定章节导航、滚动镜头、错落媒体卡与实体翻牌等核心体验；基线视觉复核未发现整屏黑帧、缺图或跨断点溢出。9 月 8 日的默认策略更改仍需本轮验证。原始 3D/Rive 的独立物体动画不在 2.5D 单图视差的能力范围内，不宣称逐像素或逐帧一致。

## 8. 验收矩阵与证据

状态口径：本节列表和矩阵的 **已通过均指 2026-09-07 基线**，对应当时实际 JSON、媒体或命令运行证据，不是 9 月 8 日动效策略更改后的验收结论。基线最终 `overflow: clip` 版本完成统一 8 视口重跑，覆盖早先 6 视口结果；640/939 旧边界报告作为过程证据保留，不重复计数。

9 月 8 日新增验收范围：系统报告减少动画而本站未设置时仍为 `full`；站内切换 `reduced` / `full` 后 GSAP、Lenis、WebGL、翻牌和 CSS 同步；刷新保存、存储失败的本次有效行为；对应资源释放和恢复。本轮最终结果及新构建 ID 待主验收补充。仅设置 OS 媒体特征的旧测试不覆盖这些新要求。

9 月 7 日已读取并归档的证据快照：

- [最终页面报告](../design-references/entangled-shelter/page-qa/results.json)：`2026-09-07T15:26:59.262Z`，`http://127.0.0.1:3000`，1440、390、640、768、939、940、1920、360 px 八组；各组 6 个章节状态正确、9 张本地图全部加载、无横向溢出、外部请求/资源失败/运行异常均为 0，滚动动画检查通过。
- [早先断点报告](../design-references/entangled-shelter/page-qa/breakpoint-results.json)：`2026-09-07T15:16:47.878Z`，相同 URL，640、939 px 两组；其检查已被最终 8 视口报告重新覆盖。
- [选择实验室报告](../design-references/entangled-shelter/choice-qa/results.json)：1440×900、390×844 完整交互，加 375×812 特殊降级；全部冷缓存、外部网络阻断。
- [最终深度整页报告](../design-references/entangled-shelter/depth-qa/results.json)：`2026-09-07T15:25:03.239Z`，本地 3000 端口，`passed: true`、`errors: []`；桌面和手机各扫过 9 张实际画面，均为已就绪 WebGL，Canvas 峰值 2。
- [深度组件报告](../design-references/entangled-shelter/depth-qa/component-results.json)：`2026-09-07T15:01:26.223Z`，独立 3011 端口夹具，`passed: true`，覆盖 3 槽位压力和卸载资源释放。
- 9 月 7 日实际重跑 `node scripts/qa-choice-logic.mjs`：**336 条断言通过**；只读重算 9 个源文件 SHA-256，与素材 manifest 的原始哈希 **9/9 一致**。本轮文档更新未重复运行这些命令。
- [最终滚动录屏结果](../design-references/entangled-shelter/motion-qa/video-results.json)：`2026-09-07T15:26:01.886Z`，1440×900、25.88 秒，`blackEvents: []`、`errors: []`。视频已独立于性能采样重录；25 fps 是录制帧率，不能用来代表网页实时帧率。
- [最终性能数据](../design-references/entangled-shelter/motion-qa/performance-results.json)：`2026-09-07T15:39:02.431Z`，10 段采样、无运行异常、无低于设定阈值的样本、无软件渲染器；附构建 ID、源码哈希、真实 GPU 信息和原始时间戳。桌面有效采样和手机复测分别完成后汇总，未把失败的测试导航当成有效样本。
- [构建与交付验证记录](VALIDATION_RECORD.md)：生产构建、最终 lint / 类型检查、本地服务与素材校验。

| 用户要求 / 风险 | 9 月 7 日基线状态 | 可复核的历史证据（不代表本轮新构建） |
| --- | --- | --- |
| 标题 Entangled Shelter，三个分类入口 | **已通过** | [页面报告](../design-references/entangled-shelter/page-qa/results.json) 配合 [qa-entangled-page.mjs](../../scripts/qa-entangled-page.mjs) 的 title/H1 断言；三分类真实入口见 [Choice 报告](../design-references/entangled-shelter/choice-qa/results.json) |
| 各分类可进入并选具体样式 | **已通过** | [Choice 报告](../design-references/entangled-shelter/choice-qa/results.json)：三分类、候选、多选、自定义、重复名称、至少两个候选均经过真实按钮流程；预设结构另由 336 条逻辑断言覆盖 |
| 三玩法先猜后揭晓、失败/平局不能确认 | **已通过** | [qa-choice-logic.mjs](../../scripts/qa-choice-logic.mjs) 实跑 336 条断言，含 52 张牌×2 预测和 9 种出拳组合；[浏览器结果](../design-references/entangled-shelter/choice-qa/results.json) 覆盖胜/负/平局保护及实际翻牌后确认 |
| 原始 9 图处理并使用真实 DepthFlow | **已通过** | 原始 SHA-256 9/9 一致；[manifest](../../public/entangled/media-manifest.json)、[视频 QA](../../public/entangled/qa/video-qa.json) 证明真实处理；[页面](../design-references/entangled-shelter/page-qa/results.json) 和 [深度报告](../design-references/entangled-shelter/depth-qa/results.json) 验证 9 个接入场景全部加载/渲染 |
| 鼠标/滚动确实改变画内景深 | **最终 clip 版本已通过** | [整页深度报告](../design-references/entangled-shelter/depth-qa/results.json)：实际 WebGL 帧增加、桌面指针偏移变化、桌面/手机章节滚动进度变化、9 场景扫描，Canvas 峰值 2 |
| 参考站同类滚动编排与视觉质感 | **核心体验已完成并复核** | 已对照原站章节布局，检查 [滚动阶段总览](../design-references/entangled-shelter/motion-qa/motion-contact-sheet.jpg)、桌面/手机截图；[录屏](../design-references/entangled-shelter/motion-qa/video-results.json) 黑屏检测 0 / 运行异常 0；[10 段性能结果](../design-references/entangled-shelter/motion-qa/PERFORMANCE.md) 均在采样容差内。保留 2.5D 与原始 3D/Rive 的明确区别 |
| 手机/平板/桌面无溢出、可操作 | **最终统一 8 视口已通过** | [最终页面报告](../design-references/entangled-shelter/page-qa/results.json) 覆盖 360、390、640、768、939、940、1440、1920；各视口 9 图加载、章节状态、滚动动画和无溢出均通过；dialog 另测 1440/390 和 375 降级 |
| 可键盘操作、减少动画、关闭后恢复 | **旧策略已通过；本轮站内切换待验证** | 基线 [Choice 报告](../design-references/entangled-shelter/choice-qa/results.json)：Tab、Escape、焦点返回、页面/Lenis 锁定与恢复；基线 [深度报告](../design-references/entangled-shelter/depth-qa/results.json)：旧减少动画策略下无 Canvas、海报保留、上下文恢复 |
| 本地保存及保存失败时仍可选择 | **已通过** | [Choice 报告](../design-references/entangled-shelter/choice-qa/results.json)：桌面/手机各存下三类已确认结果且刷新仍在；375 视口禁用存储后仍正常接受答案，并明确提示未保存 |
| 完全本地、无必需远程运行依赖 | **根路径已通过冷缓存断外网验收** | [Choice 报告](../design-references/entangled-shelter/choice-qa/results.json) 三组 `coldCache: true`、`externalRequested: []`；最终 8 视口页面报告也均无外部请求。此结论不包含保留的 Shopify 参考路由 |
| 可持续维护和重建 | **已通过** | `npm run check` 及最终 lint / 类型检查均通过，见 [验证记录](VALIDATION_RECORD.md)；构建 ID 与性能报告一致，本地 HTTP 200；[process_assets.py](../../scripts/media/process_assets.py)、[qa_frames.py](../../scripts/media/qa_frames.py) 实际运行通过 |

9 月 7 日浏览器截图、连续滚动录像、性能数据与结果已落在 `docs/design-references/entangled-shelter/` 下各 QA 子目录，基线验收及构建记录已经归档；测量覆盖当时构建、本机浏览器和模拟视口，不将其扩大为本轮新构建或所有硬件的保证。9 月 8 日验收与构建归档待主验收补充。

## 9. 以后怎么改

1. **改标题和文案：** 浏览器标签页改 `layout.tsx` 的 metadata；页面 H1、首屏文案改 `EntangledShelter.tsx`；章节名、导语、主图 ID、细节图 ID 和引导标签改顶部 `chapters`。
2. **改具体选项：** 改 `choice-data.ts` 的 `choiceCategories`。每个选项保持唯一 `id`，填 `name` / `detail` / `group`；分组名称必须与 `groups` 一致。改选项后重新跑逻辑和浏览器测试，不要只改章节展示标签。
3. **改图片：** 用自己的新源图重新生成配套 WebP 和真实深度图，保持比例一致；再改章节 `image` / `detail` 或对应 `Art id`。用 `focus` / `focusX` / `focusY` 调整小屏裁切主体位置；不要给新图沿用不匹配的旧深度图。
4. **改滚动节奏：** 外层滚动距离、sticky 高度在主 CSS；滚动起止点、`scrub`、元素位移/缩放在 `EntangledShelter.tsx` 的 GSAP 时间轴。二者共同决定节奏，改其一后必须重新测章节定位和导航状态。
5. **改画内视差：** `DepthScene` 的 `strength`、偏移系数和 shader 决定深度幅度。优先调整幅度与构图，不要靠大幅拉伸获得“更明显”的假 3D；保留低性能/故障海报降级与站内减少动效选项。
6. **改游戏规则与翻牌手感：** 规则只改 `choice-data.ts` 的 `playRound` / `compareGestures` / `createDecision`；视觉时间轴改 `ChoiceLab.draw`，牌面/票据样式改其 CSS。不要移除胜利后才能确认、揭晓中禁止重复提交等保护。
7. **重新制作视频：** 使用隔离 Python 的 `-X utf8` 运行媒体脚本，避免中文 Windows 的 GBK shader 解码问题。网页运行不需要一起分发 `.tools/depthflow` 或模型缓存。
8. **改动效开关：** 默认值、保存键、订阅和内存回退在 `site-motion.ts`；按钮在 `EntangledShelter.tsx`。各层统一使用 `useSiteMotion` / `data-motion`，不要重新散落添加自动跟随 OS 的 `prefers-reduced-motion` 分支。修改后验证完整 → 减少 → 完整、刷新、跨标签与存储失败路径，并记录对应新构建。
