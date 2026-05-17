import type { RouteInfo } from '../types/blog'

export function parseRoute(hash: string): RouteInfo {
  const path = hash.replace(/^#/, '') || '/'
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const segments = cleanPath.split('/').filter(Boolean)

  if (cleanPath === '/') return { name: 'home', path: cleanPath, segments: [] }
  if (cleanPath === '/articles') return { name: 'articles', path: cleanPath, segments }
  if (segments[0] === 'articles' && segments[1]) {
    return { name: 'article-detail', path: cleanPath, slug: decodeURIComponent(segments[1]), segments }
  }
  if (cleanPath === '/projects') return { name: 'projects', path: cleanPath, segments }
  if (cleanPath === '/about') return { name: 'about', path: cleanPath, segments }
  if (segments[0] === 'admin') return { name: 'admin', path: cleanPath, segments: ['admin', ...segments.slice(1)] }
  return { name: 'home', path: '/', segments: [] }
}
