import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'

import { defaultProjects, fixedSiteKeys, TOKEN_KEY } from '../constants/site'
import type {
  Article,
  Category,
  Media,
  PaginatedResponse,
  RouteInfo,
  SiteConfigItem,
  Tag,
  UserProfile,
} from '../types/blog'
import { parseRoute } from '../utils/route'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

export function useBlogApp() {
  const route = ref<RouteInfo>(parseRoute(window.location.hash))
  const theme = ref<'light' | 'night'>('light')
  const busy = ref(false)
  const toast = ref('')
  const publicLoading = ref(false)
  const articleLoading = ref(false)
  const adminLoading = ref(false)

  const siteConfigs = ref<SiteConfigItem[]>([])
  const categories = ref<Category[]>([])
  const tags = ref<Tag[]>([])
  const publicArticles = ref<Article[]>([])
  const publicTotal = ref(0)
  const publicPage = ref(1)
  const publicPageSize = 6
  const currentArticle = ref<Article | null>(null)

  const adminToken = ref(localStorage.getItem(TOKEN_KEY) || '')
  const currentUser = ref<UserProfile | null>(null)
  const adminArticles = ref<Article[]>([])
  const adminArticleTotal = ref(0)
  const adminPage = ref(1)
  const adminPageSize = 10
  const adminStatusFilter = ref('')
  const uploadedMedia = ref<Media | null>(null)

  const articleFilters = reactive({
    category: '',
    tag: '',
    keyword: '',
  })

  const loginForm = reactive({
    username: 'admin',
    password: 'Admin123456',
  })

  const articleForm = reactive({
    id: 0,
    title: '',
    slug: '',
    summary: '',
    content: '# 标题\n\n开始写你的内容吧。',
    cover_image: '',
    status: 'draft',
    is_top: false,
    is_featured: false,
    category_id: '' as number | '',
    tag_ids: [] as number[],
  })

  const categoryForm = reactive({
    name: '',
    slug: '',
    description: '',
    sort_order: 0,
  })

  const tagForm = reactive({
    name: '',
    slug: '',
  })

  const siteSettingsForm = ref<SiteConfigItem[]>([])

  const configMap = computed(() =>
    siteConfigs.value.reduce<Record<string, string>>((map, item) => {
      map[item.key] = item.value
      return map
    }, {}),
  )

  const heroArticle = computed(() => featuredArticles.value[0] || publicArticles.value[0] || null)
  const featuredArticles = computed(() => publicArticles.value.filter((item) => item.is_featured || item.is_top).slice(0, 3))
  const recentPosts = computed(() => publicArticles.value.slice(0, 4))
  const techStack = computed(() => {
    const dynamicTags = tags.value.slice(0, 8).map((item) => item.name)
    return dynamicTags.length ? dynamicTags : ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Vue', 'AI Agent']
  })
  const isEditingArticle = computed(() => articleForm.id > 0)
  const pageTitle = computed(() => configMap.value.site_title || 'ToldYou Blog')
  const pageSubtitle = computed(() => configMap.value.site_subtitle || 'Backend / AI / Web Design')
  const homeIntro = computed(() => configMap.value.home_intro || '专注后端工程、AI Agent 与系统设计。')
  const githubUrl = computed(() => configMap.value.github_url || 'https://github.com/example')
  const emailUrl = computed(() => `mailto:${configMap.value.email || 'hello@example.com'}`)
  const totalPublicPages = computed(() => Math.max(1, Math.ceil(publicTotal.value / publicPageSize)))
  const totalAdminPages = computed(() => Math.max(1, Math.ceil(adminArticleTotal.value / adminPageSize)))

  function navigate(path: string) {
    window.location.hash = path
  }

  function updateRoute() {
    route.value = parseRoute(window.location.hash)
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'night' : 'light'
  }

  function resolveMediaUrl(path: string | null | undefined) {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
  }

  function showToast(message: string) {
    toast.value = message
    window.clearTimeout((showToast as typeof showToast & { timer?: number }).timer)
    ;(showToast as typeof showToast & { timer?: number }).timer = window.setTimeout(() => {
      toast.value = ''
    }, 2800)
  }

  function getConfigValue(key: string, fallback = '') {
    return configMap.value[key] || fallback
  }

  function resetArticleForm() {
    articleForm.id = 0
    articleForm.title = ''
    articleForm.slug = ''
    articleForm.summary = ''
    articleForm.content = '# 标题\n\n开始写你的内容吧。'
    articleForm.cover_image = uploadedMedia.value?.url || ''
    articleForm.status = 'draft'
    articleForm.is_top = false
    articleForm.is_featured = false
    articleForm.category_id = ''
    articleForm.tag_ids = []
  }

  function fillArticleForm(article: Article) {
    articleForm.id = article.id
    articleForm.title = article.title
    articleForm.slug = article.slug
    articleForm.summary = article.summary || ''
    articleForm.content = article.content || ''
    articleForm.cover_image = article.cover_image || ''
    articleForm.status = article.status
    articleForm.is_top = article.is_top
    articleForm.is_featured = article.is_featured
    articleForm.category_id = article.category?.id || ''
    articleForm.tag_ids = article.tags.map((item) => item.id)
  }

  async function apiFetch<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
    const headers = new Headers(init.headers || {})
    if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    if (auth && adminToken.value) {
      headers.set('Authorization', `Bearer ${adminToken.value}`)
    }

    const response = await fetch(`${API_BASE}${path}`, { ...init, headers })
    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(payload?.detail || `Request failed with ${response.status}`)
    }
    if (response.status === 204) {
      return undefined as T
    }
    return response.json() as Promise<T>
  }

  function syncSiteSettingsForm() {
    const existing = new Map(siteConfigs.value.map((item) => [item.key, item]))
    const merged = fixedSiteKeys.map((key) => {
      const current = existing.get(key)
      return {
        key,
        value: current?.value || '',
        description: current?.description || '',
      }
    })

    const extras = siteConfigs.value
      .filter((item) => !fixedSiteKeys.includes(item.key))
      .map((item) => ({ ...item, description: item.description || '' }))

    siteSettingsForm.value = [...merged, ...extras]
  }

  async function loadPublicArticles(page = publicPage.value) {
    publicPage.value = page
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(publicPageSize),
    })
    if (articleFilters.category) params.set('category', articleFilters.category)
    if (articleFilters.tag) params.set('tag', articleFilters.tag)
    if (articleFilters.keyword) params.set('keyword', articleFilters.keyword)

    const response = await apiFetch<PaginatedResponse<Article>>(`/api/articles?${params.toString()}`)
    publicArticles.value = response.items
    publicTotal.value = response.total
  }

  async function loadPublicData() {
    publicLoading.value = true
    try {
      const [configRes, categoriesRes, tagsRes] = await Promise.all([
        apiFetch<SiteConfigItem[]>('/api/site/config'),
        apiFetch<Category[]>('/api/categories'),
        apiFetch<Tag[]>('/api/tags'),
      ])
      siteConfigs.value = configRes
      categories.value = categoriesRes
      tags.value = tagsRes
      syncSiteSettingsForm()
      await loadPublicArticles()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '加载公开数据失败')
    } finally {
      publicLoading.value = false
    }
  }

  async function loadArticle(slug: string) {
    articleLoading.value = true
    currentArticle.value = null
    try {
      currentArticle.value = await apiFetch<Article>(`/api/articles/${encodeURIComponent(slug)}`)
    } catch (error) {
      showToast(error instanceof Error ? error.message : '文章加载失败')
    } finally {
      articleLoading.value = false
    }
  }

  async function loadCurrentUser() {
    if (!adminToken.value) {
      currentUser.value = null
      return
    }
    try {
      currentUser.value = await apiFetch<UserProfile>('/api/auth/me', {}, true)
    } catch {
      adminToken.value = ''
      currentUser.value = null
      localStorage.removeItem(TOKEN_KEY)
      showToast('登录已失效，请重新登录')
    }
  }

  async function login() {
    busy.value = true
    try {
      const result = await apiFetch<{ access_token: string; token_type: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      })
      adminToken.value = result.access_token
      localStorage.setItem(TOKEN_KEY, result.access_token)
      await loadCurrentUser()
      await loadAdminData()
      navigate('/admin')
      showToast('登录成功')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '登录失败')
    } finally {
      busy.value = false
    }
  }

  async function logout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' }, true)
    } catch {
      // Ignore logout errors and clear local state.
    }
    adminToken.value = ''
    currentUser.value = null
    localStorage.removeItem(TOKEN_KEY)
    navigate('/')
    showToast('已退出后台')
  }

  async function loadAdminArticles(page = adminPage.value) {
    adminPage.value = page
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(adminPageSize),
    })
    if (adminStatusFilter.value) params.set('status', adminStatusFilter.value)

    const response = await apiFetch<PaginatedResponse<Article>>(`/api/admin/articles?${params.toString()}`, {}, true)
    adminArticles.value = response.items
    adminArticleTotal.value = response.total
  }

  async function loadAdminArticle(id: number) {
    const article = await apiFetch<Article>(`/api/admin/articles/${id}`, {}, true)
    fillArticleForm(article)
  }

  async function loadAdminData() {
    if (!adminToken.value) return
    adminLoading.value = true
    try {
      const [configRes, categoriesRes, tagsRes] = await Promise.all([
        apiFetch<SiteConfigItem[]>('/api/site/config'),
        apiFetch<Category[]>('/api/categories'),
        apiFetch<Tag[]>('/api/tags'),
      ])
      siteConfigs.value = configRes
      categories.value = categoriesRes
      tags.value = tagsRes
      syncSiteSettingsForm()
      await loadAdminArticles(1)
    } catch (error) {
      showToast(error instanceof Error ? error.message : '后台数据加载失败')
    } finally {
      adminLoading.value = false
    }
  }

  async function saveArticle() {
    busy.value = true
    try {
      const payload = {
        title: articleForm.title,
        slug: articleForm.slug || null,
        summary: articleForm.summary || null,
        content: articleForm.content,
        cover_image: articleForm.cover_image || null,
        status: articleForm.status,
        is_top: articleForm.is_top,
        is_featured: articleForm.is_featured,
        category_id: articleForm.category_id || null,
        tag_ids: articleForm.tag_ids,
      }

      const articleId = articleForm.id
      const result = articleId
        ? await apiFetch<Article>(`/api/admin/articles/${articleId}`, { method: 'PUT', body: JSON.stringify(payload) }, true)
        : await apiFetch<Article>('/api/admin/articles', { method: 'POST', body: JSON.stringify(payload) }, true)

      fillArticleForm(result)
      await Promise.all([loadPublicArticles(1), loadAdminArticles(articleId ? adminPage.value : 1)])
      navigate(`/admin/articles/${result.id}`)
      showToast(articleId ? '文章已更新' : '文章已创建')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '保存文章失败')
    } finally {
      busy.value = false
    }
  }

  async function deleteCurrentArticle() {
    if (!articleForm.id) return
    busy.value = true
    try {
      await apiFetch(`/api/admin/articles/${articleForm.id}`, { method: 'DELETE' }, true)
      resetArticleForm()
      await Promise.all([loadPublicArticles(1), loadAdminArticles(adminPage.value)])
      navigate('/admin/articles')
      showToast('文章已删除')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '删除失败')
    } finally {
      busy.value = false
    }
  }

  async function createCategory() {
    busy.value = true
    try {
      await apiFetch<Category>(
        '/api/admin/categories',
        {
          method: 'POST',
          body: JSON.stringify({
            name: categoryForm.name,
            slug: categoryForm.slug || null,
            description: categoryForm.description || null,
            sort_order: categoryForm.sort_order,
          }),
        },
        true,
      )
      categoryForm.name = ''
      categoryForm.slug = ''
      categoryForm.description = ''
      categoryForm.sort_order = 0
      await loadPublicData()
      if (adminToken.value) await loadAdminArticles(adminPage.value)
      showToast('分类已创建')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '创建分类失败')
    } finally {
      busy.value = false
    }
  }

  async function createTag() {
    busy.value = true
    try {
      await apiFetch<Tag>(
        '/api/admin/tags',
        {
          method: 'POST',
          body: JSON.stringify({
            name: tagForm.name,
            slug: tagForm.slug || null,
          }),
        },
        true,
      )
      tagForm.name = ''
      tagForm.slug = ''
      await loadPublicData()
      if (adminToken.value) await loadAdminArticles(adminPage.value)
      showToast('标签已创建')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '创建标签失败')
    } finally {
      busy.value = false
    }
  }

  async function saveSiteSettings() {
    busy.value = true
    try {
      const payload = {
        items: siteSettingsForm.value.map((item) => ({
          key: item.key,
          value: item.value,
          description: item.description || null,
        })),
      }
      siteConfigs.value = await apiFetch<SiteConfigItem[]>(
        '/api/admin/site/config',
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        },
        true,
      )
      syncSiteSettingsForm()
      showToast('站点配置已更新')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '保存配置失败')
    } finally {
      busy.value = false
    }
  }

  async function uploadImage(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files?.length) return
    busy.value = true
    try {
      const formData = new FormData()
      formData.append('file', input.files[0])
      uploadedMedia.value = await apiFetch<Media>(
        '/api/admin/upload/image',
        {
          method: 'POST',
          body: formData,
        },
        true,
      )
      articleForm.cover_image = uploadedMedia.value.url
      showToast('图片上传成功，已填入封面地址')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '图片上传失败')
    } finally {
      busy.value = false
      input.value = ''
    }
  }

  function toggleTag(id: number) {
    if (articleForm.tag_ids.includes(id)) {
      articleForm.tag_ids = articleForm.tag_ids.filter((item) => item !== id)
    } else {
      articleForm.tag_ids = [...articleForm.tag_ids, id]
    }
  }

  function setPublicFilter(type: 'category' | 'tag', value: string) {
    if (type === 'category') articleFilters.category = articleFilters.category === value ? '' : value
    if (type === 'tag') articleFilters.tag = articleFilters.tag === value ? '' : value
    navigate('/articles')
  }

  watch(
    () => route.value.path,
    async (path) => {
      if (path === '/articles') {
        await loadPublicArticles(1)
        return
      }

      if (route.value.name === 'article-detail' && route.value.slug) {
        await loadArticle(route.value.slug)
        return
      }

      if (route.value.name === 'admin') {
        await loadCurrentUser()
        if (adminToken.value) {
          await loadAdminData()
          if (route.value.path === '/admin/articles/new') {
            resetArticleForm()
          } else {
            const editMatch = route.value.path.match(/^\/admin\/articles\/(\d+)$/)
            if (editMatch) {
              await loadAdminArticle(Number(editMatch[1]))
            }
          }
        }
      }
    },
  )

  onMounted(async () => {
    window.addEventListener('hashchange', updateRoute)
    await loadPublicData()
    if (adminToken.value) {
      await loadCurrentUser()
    }
    if (route.value.name === 'article-detail' && route.value.slug) {
      await loadArticle(route.value.slug)
    }
    if (route.value.name === 'admin' && adminToken.value) {
      await loadAdminData()
    }
  })

  onUnmounted(() => {
    window.removeEventListener('hashchange', updateRoute)
  })

  return {
    API_BASE,
    adminArticles,
    adminArticleTotal,
    adminLoading,
    adminPage,
    adminStatusFilter,
    adminToken,
    articleFilters,
    articleForm,
    articleLoading,
    busy,
    categories,
    categoryForm,
    configMap,
    currentArticle,
    currentUser,
    defaultProjects,
    deleteCurrentArticle,
    emailUrl,
    featuredArticles,
    getConfigValue,
    githubUrl,
    heroArticle,
    homeIntro,
    isEditingArticle,
    loadAdminArticles,
    loadPublicArticles,
    login,
    loginForm,
    logout,
    navigate,
    pageSubtitle,
    pageTitle,
    publicArticles,
    publicLoading,
    publicPage,
    publicTotal,
    recentPosts,
    resolveMediaUrl,
    route,
    saveArticle,
    saveSiteSettings,
    setPublicFilter,
    showToast,
    siteConfigs,
    siteSettingsForm,
    tags,
    tagForm,
    techStack,
    theme,
    toast,
    toggleTag,
    toggleTheme,
    totalAdminPages,
    totalPublicPages,
    uploadedMedia,
    uploadImage,
    createCategory,
    createTag,
  }
}

export type BlogAppContext = ReturnType<typeof useBlogApp>
