"use client";

import { useEffect, useRef } from "react";
import { useSiteMotion } from "./site-motion";
import styles from "./DepthScene.module.css";

export type DepthSceneProps = {
  image: string;
  depth: string;
  alt: string;
  className?: string;
  /** Object-position coordinates, from 0 (left/top) to 1 (right/bottom). */
  focusX?: number;
  focusY?: number;
  /** Per-painting camera amplitude; complex silhouettes retain a lower strength. */
  strength?: number;
  priority?: boolean;
};

type Renderer = {
  draw: (time: number, delta: number) => void;
  measure: () => void;
  destroy: () => void;
};

type Scene = {
  visible: boolean;
  area: number;
  priority: boolean;
  ready: boolean;
  reduced: boolean;
  disposed: boolean;
  renderer: Renderer | null;
  activate: () => void;
  deactivate: () => void;
};

/* A single scheduler and a bounded GPU pool are shared by every scene. A page
 * may contain many paintings, but only its three most visible scenes own GPU
 * resources. Offscreen canvases are removed and their contexts explicitly lost. */
const scenes = new Set<Scene>();
const MAX_CONTEXTS = 3;
let frameHandle = 0;
let lastFrame = 0;
let nextFrameAt = 0;
let layoutDirty = true;
let pointerX = 0;
let pointerY = 0;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function markLayoutDirty() {
  layoutDirty = true;
}

function updatePointer(event: PointerEvent) {
  if (event.pointerType !== "mouse") return;
  pointerX = (event.clientX / window.innerWidth) * 2 - 1;
  pointerY = 1 - (event.clientY / window.innerHeight) * 2;
}

function clearPointer() {
  pointerX = 0;
  pointerY = 0;
}

function animate(time: number) {
  frameHandle = 0;
  // High-refresh displays can issue 200+ RAF callbacks per second. Cap this
  // texture-heavy layer at 60 Hz while the page's DOM choreography stays native.
  if (nextFrameAt && time + 0.5 < nextFrameAt) {
    frameHandle = requestAnimationFrame(animate);
    return;
  }
  nextFrameAt = Math.max(nextFrameAt + 1_000 / 60, time + 1);
  const delta = Math.min(64, Math.max(1, time - (lastFrame || time - 16.67)));
  lastFrame = time;
  const rendering = [...scenes].filter((scene) => scene.renderer);

  // Batch DOM geometry reads before GPU writes.
  if (layoutDirty) {
    rendering.forEach((scene) => scene.renderer?.measure());
    layoutDirty = false;
  }
  rendering.forEach((scene) => scene.renderer?.draw(time, delta));
  if (rendering.length && !document.hidden) {
    frameHandle = requestAnimationFrame(animate);
  }
}

function reconcileScenes() {
  const available = [...scenes]
    .filter((scene) => scene.visible && scene.ready && !scene.reduced && !scene.disposed && !document.hidden)
    .sort((left, right) => right.area - left.area || Number(right.priority) - Number(left.priority));
  const chosen = new Set(available.slice(0, MAX_CONTEXTS));

  // Release first, so acquiring the next chapter never exceeds the pool limit.
  scenes.forEach((scene) => {
    if (!chosen.has(scene)) scene.deactivate();
  });
  chosen.forEach((scene) => {
    if (!scene.renderer) scene.activate();
  });

  if ([...scenes].some((scene) => scene.renderer) && !frameHandle) {
    layoutDirty = true;
    lastFrame = 0;
    nextFrameAt = 0;
    frameHandle = requestAnimationFrame(animate);
  } else if (![...scenes].some((scene) => scene.renderer) && frameHandle) {
    cancelAnimationFrame(frameHandle);
    frameHandle = 0;
    lastFrame = 0;
    nextFrameAt = 0;
  }
}

