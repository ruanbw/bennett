export default defineNuxtPlugin((nuxtApp) => {
  // 对于 Nuxt API 路由，不需要设置 baseURL，Nuxt 会自动处理相对路径
  // 如果需要请求外部 API，可以在这里设置 baseURL
  const config = useRuntimeConfig()

  /**
   * 获取 baseURL
   */
  const apiBase = config.public.apiBase

  const api = $fetch.create({
    baseURL: apiBase,
    async onResponseError({ response }) {
      if (response.status === 401) {
        await nuxtApp.runWithContext(() => navigateTo('/login'))
      }
    },
  })

  // Expose to useNuxtApp().$api
  return {
    provide: {
      api,
    },
  }
})
