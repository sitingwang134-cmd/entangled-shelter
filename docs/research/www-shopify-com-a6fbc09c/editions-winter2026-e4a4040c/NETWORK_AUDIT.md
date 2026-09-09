# Shopify Winter 2026 本地镜像网络依赖审计

- 审计对象：`https://www.shopify.com/editions/winter2026`
- 本地入口：`http://127.0.0.1:3000/editions/winter2026`
- 审计日期：2026-09-07（Asia/Shanghai）
- 结论：**不具备离线可用性；当前实现是“原始 HTML 的本地转发”，不是网络自包含镜像。**

## 1. 关键结论

1. `mirror-live.html` 与 `source.html` 完全相同：两者均为 1,453,150 bytes，SHA-256 均为 `3E20C8EA0657C39AD76BDFFA7B289AED8D30A3AA09CE953CBBF3D865A6840062`。
2. `generate-local-mirror-*.mjs` 只执行 `readFile(source.html)` 后原样 `writeFile(mirror-live.html)`，没有 URL 重写、依赖封装或离线降级。
3. 当前 Next.js rewrite 将 `/editions/winter2026` 指向 `mirror-live.html`。该 HTML 内指向本地 `media/` 的 URL 字面量为 **0**，因此已下载资源没有被当前线上路由消费。
4. HTML 原文包含 **2,434 次** HTTP(S) URL 引用、**1,810 个**去重后的完整 URL，涉及 **21 个域名**。其中 2,289 次为 HTTPS，145 次为 HTTP；HTTP 中 143 次是 SVG/XML namespace，另外是一个 `shopify.dev` 的 HTTP 导航地址在渲染标记与序列化数据中的两个版本。
5. 初始 DOM 中可判定为页面资源的引用共有 **931 次 / 547 个完整 URL / 113 个按 origin + pathname 合并后的资源**。资源清单按 pathname 能覆盖其中 92 个，但 HTML 没有使用任何已下载路径，所以实际离线覆盖率仍为 **0%**。
6. 阻断所有非 localhost 请求后，浏览器首轮立即尝试并失败 24 个 CDN 请求：12 个 JavaScript、3 个字体、2 个样式表、7 个图片/图标。页面仍有服务端渲染文本，但 345 张图片加载成功 0 张、12 个视频 ready 0 个、可用样式表 0 个，Remix/React 客户端没有完成 hydration。
7. 资源清单之外还存在 27 个唯一 `.riv` 动画地址、至少 13 个唯一 JavaScript 地址，以及未下载的图标/图片路径。滚动、弹层、视频懒加载、Rive 动画、搜索和导航交互均依赖远端运行时代码或资源。

## 2. 审计范围与口径

检查了以下文件：

- `public/sites/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c/mirror-live.html`
- `docs/research/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c/source.html`
- `scripts/download-assets-www-shopify-com-a6fbc09c-editions-winter2026-e4a4040c.mjs`
- `scripts/generate-local-mirror-www-shopify-com-a6fbc09c-editions-winter2026-e4a4040c.mjs`
- `docs/research/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c/ARTIFACT_MANIFEST.json`
- `docs/research/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c/ARTIFACT_MANIFEST.md`
- `next.config.ts`，用于确认实际服务路径。

统计采用两种口径：

- **原文扫描**：统计 HTML 内所有 HTTP(S) 字面量，包括 DOM 属性、内联模块、Remix 序列化页面数据、普通跳转链接和 namespace。查询参数不同视为不同完整 URL。
- **DOM 资源扫描**：通过本地路由构建 DOM，按标签和属性区分图片、视频、样式、字体、脚本、跳转等；同时以 `origin + pathname` 合并响应式图片的宽度/高度查询变体。

浏览器离线测试使用 1440×900 viewport，允许 localhost 请求并中止所有其他 HTTP(S) 请求，页面加载后等待 8 秒采样。这个测试反映“第一次离线打开”的结果，不包含浏览器此前可能持有的 CDN 缓存。

## 3. 当前服务链路

