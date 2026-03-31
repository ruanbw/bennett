import { registerLoadingDirective } from '~/components/rs-loading/directive'

/**
 * 注册 vue 全局指令
 */
export default defineNuxtPlugin((app) => {
    const vueApp = app.vueApp
    // 注册 loading 指令
    registerLoadingDirective(vueApp)
})
