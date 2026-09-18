import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'

const isProd = process.env.NODE_ENV === 'production'
const isDev = !isProd

// Used by nuxt-i18n to generate correct SEO links (canonical/hreflang).
// 生产域名暂定 Vercel：https://bennett-website.vercel.app/
// 如需覆盖：NUXT_PUBLIC_SITE_URL=https://example.com pnpm build
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL ?? 'https://bennett-website.vercel.app'
const siteName = 'Bennett - 前端工程化与 Nuxt 实战'
const siteDescription = 'Bennett 的个人站：关注前端工程化、Vue/Nuxt 性能优化与开发者体验，分享实战博客与开源项目。'

// Google Fonts：非阻塞加载（preload + print 媒体切换），避免阻塞首屏渲染；display=swap 避免 FOIT
const googleFontsUrl = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap'

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
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
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
    name: siteName,
    description: siteDescription,
    defaultLocale: 'zh-CN',
  },
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    defaults: {
      changefreq: 'weekly',
      priority: 0.8,
    },
  },
  robots: {
    sitemap: [`${siteUrl}/sitemap.xml`],
  },
  app: {
    head: {
      titleTemplate: '%s · Bennett',
      htmlAttrs: {
        lang: 'zh-CN',
      },
      meta: [
        { name: 'description', content: siteDescription },
        { name: 'keywords', content: 'Bennett,前端,Vue,Nuxt,SSR,性能优化,开源,前端工程化' },
        { name: 'robots', content: 'index, follow, max-image-preview:large' },
        { name: 'theme-color', content: '#ffffff' },
        { name: 'author', content: 'Bennett' },
        // og
        { property: 'og:site_name', content: 'Bennett' },
        { property: 'og:title', content: siteName },
        { property: 'og:description', content: siteDescription },
        { property: 'og:image', content: `${siteUrl}/og-image.png` },
        { property: 'og:url', content: siteUrl },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'zh_CN' },
        { property: 'og:locale:alternate', content: 'en_US' },
        // twitter（注意用 name，不是 property）
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: siteName },
        { name: 'twitter:description', content: siteDescription },
        { name: 'twitter:image', content: `${siteUrl}/og-image.png` },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.ico' },
        { rel: 'alternate', type: 'application/rss+xml', title: `${siteName} RSS`, href: `${siteUrl}/rss.xml` },
        // Google Fonts 性能优化：preconnect + dns-prefetch 减少握手耗时
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
        { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
        // 字体：非阻塞加载 —— preload 预热 + media=print 按需应用，避免阻塞首屏渲染
        { rel: 'preload', as: 'style', href: googleFontsUrl },
        { rel: 'stylesheet', href: googleFontsUrl, media: 'print', onload: 'this.media=\'all\'' },
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
      // 性能：去掉 out-in，避免新页面等待旧页面 300ms 离场动画，体感更快
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
      // OgImage 模板（app/components/OgImage/Introduction.takumi.vue）读取的站点信息
      siteTitle: siteName,
      siteDescription,
      siteKeywords: ['前端', 'Vue', 'Nuxt', 'SSR', '性能优化', '开源', '前端工程化'],
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
    '/projects': { prerender: true },
    '/projects/**': { prerender: true, isr: 3600 },
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
      // 性能：pixi（约 830k）只在背景动效初始化时按需加载，不计入首屏；
      // 注意不要用 manualChunks 强行拆 pixi——实测 Rolldown 会把动态 import 的 helper 经由该分包 re-export，
      // 在背景块与 pixi 块之间制造静态依赖边，导致首屏 modulepreload 整个 pixi。默认异步分包无此问题。
      // 阈值放宽至 900 只是为了屏蔽该已知懒加载大块的警告。
      chunkSizeWarningLimit: 900,
      cssCodeSplit: true,
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