```text
/editions/winter2026
  -> next.config.ts beforeFiles rewrite
  -> /sites/.../mirror-live.html
  -> source.html 的逐字节副本
  -> CSS / 字体 / JS / 图片 / 视频 / Rive 仍指向远端

public/sites/.../media/*  (135 files, 46.12 MiB)
  -> 当前 mirror-live.html 引用数：0
```

因此，“本地部署成功”只代表 HTML 可以从本机返回；正常视觉和交互仍要访问 Shopify CDN 及相关站点。

## 4. HTML 原文中的 HTTP(S) 外链分布

### 4.1 协议

| 协议 | 出现次数 | 唯一完整 URL |
|---|---:|---:|
| HTTPS | 2,289 | 1,806 |
| HTTP | 145 | 4 |
| 合计 | 2,434 | 1,810 |

备注：两个唯一 HTTP URL 是 W3C namespace，另外两个是同一 `shopify.dev` 文档链接的带/不带跟踪参数版本。W3C namespace 是标识符，不会触发网络请求；`shopify.dev` 链接只有在用户点击时才导航。

### 4.2 按域名

下表来自 `mirror-live.html` 原文；`source.html` 的统计完全一致。

| 域名 | 出现次数 | 唯一完整 URL | 主要角色 |
|---|---:|---:|---|
| `cdn.shopify.com` | 1,635 | 1,235 | CSS、字体、模块、图片、视频、Rive、图标 |
| `help.shopify.com` | 238 | 238 | 产品文档跳转 |
| `www.w3.org` | 143 | 2 | SVG/XML namespace，不是网络资源 |
| `www.shopify.com` | 108 | 55 | canonical、语言版本、站内跳转 |
| `shopify.dev` | 102 | 98 | 开发者文档跳转 |
| `editions-winter-2026.myshopify.com` | 79 | 79 | 序列化数据中的媒体地址 |
| `apps.shopify.com` | 50 | 28 | App Store 跳转 |
| `admin.shopify.com` | 43 | 43 | 注册/后台跳转 |
| `shop.app` | 5 | 5 | 连接提示与导航 |
| `themes.shopify.com` | 5 | 4 | Theme Store 跳转 |
| `hardware.shopify.com` | 5 | 4 | 硬件商店跳转 |
| `changelog.shopify.com` | 4 | 4 | 更新日志跳转 |
| `hydrogen.shopify.dev` | 4 | 2 | Hydrogen 文档跳转 |
| `lovable.dev` | 2 | 2 | 外部产品跳转 |
| `www.tinker.com` | 2 | 2 | 外部产品跳转 |
| `help.shop.app` | 2 | 2 | Shop 帮助跳转 |
| `accounts.shopify.com` | 2 | 2 | 账户跳转 |
| `tangleml.com` | 2 | 2 | 外部产品跳转 |
| `www.gstatic.com` | 1 | 1 | DNS 预取提示 |
| `sidekick-skills-endpoint-924415839772.us-central1.run.app` | 1 | 1 | 序列化数据中的应用端点 |
| `mvseskate.myshopify.com` | 1 | 1 | 序列化内容中的商店地址 |

### 4.3 按资源后缀

这是对原文字面量按 URL pathname 后缀的机械分类；“document/endpoint”包含导航链接、API/商店地址和无可识别静态资源后缀的 URL。

| 类型 | 出现次数 | 唯一完整 URL |
|---|---:|---:|
| 图片 | 1,435 | 1,052 |
| document / endpoint / 其他无后缀 URL | 716 | 612 |
| SVG/XML namespace | 123 | 1 |
| 视频 | 111 | 100 |
| Rive `.riv` 动画 | 27 | 27 |
| JavaScript | 17 | 13 |
| 字体 | 3 | 3 |
| CSS | 2 | 2 |

### 4.4 初始 DOM 属性的语义分布

