export type Category = {
  id: number
  name: string
  slug: string
  description: string | null
  sort_order: number
}

export type Tag = {
  id: number
  name: string
  slug: string
}

export type Article = {
  id: number
  title: string
  slug: string
  summary: string | null
  content?: string
  cover_image: string | null
  status: string
  is_top: boolean
  is_featured: boolean
  view_count: number
  category: Category | null
  tags: Tag[]
  created_at: string
  updated_at?: string
  published_at: string | null
  author_id?: number
}

export type SiteConfigItem = {
  key: string
  value: string
  description: string | null
}

export type UserProfile = {
  id: number
  username: string
  nickname: string
  avatar: string | null
  role: string
  status: string
}

export type PaginatedResponse<T> = {
  total: number
  page: number
  page_size: number
  items: T[]
}

export type Media = {
  id: number
  filename: string
  original_name: string
  url: string
  mime_type: string
  size: number
  uploader_id: number
  created_at: string
}

export type RouteName = 'home' | 'articles' | 'article-detail' | 'projects' | 'about' | 'admin'

export type RouteInfo = {
  name: RouteName
  path: string
  slug?: string
  segments: string[]
}

export type ProjectCard = {
  title: string
  description: string
  stack: string[]
  github: string
  demo: string
}
