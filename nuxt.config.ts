import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'

const isProd = process.env.NODE_ENV === 'production'
const isDev = !isProd

// Used by nuxt-i18n to generate correct SEO links (canonical/hreflang).
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL ?? 'http://192.168.0.101:4100'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devServer: {
    port: 4100, // 开发服务器端口
    host: '0.0.0.0', // 监听所有网卡，可选
  },
  content: {
    // Node 22+ 使用 node:sqlite，避免 better-sqlite3 原生编译在 pnpm 下未执行 install 脚本
    experimental: {
      sqliteConnector: 'native',
    },
    build: {
      markdown: {
        highlight: {
          theme: {
            default: 'github-light',
            dark: 'github-dark',
          },
        },
      },
    },
  },
  modules: [
    '@nuxt/content',
    // vueuse
    '@vueuse/nuxt',
    // pinia
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxt/icon',
    // nuxt/image
    '@nuxt/image',
    'nuxt-og-image',
    '@nuxtjs/i18n',
    'shadcn-nuxt',
  ],
  i18n: {
    baseUrl: siteUrl,
    strategy: 'no_prefix',
    langDir: '../locales/',
    defaultLocale: 'zh',
    locales: [
      { code: 'zh', language: 'zh-CN', name: 'Chinese (简体中文)', file: 'zh.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root', // 或 'no-prefix'
      fallbackLocale: 'zh',
    },
  },
  // shadcn: {
  //   /**
  //    * Prefix for all the imported component.
  //    * @default "Ui"
  //    */
  //   prefix: '',
  //   /**
  //    * Directory that the component lives in.
  //    * Will respect the Nuxt aliases.
  //    * @link https://nuxt.com/docs/api/nuxt-config#alias
  //    * @default "@/components/ui"
  //    */
  //   componentDir: '@/components/ui',
  // },
  icon: {
    serverBundle: {
      collections: ['carbon', 'mdi', 'simple-icons'],
    },
    clientBundle: {
      // 扫描源码 + 显式声明：避免 SSR 时 Icon 需走 /api/_nuxt_icon 而报 failed to load
      scan: true,
      icons: [
        'carbon:renew',
        'carbon:download',
        'carbon:calendar-heat-map',
        'carbon:calendar',
        'carbon:arrow-up-right',
        'carbon:checkmark',
        'carbon:information',
        'carbon:warning',
        'carbon:error',
        'carbon:circle-dash',
        'carbon:close',
        'carbon:chevron-down',
        'carbon:chevron-up',
        'carbon:star-filled',
        'carbon:user',
        'carbon:group',
      ],
    },
  },
  css: ['~/assets/css/main.css', '~/assets/css/tailwindcss.css'],
  site: {
    url: siteUrl,
    name: 'Site Name',
  },
  app: {
    head: {
      meta: [
        { name: 'title', content: 'Site Name' },
        { name: 'description', content: 'Site Description' },
        // og
        { property: 'og:title', content: 'Site Name' },
        { property: 'og:description', content: 'Site Description' },
        { property: 'og:image', content: '/og-image.png' },
        { property: 'og:url', content: siteUrl },
        { property: 'og:type', content: 'website' },
        // og:twitter
        { property: 'og:twitter:card', content: 'summary_large_image' },
        { property: 'og:twitter:title', content: 'Site Name' },
        { property: 'og:twitter:description', content: 'Site Description' },
        { property: 'og:twitter:image', content: '/og-image.png' },
        { property: 'og:twitter:url', content: siteUrl },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.ico' },
        // Google Fonts 性能优化：preconnect + dns-prefetch 减少握手耗时
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
        { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
        // 字体：替代 GithubProfileCard 中阻塞渲染的 @import，按需加载 + display=swap
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap' },
      ],
      script: [
        {
          key: 'theme-init',
          innerHTML: `(function(){try{var key='vueuse-color-scheme';var mode=localStorage.getItem(key);var dark=mode?mode==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var root=document.documentElement;root.classList.toggle('dark',dark);root.style.colorScheme=dark?'dark':'light'}catch(_){}})();`,
        },
      ],
    },
    pageTransition: {
      name: 'page',
      mode: 'out-in',
    },
  },
  runtimeConfig: {
    /** 服务器端 GitHub PAT，用于提高 API 限额（可选，对应环境变量 NUXT_GITHUB_TOKEN） */
    githubToken: '',
    /** NPM 统计：维护者用户名（默认 ruanbw，对应 NUXT_NPM_MAINTAINER） */
    npmMaintainer: '',
    /** NPM 组织 scope（可选，如 bennett 对应 @bennett，对应 NUXT_NPM_ORG） */
    npmOrg: '',
    /** NPM 白名单，逗号分隔，兜底展示（对应 NUXT_NPM_PACKAGES） */
    npmPackages: '',
    public: {
      apiBase: '/api',
    },
  },
  // 性能：仅开发环境开启 sourcemap，生产环境关闭以减小体积并避免源码泄露
  sourcemap: isDev,
  experimental: {
    payloadExtraction: true,
    treeshakeClientOnly: true,
    renderJsonPayloads: true,
    inlineRouteRules: true,
    viewTransition: true,
    // 性能：客户端组件仅在客户端渲染时才包含其 JS（减少首屏）
    clientFallback: true,
  },
  nitro: {
    compressPublicAssets: {
      gzip: true,
      brotli: true,
    },
    minify: true,
  },
  // 性能：路由级缓存与预渲染
  routeRules: {
    '/': { prerender: true },
    '/blogs': { prerender: true },
    '/blogs/**': { prerender: true, isr: 3600 },
    '/api/github/**': {
      cache: { maxAge: 60 * 10, swr: true },
      headers: { 'cache-control': 'public, s-maxage=600, stale-while-revalidate=60' },
    },
    '/api/npm/**': {
      cache: { maxAge: 60 * 60, swr: true },
      headers: { 'cache-control': 'public, s-maxage=3600, stale-while-revalidate=600' },
    },
  },
  image: {
    domains: ['avatars.githubusercontent.com'],
    quality: 80,
    format: ['avif', 'webp', 'jpeg'],
    densities: [1, 2],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },
  vite: {
    optimizeDeps: {
      include: ['pixi.js', 'simplex-noise'],
      exclude: ['@nuxt/content'],
    },
    build: {
      sourcemap: isDev,
      // 性能：pixi 懒加载块约 830k，单独拆包后不计入首屏，阈值放宽至 900 避免误报
      chunkSizeWarningLimit: 900,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/pixi.js') || id.includes('simplex-noise'))
              return 'pixi'
            if (id.includes('node_modules/swiper'))
              return 'swiper'
            if (id.includes('node_modules/sweetalert2'))
              return 'sweetalert2'
          },
        },
      },
    },
    oxc: {
      // 性能：生产环境移除 console/debugger
      ...(isProd ? { drop: ['console', 'debugger'] } : {}),
    } as any,
    // tailwindcss() 返回的插件类型在当前依赖组合下与 Vite 的类型不完全匹配（纯类型问题）。
    // 这里做类型断言以避免 TS/IDE 报错，不影响运行时行为。
    plugins: tailwindcss() as any,
  },
})