| 语义类别 | 出现次数 | 唯一完整 URL | 离线影响 |
|---|---:|---:|---|
| 图片 | 889 | 522 | 视觉内容丢失；包含大量 `srcset` 变体 |
| 普通导航链接 | 265 | 221 | 当前页面可显示，但点击后需要网络 |
| W3C namespace | 143 | 1 | 无网络影响 |
| XLink namespace/其他标识 | 20 | 1 | 无网络影响 |
| 文档元数据 | 13 | 12 | canonical/语言版本，不影响首屏视觉 |
| JavaScript module preload | 12 | 12 | hydration 与交互失效 |
| 视频懒加载地址 | 12 | 1 | 视频无法播放；12 个标签复用一个 `data-src` |
| CSS mask / 图标 | 11 | 6 | 导航、搜索、菜单等图标缺失 |
| connection hint | 4 | 3 | 本身不承载页面内容 |
| 字体 | 3 | 3 | 品牌字体缺失，排版尺寸/断行变化 |
| Open Graph/Twitter 图片元数据 | 2 | 1 | 分享预览受影响 |
| CSS | 2 | 2 | 整页布局、颜色、响应式与动画样式缺失 |

## 5. 下载清单与页面引用的关系

### 5.1 清单完整性

`ARTIFACT_MANIFEST.json` 声明：

- requested：135
- downloaded：135
- failed：0
- totalBytes：48,362,588（46.12 MiB）
- 域名：`cdn.shopify.com` 130 项，`editions-winter-2026.myshopify.com` 5 项
- 类型：117 图片、13 视频、3 字体、2 CSS

实际磁盘验证结果：`media/` 下正好 135 个文件，合计 48,362,588 bytes；每个 manifest path 都存在且文件大小与 `bytes` 字段相符。

### 5.2 为什么下载成功仍不能离线

`download-assets-*.mjs` 有三个关键行为：

1. 候选资源来自 `desktop-1440-extraction.json`，不是从最终 HTML 做闭包式依赖遍历。
2. 它只下载已知图片/视频/字体/CSS 后缀或有限 initiator type；`.riv` 和 JavaScript 模块不在下载集合内。
3. 它把相同 `origin + pathname` 的响应式变体合并，并选择查询参数中面积评分最高的一项，但不会改写 HTML 的 `src`、`srcset`、`href`、`data-src`、CSS `url()` 或内联序列化数据。

`generate-local-mirror-*.mjs` 随后又只把 `source.html` 原样复制到 `mirror-live.html`。所以资源清单只是落盘证据，不是页面的依赖映射。

### 5.3 按初始 DOM 的 pathname 覆盖

初始 DOM 中可加载资源合并查询变体后有 113 个唯一 `origin + pathname`：

| 类别 | 唯一 pathname | manifest 覆盖 | 明确未覆盖 |
|---|---:|---:|---:|
| 图片 | 88 | 86 | 2 |
| CSS | 2 | 2 | 0 |
| 字体 | 3 | 3 | 0 |
| 视频 | 1 | 1 | 0 |
| CSS mask / 图标 | 6 | 0 | 6 |
| JavaScript | 12 | 0 | 12 |
| 分享元数据图片 | 1 | 0 | 1 |
| 合计 | 113 | 92 | 21 |

两个未覆盖的 DOM 图片 pathname 是：

- `https://cdn.shopify.com/s/files/1/0951/3130/4218/files/Line_Grid-tablet.svg`
- `https://cdn.shopify.com/s/files/1/0951/3130/4218/files/Frame_2085655272.svg`

六个未覆盖的 mask/icon pathname 是：

- `global-16-shrevon-down.svg`
- `global-16-arrow-diagonal.svg`
- `global-16-search.svg`
- `global-24-menu.svg`
- `global-24-external-link.svg`
- `CloseX16.svg`

另外，原始 Remix 页面数据中有 27 个唯一 `.riv` 文件和一个 `popup.min_*.js` 地址，它们不在 manifest 中。manifest 中有 43 个 pathname 未直接出现在初始 DOM 属性里，主要是延迟媒体、视频和 Rive fallback 帧；它们可能要等客户端代码运行、滚动或交互后才会被使用。

## 6. 离线浏览器实测

测试条件：从本地 Next.js 路由加载页面，localhost 请求放行，所有其他 HTTP(S) 请求返回 `net::ERR_INTERNET_DISCONNECTED`。