function registerScene(scene: Scene) {
  if (!scenes.size) {
    window.addEventListener("scroll", markLayoutDirty, { passive: true });
    window.addEventListener("resize", markLayoutDirty, { passive: true });
    window.addEventListener("pointermove", updatePointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", clearPointer);
    document.addEventListener("visibilitychange", reconcileScenes);
  }
  scenes.add(scene);
  return () => {
    scene.disposed = true;
    scene.deactivate();
    scenes.delete(scene);
    reconcileScenes();
    if (!scenes.size) {
      window.removeEventListener("scroll", markLayoutDirty);
      window.removeEventListener("resize", markLayoutDirty);
      window.removeEventListener("pointermove", updatePointer);
      document.documentElement.removeEventListener("pointerleave", clearPointer);
      document.removeEventListener("visibilitychange", reconcileScenes);
      clearPointer();
    }
  };
}

const vertexShader = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uImage;
  uniform sampler2D uDepth;
  uniform vec2 uCover;
  uniform vec2 uFocus;
  uniform vec2 uOffset;
  uniform float uZoom;

  // White is near. The ray walks front-to-back through the depth field, then
  // refines the first intersection. This preserves occlusion at silhouettes
  // instead of shifting every pixel by its initial depth sample.
  vec2 intersectDepth(vec2 origin, vec2 direction) {
    float previous = 0.0;
    float current = 0.0;
    for (int stepIndex = 0; stepIndex < 20; stepIndex++) {
      vec2 point = origin + direction * (0.48 - current);
      float surface = 1.0 - texture2D(uDepth, point).r;
      if (current >= surface) break;
      previous = current;
      current += 0.05;
    }
    for (int refinement = 0; refinement < 3; refinement++) {
      float middle = (previous + current) * 0.5;
      vec2 point = origin + direction * (0.48 - middle);
      float surface = 1.0 - texture2D(uDepth, point).r;
      if (middle >= surface) current = middle;
      else previous = middle;
    }
    return origin + direction * (0.48 - (previous + current) * 0.5);
  }

  void main() {
    // Same crop as object-fit: cover and object-position on the poster. Zoom
    // is an overscan margin, so a moving camera never reveals empty edges.
    vec2 centered = (vUv - 0.5) / uZoom + 0.5;
    vec2 origin = centered * uCover + (1.0 - uCover) * uFocus;
    vec2 uv = intersectDepth(origin, uOffset * uCover);
    gl_FragColor = vec4(texture2D(uImage, clamp(uv, 0.001, 0.999)).rgb, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Shader allocation unavailable");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const reason = gl.getShaderInfoLog(shader) || "Shader compilation unavailable";
    gl.deleteShader(shader);
    throw new Error(reason);
  }
  return shader;
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.decoding = "async";
    image.onload = () => {
      image.onload = null;
      image.onerror = null;
      resolve(image);
    };
    image.onerror = () => {
      image.onload = null;
      image.onerror = null;
      reject(new Error("Image asset unavailable"));
    };
    image.src = source;
  });
}

