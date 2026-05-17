import { inject, type InjectionKey } from 'vue'

import type { BlogAppContext } from './composables/useBlogApp'

export const blogAppKey: InjectionKey<BlogAppContext> = Symbol('blog-app')

export function useBlogAppContext() {
  const app = inject(blogAppKey)
  if (!app) {
    throw new Error('Blog app context is not available')
  }
  return app
}
