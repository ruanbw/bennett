// `nuxt/kit` is a helper subpath import you can use when defining local modules
// that means you do not need to add `@nuxt/kit` to your project's dependencies
import { addImports, createResolver, defineNuxtModule } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'count',
  },
  setup() {
    const resolver = createResolver(import.meta.url)

    const name = 'useCount'

    addImports({
      name,
      as: name,
      from: resolver.resolve(`./runtime/composables/${name}`),
    })
  },
})
