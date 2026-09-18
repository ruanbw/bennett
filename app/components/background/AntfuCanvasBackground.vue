<script setup lang="ts">
// 性能：pixi 类型必须用 `import type` 显式声明。
// 若写成 `import('pixi.js').Sprite` 内联类型，打包器会将其提升为运行时静态依赖，
// 导致 830k 的 pixi 被首屏 modulepreload。用 `import type` 可保证编译期彻底擦除。
import type { Application, Container, Graphics, Sprite, Texture } from 'pixi.js'
import type { createNoise3D as createNoise3DFn } from 'simplex-noise'

interface Point {
  x: number
  y: number
  opacity: number
  sprite: Sprite
}

const rootRef = ref<HTMLDivElement | null>(null)

const SCALE = 200
const LENGTH = 5
const SPACING = 15

let noise3d: ReturnType<typeof createNoise3DFn> | null = null
const existingPoints = new Set<string>()
const points: Point[] = []

let w = 0
let h = 0
let app: Application | null = null
let particles: Container | null = null
let dotTexture: Texture | null = null
let SpriteCtor: typeof Sprite | null = null
let ContainerCtor: typeof Container | null = null
let GraphicsCtor: typeof Graphics | null = null
let ApplicationCtor: typeof Application | null = null

function getForceOnPoint(x: number, y: number, z: number) {
  if (!noise3d) {
    return 0
  }
  return (noise3d(x / SCALE, y / SCALE, z) - 0.5) * 2 * Math.PI
}

function createDotTexture(rendererApp: Application) {
  if (!GraphicsCtor) {
    throw new Error('Graphics constructor is not ready')
  }
  const g = new GraphicsCtor()
  g.circle(0, 0, 1)
  g.fill(0xCCCCCC)
  return rendererApp.renderer.generateTexture(g)
}

function addPoints() {
  if (!particles || !dotTexture || !SpriteCtor) {
    return
  }

  for (let x = -SPACING / 2; x < w + SPACING; x += SPACING) {
    for (let y = -SPACING / 2; y < h + SPACING; y += SPACING) {
      const id = `${x}-${y}`
      if (existingPoints.has(id)) {
        continue
      }
      existingPoints.add(id)

      const sprite = new SpriteCtor(dotTexture)
      sprite.anchor.set(0.5, 0.5)
      particles.addChild(sprite)

      points.push({
        x,
        y,
        opacity: Math.random() * 0.5 + 0.5,
        sprite,
      })
    }
  }
}

function onResize() {
  if (!app) {
    return
  }
  w = window.innerWidth
  h = window.innerHeight
  app.renderer.resize(w, h)
  addPoints()
}

const rafId: number | null = null
let tickerFn: (() => void) | null = null
let visible = true

function onVisibilityChange() {
  visible = document.visibilityState === 'visible'
  if (visible && app?.ticker && tickerFn && !app.ticker.started)
    app.ticker.start()
  if (!visible && app?.ticker)
    app.ticker.stop()
}

onMounted(async () => {
  if (!rootRef.value) {
    return
  }
  // 性能：尊重 prefers-reduced-motion，低端机/省电模式跳过重型 Canvas 动效
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    return
  // 性能：requestIdleCallback 延迟初始化，避免阻塞首屏 LCP/INP
  const idle = (cb: () => void) => {
    const ric: any = (window as any).requestIdleCallback
    if (ric)
      ric(cb, { timeout: 1500 })
    else setTimeout(cb, 300)
  }
  await new Promise<void>(resolve => idle(resolve))
  if (!rootRef.value)
    return
  const [{ Application, Container, Graphics, Sprite }, { createNoise3D }] = await Promise.all([
    import('pixi.js'),
    import('simplex-noise'),
  ])
  ApplicationCtor = Application
  ContainerCtor = Container
  GraphicsCtor = Graphics
  SpriteCtor = Sprite
  noise3d = createNoise3D()

  w = window.innerWidth
  h = window.innerHeight

  // 性能：DPR 封顶 2，避免 3x 屏上超大纹理与重绘
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  app = new ApplicationCtor()
  await app.init({
    backgroundAlpha: 0,
    antialias: false,
    resolution: dpr,
    eventMode: 'none',
    autoDensity: true,
    powerPreference: 'low-power' as any,
  })

  rootRef.value.appendChild(app.canvas)
  app.renderer.resize(w, h)

  particles = new ContainerCtor()
  app.stage.addChild(particles)
  dotTexture = createDotTexture(app)
  addPoints()

  tickerFn = () => {
    if (!visible)
      return
    const t = Date.now() / 10000
    for (const p of points) {
      const rad = getForceOnPoint(p.x, p.y, t)
      if (!noise3d)
        continue
      const len = (noise3d(p.x / SCALE, p.y / SCALE, t * 2) + 0.5) * LENGTH
      const nx = p.x + Math.cos(rad) * len
      const ny = p.y + Math.sin(rad) * len
      p.sprite.x = nx
      p.sprite.y = ny
      p.sprite.alpha = (Math.abs(Math.cos(rad)) * 0.8 + 0.2) * p.opacity
    }
  }
  app.ticker.add(tickerFn)
  // 性能：页面不可见时暂停 ticker，节省 CPU/GPU
  document.addEventListener('visibilitychange', onVisibilityChange)
  // 性能：resize 加防抖，避免连续触发 addPoints 与 renderer.resize
  let resizeTimer: ReturnType<typeof setTimeout> | null = null
  const onResizeDebounced = () => {
    if (resizeTimer)
      clearTimeout(resizeTimer)
    resizeTimer = setTimeout(onResize, 120)
  }
  useEventListener(window, 'resize', onResizeDebounced)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  if (rafId)
    cancelAnimationFrame(rafId)
  if (app && tickerFn) {
    try {
      app.ticker.remove(tickerFn)
    }
    catch {}
  }
  tickerFn = null
  try {
    app?.destroy(true, { children: true, texture: true, textureSource: true })
  }
  catch (error) {
    console.error(error)
  }
  app = null
  particles = null
  dotTexture = null
  noise3d = null
  ApplicationCtor = null
  ContainerCtor = null
  GraphicsCtor = null
  SpriteCtor = null
  existingPoints.clear()
  points.length = 0
})
</script>

<template>
  <div
    ref="rootRef"
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 -z-10 overflow-hidden [mask-image:radial-gradient(circle,transparent,black)] opacity-90 dark:opacity-75"
  />
</template>
