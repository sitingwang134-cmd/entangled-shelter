# Technical stack analysis

The inspected source is a Remix application using Lenis smooth scrolling, WebGL/canvas rendering, HTML video, inline SVG, responsive images, and Rive frame sequences. The capture found 345 images, 12 video nodes, 124 inline SVG nodes, 366 interactive nodes, and one canvas.

The clone host is Next.js 16.3 with React 19 and Tailwind CSS 4. It uses local copies of the three distinctive source fonts. The implementation deliberately avoids recreating the source's proprietary rendering pipeline and instead treats the public source document as the exact rendering unit.
