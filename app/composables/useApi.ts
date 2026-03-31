import type { UseFetchOptions } from 'nuxt/app'

/**
 * 使用 API
 * @param url - 请求 URL
 * @param options - 请求选项
 * @returns 请求数据
 */
export function useApi<T>(
  url: string | (() => string),
  options?: UseFetchOptions<T>,
) {
  const nuxtApp = useNuxtApp()
  return useFetch(url, {
    ...options,
    $fetch: nuxtApp.$api,
  })
}
