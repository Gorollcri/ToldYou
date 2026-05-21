import type { RouteInfo } from '../types/blog'

export function parseRoute(hash: string): RouteInfo {
  const path = hash.replace(/^#/, '') || '/login'
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const segments = cleanPath.split('/').filter(Boolean)

  if (cleanPath === '/login') return { name: 'login', path: cleanPath, segments }
  if (cleanPath === '/') return { name: 'home', path: cleanPath, segments: [] }
  if (cleanPath === '/articles') return { name: 'articles', path: cleanPath, segments }
  if (segments[0] === 'articles' && segments[1]) {
    return { name: 'article-detail', path: cleanPath, slug: decodeURIComponent(segments[1]), segments }
  }
  if (cleanPath === '/projects') return { name: 'projects', path: cleanPath, segments }
  if (cleanPath === '/about') return { name: 'about', path: cleanPath, segments }
  if (cleanPath === '/me') return { name: 'me', path: cleanPath, segments }
  if (cleanPath === '/me/profile') return { name: 'me-profile', path: cleanPath, segments }
  if (cleanPath === '/me/password') return { name: 'me-password', path: cleanPath, segments }
  if (cleanPath === '/me/articles') return { name: 'me-articles', path: cleanPath, segments }
  if (cleanPath === '/me/articles/new') return { name: 'me-article-new', path: cleanPath, segments }
  if (segments[0] === 'me' && segments[1] === 'articles' && segments[2] && /^\d+$/.test(segments[2])) {
    return { name: 'me-article-detail', path: cleanPath, articleId: Number(segments[2]), segments }
  }
  if (segments[0] === 'admin') {
    const route: RouteInfo = { name: 'admin', path: cleanPath, segments }
    const userMatch = cleanPath.match(/^\/admin\/users\/(\d+)$/)
    const articleMatch = cleanPath.match(/^\/admin\/articles\/(\d+)$/)
    if (userMatch) route.userId = Number(userMatch[1])
    if (articleMatch) route.articleId = Number(articleMatch[1])
    return route
  }
  return { name: 'login', path: '/login', segments: ['login'] }
}
