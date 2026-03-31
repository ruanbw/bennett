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
    onRequest({ options }) {
      // 确保 headers 对象存在
      if (!options.headers) {
        options.headers = new Headers()
      }
      // 如果 headers 是 Headers 对象，使用 set 方法；否则转换为 Headers
      if (options.headers instanceof Headers) {
        options.headers.set('Authorization', 'Bearer token')
      }
      else {
        const headers = new Headers(options.headers)
        headers.set('Authorization', 'Bearer token')
        options.headers = headers
      }
    },
    onResponse({ response }) {
      // do something with the response
      console.log('onResponse', response._data)
      return response._data
    },
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