function makeRenderer({
  host,
  stage,
  source,
  depth,
  focusX,
  focusY,
  strength,
  onContextLost,
}: {
  host: HTMLDivElement;
  stage: HTMLDivElement;
  source: HTMLImageElement;
  depth: HTMLImageElement;
  focusX: number;
  focusY: number;
  strength: number;
  onContextLost: () => void;
}): Renderer {
  const canvas = document.createElement("canvas");
  canvas.className = styles.canvas;
  canvas.setAttribute("aria-hidden", "true");
  const context = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: "low-power",
  });
  if (!context) throw new Error("WebGL unavailable");
  const gl: WebGLRenderingContext = context;

  let disposed = false;
  let program: WebGLProgram | null = null;
  let vertex: WebGLShader | null = null;
  let fragment: WebGLShader | null = null;
  let buffer: WebGLBuffer | null = null;
  const textures: WebGLTexture[] = [];

  const destroy = () => {
    if (disposed) return;
    disposed = true;
    canvas.removeEventListener("webglcontextlost", handleContextLost);
    textures.forEach((texture) => gl.deleteTexture(texture));
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.remove();
  };

  function handleContextLost(event: Event) {
    event.preventDefault();
    if (!disposed) onContextLost();
  }

  try {
    vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
    fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    program = gl.createProgram();
    if (!program) throw new Error("Program allocation unavailable");
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Shader linking unavailable");
    gl.useProgram(program);

    buffer = gl.createBuffer();
    if (!buffer) throw new Error("Vertex allocation unavailable");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const attribute = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    [source, depth].forEach((image, index) => {
      const texture = gl.createTexture();
      if (!texture) throw new Error("Texture allocation unavailable");
      textures.push(texture);
      gl.activeTexture(index === 0 ? gl.TEXTURE0 : gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.uniform1i(gl.getUniformLocation(program!, index === 0 ? "uImage" : "uDepth"), index);
    });
    if (gl.getError() !== gl.NO_ERROR) throw new Error("Texture upload unavailable");
  } catch (error) {
    destroy();
    throw error;
  }

  const uniforms = {
    cover: gl.getUniformLocation(program, "uCover"),
    focus: gl.getUniformLocation(program, "uFocus"),
    offset: gl.getUniformLocation(program, "uOffset"),
    zoom: gl.getUniformLocation(program, "uZoom"),
  };
  gl.uniform2f(uniforms.focus, focusX, 1 - focusY);
  const section = host.closest<HTMLElement>("[data-depth-section]") ?? host.closest("section, article") ?? host;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const sourceRatio = source.naturalWidth / source.naturalHeight;
  let width = 1;
  let height = 1;
  let sectionProgress = 0;
  let offsetX = 0;
  let offsetY = 0;
  let frames = 0;
  let slowFrames = 0;
  let quality = 1;
  let averageDelta = 16.67;
  let lastAdaptation = 0;
  let firstFrame = true;

  function resizeCanvas() {
    const pixels = coarsePointer ? 720_000 : 1_500_000;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(pixels / (width * height))) * quality;
    const nextWidth = Math.max(1, Math.round(width * ratio));
    const nextHeight = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      gl.viewport(0, 0, nextWidth, nextHeight);
    }
    const targetRatio = width / height;
    gl.uniform2f(uniforms.cover, Math.min(1, targetRatio / sourceRatio), Math.min(1, sourceRatio / targetRatio));
    host.dataset.depthQuality = quality.toFixed(2);
    host.dataset.depthResolution = `${nextWidth}x${nextHeight}`;
  }

  const measure = () => {
    const bounds = host.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    const sectionBounds = section.getBoundingClientRect();
    sectionProgress = clamp((window.innerHeight - sectionBounds.top) / (window.innerHeight + sectionBounds.height), 0, 1) * 2 - 1;
    resizeCanvas();
  };

  const draw = (time: number, delta: number) => {
    if (disposed || gl.isContextLost()) return;
    const seconds = time * 0.001;
    const mouseAmount = coarsePointer ? 0 : 1;
    const desiredX = strength * (pointerX * 0.042 * mouseAmount + Math.sin(seconds * 0.36) * 0.010 + sectionProgress * 0.012);
    const desiredY = strength * (pointerY * 0.030 * mouseAmount + Math.cos(seconds * 0.29) * 0.007 + sectionProgress * 0.038);
    const smoothing = 1 - Math.exp(-delta / 300);
    offsetX += (desiredX - offsetX) * smoothing;
    offsetY += (desiredY - offsetY) * smoothing;
    gl.uniform2f(uniforms.offset, offsetX, offsetY);
    // A wider overscan margin protects the edges at the stronger camera offsets.
    gl.uniform1f(uniforms.zoom, 1.085 + strength * (Math.abs(sectionProgress) * 0.018 + Math.sin(seconds * 0.24) * 0.004));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    frames += 1;

    if (firstFrame) {
      firstFrame = false;
      host.dataset.depthReady = "true";
      host.dataset.renderMode = "webgl";
      delete host.dataset.depthError;
    }
    if (frames % 20 === 0 || frames === 1) {
      host.dataset.depthFrames = String(frames);
      host.dataset.depthOffset = `${offsetX.toFixed(5)},${offsetY.toFixed(5)}`;
      host.dataset.depthScroll = sectionProgress.toFixed(4);
    }

    // Adapt only after a sustained slow period, never on one navigation jank.
    averageDelta += (delta - averageDelta) * 0.035;
    slowFrames = averageDelta > 27 ? slowFrames + 1 : Math.max(0, slowFrames - 2);
    if (slowFrames > 80 && quality > 0.62 && time - lastAdaptation > 4_000) {
      quality = Math.max(0.62, quality - 0.13);
      slowFrames = 0;
      lastAdaptation = time;
      resizeCanvas();
    }
  };

  canvas.addEventListener("webglcontextlost", handleContextLost);
  stage.append(canvas);
  measure();
  return { draw, measure, destroy };
}

/** A painting remains a real accessible image; the decorative canvas above it
 * progressively enhances it with the supplied, near-white depth estimation. */
