<script setup lang="ts">
interface Point {
  x: number
  y: number
  opacity: number
  sprite: import('pixi.js').Sprite
}

const rootRef = ref<HTMLDivElement | null>(null)

const SCALE = 200
const LENGTH = 5
const SPACING = 15

let noise3d: ReturnType<typeof import('simplex-noise')['createNoise3D']> | null = null
const existingPoints = new Set<string>()
const points: Point[] = []

let w = 0
let h = 0
let app: import('pixi.js').Application | null = null
let particles: import('pixi.js').Container | null = null
let dotTexture: import('pixi.js').Texture | null = null
let SpriteCtor: typeof import('pixi.js')['Sprite'] | null = null
let ContainerCtor: typeof import('pixi.js')['Container'] | null = null
let GraphicsCtor: typeof import('pixi.js')['Graphics'] | null = null
let ApplicationCtor: typeof import('pixi.js')['Application'] | null = null

function getForceOnPoint(x: number, y: number, z: number) {
  if (!noise3d) {
    return 0
  }
  return (noise3d(x / SCALE, y / SCALE, z) - 0.5) * 2 * Math.PI
}

function createDotTexture(rendererApp: import('pixi.js').Application) {
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

onMounted(async () => {
  if (!rootRef.value) {
    return
  }
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

  app = new ApplicationCtor()
  await app.init({
    backgroundAlpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    eventMode: 'none',
    autoDensity: true,
  })

  rootRef.value.appendChild(app.canvas)
  app.renderer.resize(w, h)

  particles = new ContainerCtor()
  app.stage.addChild(particles)
  dotTexture = createDotTexture(app)
  addPoints()

  app.ticker.add(() => {
    const t = Date.now() / 10000

    for (const p of points) {
      const rad = getForceOnPoint(p.x, p.y, t)
      if (!noise3d) {
        continue
      }
      const len = (noise3d(p.x / SCALE, p.y / SCALE, t * 2) + 0.5) * LENGTH
      const nx = p.x + Math.cos(rad) * len
      const ny = p.y + Math.sin(rad) * len

      p.sprite.x = nx
      p.sprite.y = ny
      p.sprite.alpha = (Math.abs(Math.cos(rad)) * 0.8 + 0.2) * p.opacity
    }
  })

  useEventListener(window, 'resize', onResize)
})

onBeforeUnmount(() => {
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
})
</script>

<template>
  <div
    ref="rootRef"
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 -z-10 overflow-hidden [mask-image:radial-gradient(circle,transparent,black)] opacity-90 dark:opacity-75"
  />
</template>
