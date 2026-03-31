import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'

/**
 * 是否为开发环境
 */
const isDev = process.env.NODE_ENV === 'production'

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
    defaultLocale: 'zh-cn',
    locales: [
      { code: 'zh', language: 'zh-CN', name: 'Chinese (简体中文)', file: 'zh.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root', // 或 'no-prefix'
      fallbackLocale: 'zh-cn',
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
  },
  image: {
    domains: ['avatars.githubusercontent.com'],
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
        { rel: 'preconnect', href: siteUrl, crossorigin: '' },
        { rel: 'dns-prefetch', href: siteUrl },
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
    public: {
      apiBase: '/api',
    },
  },
  sourcemap: isDev ? { client: true, server: true } : true,
  vite: {
    optimizeDeps: {
      include: ['pixi.js', 'simplex-noise'],
    },
    esbuild: {
      drop: isDev ? ['console', 'debugger'] : undefined,
    },
    build: {
      sourcemap: isDev,
    },
    // tailwindcss() 返回的插件类型在当前依赖组合下与 Vite 的类型不完全匹配（纯类型问题）。
    // 这里做类型断言以避免 TS/IDE 报错，不影响运行时行为。
    plugins: tailwindcss() as any,
  },
})