export function DepthScene({
  image,
  depth,
  alt,
  className = "",
  focusX = 0.5,
  focusY = 0.5,
  strength = 1,
  priority = false,
}: DepthSceneProps) {
  const motion = useSiteMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const hostElement = hostRef.current;
    const stage = stageRef.current;
    const poster = posterRef.current;
    if (!hostElement || !stage || !poster) return;
    const host: HTMLDivElement = hostElement;
    const x = clamp(focusX, 0, 1);
    const y = clamp(focusY, 0, 1);
    poster.style.objectPosition = `${x * 100}% ${y * 100}%`;
    let assets: [HTMLImageElement, HTMLImageElement] | null = null;
    let loading = false;
    let retries = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const setMode = (mode: string) => {
      host.dataset.renderMode = mode;
      host.dataset.depthReady = "false";
    };

    const scene: Scene = {
      visible: false,
      area: 0,
      priority,
      ready: false,
      reduced: motion === "reduced",
      disposed: false,
      renderer: null,
      activate() {
        if (!assets || scene.disposed || scene.renderer) return;
        try {
          scene.renderer = makeRenderer({
            host,
            stage,
            source: assets[0],
            depth: assets[1],
            focusX: x,
            focusY: y,
            strength: clamp(strength, 0, 1.8),
            onContextLost() {
              scene.deactivate();
              scene.ready = false;
              setMode("fallback");
              scheduleRetry();
            },
          });
        } catch {
          scene.ready = false;
          host.dataset.depthError = "gpu-unavailable";
          setMode("fallback");
          scheduleRetry();
        }
      },
      deactivate() {
        if (scene.renderer) {
          scene.renderer.destroy();
          scene.renderer = null;
        }
        if (scene.reduced) setMode("reduced-motion");
        else if (host.dataset.renderMode === "webgl") setMode("poster");
      },
    };

    function scheduleRetry() {
      if (scene.disposed || retryTimer || retries >= 2) return;
      retries += 1;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        if (scene.disposed) return;
        if (assets) {
          scene.ready = true;
          reconcileScenes();
        } else if (scene.visible) void prepare();
      }, retries * 2_000);
    }

    async function prepare() {
      if (loading || assets || scene.disposed || scene.reduced) return;
      loading = true;
      setMode("loading");
      try {
        assets = await Promise.all([loadImage(image), loadImage(depth)]);
        if (scene.disposed) return;
        const sourceRatio = assets[0].naturalWidth / assets[0].naturalHeight;
        const depthRatio = assets[1].naturalWidth / assets[1].naturalHeight;
        if (Math.abs(sourceRatio - depthRatio) > 0.02) {
          assets = null;
          throw new Error("Depth aspect mismatch");
        }
        scene.ready = true;
        setMode(scene.reduced ? "reduced-motion" : "poster");
        reconcileScenes();
      } catch {
        if (!scene.disposed) {
          host.dataset.depthError = "asset-unavailable";
          setMode("fallback");
          scheduleRetry();
        }
      } finally {
        loading = false;
      }
    }

    const unregister = registerScene(scene);
    const observer = new IntersectionObserver(([entry]) => {
      scene.visible = entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0;
      scene.area = entry.intersectionRect.width * entry.intersectionRect.height;
      if (scene.visible) void prepare();
      reconcileScenes();
    }, { threshold: [0, 0.1, 0.3, 0.6, 1] });
    const resizeObserver = new ResizeObserver(markLayoutDirty);
    observer.observe(host);
    resizeObserver.observe(host);
    if (scene.reduced) setMode("reduced-motion");
    // Preload the first painting's depth, but do not start its GPU until visible.
    if (priority && !scene.reduced) void prepare();

    return () => {
      unregister();
      observer.disconnect();
      resizeObserver.disconnect();
      if (retryTimer) clearTimeout(retryTimer);
      assets = null;
    };
  }, [image, depth, focusX, focusY, strength, priority, motion]);

  return (
    <div
      ref={hostRef}
      className={`${styles.scene} ${className}`}
      data-depth-scene=""
      data-motion={motion}
      data-depth-ready="false"
      data-render-mode="poster"
      data-depth-source={image}
    >
      {/* These locally prepared images also feed WebGL; bypassing image
          optimization preserves an exact crop and a single decoded source. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={posterRef}
        className={styles.poster}
        src={image}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        draggable={false}
      />
      <div ref={stageRef} className={styles.stage} aria-hidden="true" />
    </div>
  );
}