首轮失败的 24 个请求全部来自 `cdn.shopify.com`：

| 浏览器资源类型 | 失败数 | 代表内容 |
|---|---:|---|
| Script | 12 | Remix manifest、entry client、route modules、Rive/components 等 |
| Font | 3 | 3 个品牌 WOFF2 字体 |
| Stylesheet | 2 | Tailwind 主样式和字体 CSS |
| Image/图标 | 7 | Line Grid、Edition 缩略图、favicon |

页面状态：

| 项目 | 离线结果 |
|---|---:|
| 页面 title | 仍存在：`Shopify Editions \| Winter '26` |
| body 文本长度 | 35,156 字符，SSR 内容仍在 |
| DOM 中 `<img>` | 345 |
| 成功加载的图片 | 0 |
| DOM 中 `<video>` | 12 |
| readyState ≥ 2 的视频 | 0 |
| 可用样式表 | 0 |
| 外部请求失败 | 24（首轮；依赖链未继续展开） |

“首轮 24”不是完整远端依赖上限：入口脚本被拦截后，其传递依赖、Rive 文件、后续图片和交互请求不会再被触发。静态 URL 清单和初始 DOM 统计更接近完整缺口。

## 7. 离线缺口及用户可见后果

| 缺口 | 直接后果 |
|---|---|
| 2 个远端 CSS | 页面基本无设计样式，布局、颜色、响应式和动画失真 |
| 3 个远端字体 | 字体回退，字宽、断行和高度与原站不同 |
| 12 个 module preload + 内联 module imports | Remix/React hydration 不完成；菜单、搜索、弹层、状态切换等交互不可靠或失效 |
| 所有图片 URL 仍为 CDN | 首屏与长页媒体为空；响应式 `srcset` 全部需要网络 |
| 视频只保留远端 `data-src` | 客户端不能激活/播放视频 |
| 27 个 Rive URL 未下载 | 交互动画与关键产品演示无法离线运行 |
| 6 个 CSS mask 图标未下载 | 导航箭头、搜索、菜单、外链、关闭等图标缺失 |
| 普通外链未本地化 | 页面本身即使修复，点击 221 个唯一外链仍需联网；这可作为有意保留的行为，但不能称为全站离线 |

## 8. 修复优先级建议（本报告未实施）

1. **先建立可验证的 URL-to-local map**：以完整 URL 与 `origin + pathname` 两种键保存映射，并保留 MIME、hash 和失败原因。
2. **下载并改写关键路径**：先处理 2 CSS、3 字体、12 个入口模块及其递归 import graph、全部 `img/srcset`、视频、6 个 mask 图标和 2 个遗漏图片。
3. **补齐延迟资源**：解析 Remix 序列化数据，下载 27 个 `.riv`、其 fallback、所有视频变体及动态脚本；不能只依赖 desktop 一次网络采样。
4. **重写所有加载位置**：包括 HTML 属性、`srcset`、内联 style 的 `url()`、模块 import、CSS 内 `url()`、`data-src` 与客户端序列化数据。仅复制文件到 `media/` 没有效果。
5. **区分资源依赖与导航外链**：资源必须本地化；普通产品/文档链接可保留远端，但应在离线说明中明确点击需要联网。
6. **增加强制离线验收**：浏览器层拦截所有非 localhost 请求，要求关键 viewport 下外部资源请求数为 0、图片加载完整、字体和样式生效、核心交互通过。清空浏览器缓存后重复测试，避免 CDN 缓存造成假通过。

## 9. 最终判定

| 维度 | 判定 |
|---|---|
| HTML 可由本地服务器返回 | 通过 |
| 已下载资产在磁盘上完整存在 | 通过 |
| 当前 HTML 使用本地资产 | **失败（0 个引用）** |
| 首屏断网视觉可用 | **失败** |
| 断网交互可用 | **失败** |
| 网络自包含镜像 | **失败** |

当前实现适合称为“带部分资产归档的在线依赖镜像”。在完成 URL 改写、脚本依赖闭包、Rive/视频补齐并通过强制离线验收前，不应把它标记为离线复刻完成。
