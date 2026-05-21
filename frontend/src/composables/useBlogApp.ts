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
  UserRecord,
} from '../types/blog'
import { parseRoute } from '../utils/route'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

export function useBlogApp() {
  const route = ref<RouteInfo>(parseRoute(window.location.hash))
  const theme = ref<'light' | 'night'>('light')
  const busy = ref(false)
  const toast = ref('')
  const authReady = ref(false)
  const suppressLoginRedirect = ref(false)
  const publicLoading = ref(false)
  const articleLoading = ref(false)
  const adminLoading = ref(false)
  const meLoading = ref(false)
  const usersLoading = ref(false)

  const siteConfigs = ref<SiteConfigItem[]>([])
  const categories = ref<Category[]>([])
  const tags = ref<Tag[]>([])
  const publicArticles = ref<Article[]>([])
  const publicTotal = ref(0)
  const publicPage = ref(1)
  const publicPageSize = 6
  const currentArticle = ref<Article | null>(null)

  const authToken = ref(localStorage.getItem(TOKEN_KEY) || '')
  const currentUser = ref<UserProfile | null>(null)

  const myArticles = ref<Article[]>([])
  const myArticleTotal = ref(0)
  const myPage = ref(1)
  const myPageSize = 10
  const myStatusFilter = ref('')

  const adminArticles = ref<Article[]>([])
  const adminArticleTotal = ref(0)
  const adminPage = ref(1)
  const adminPageSize = 10
  const adminStatusFilter = ref('')

  const adminUsers = ref<UserRecord[]>([])
  const adminUserTotal = ref(0)
  const adminUsersPage = ref(1)
  const adminUsersPageSize = 10

  const uploadedMedia = ref<Media | null>(null)

  const articleFilters = reactive({
    category: '',
    tag: '',
    keyword: '',
  })

  const loginForm = reactive({
    username: '',
    password: '',
  })

  const articleForm = reactive({
    id: 0,
    title: '',
    slug: '',
    summary: '',
    content: '# Title\n\nStart writing here.',
    cover_image: '',
    status: 'draft',
    is_top: false,
    is_featured: false,
    category_id: '' as number | '',
    tag_ids: [] as number[],
  })

  const profileForm = reactive({
    nickname: '',
    avatar: '',
    bio: '',
  })

  const passwordForm = reactive({
    current_password: '',
    new_password: '',
  })

  const adminUserForm = reactive({
    id: 0,
    username: '',
    nickname: '',
    avatar: '',
    bio: '',
    role: 'member',
    status: 'active',
    password: '',
  })

  const adminUserPasswordForm = reactive({
    password: '',
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

  const isAuthenticated = computed(() => Boolean(currentUser.value))
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isMember = computed(() => currentUser.value?.role === 'member')
  const heroArticle = computed(() => featuredArticles.value[0] || publicArticles.value[0] || null)
  const featuredArticles = computed(() => publicArticles.value.filter((item) => item.is_featured || item.is_top).slice(0, 3))
  const recentPosts = computed(() => publicArticles.value.slice(0, 4))
  const techStack = computed(() => {
    const dynamicTags = tags.value.slice(0, 8).map((item) => item.name)
    return dynamicTags.length ? dynamicTags : ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Vue', 'AI Agent']
  })
  const isEditingArticle = computed(() => articleForm.id > 0)
  const isEditingAdminUser = computed(() => adminUserForm.id > 0)
  const pageTitle = computed(() => configMap.value.site_title || 'ToldYou')
  const pageSubtitle = computed(() => configMap.value.site_subtitle || 'Private content system')
  const homeIntro = computed(() => configMap.value.home_intro || 'A private content system for invited users.')
  const githubUrl = computed(() => configMap.value.github_url || 'https://github.com/example')
  const emailUrl = computed(() => `mailto:${configMap.value.email || 'hello@example.com'}`)
  const totalPublicPages = computed(() => Math.max(1, Math.ceil(publicTotal.value / publicPageSize)))
  const totalAdminPages = computed(() => Math.max(1, Math.ceil(adminArticleTotal.value / adminPageSize)))
  const totalMyPages = computed(() => Math.max(1, Math.ceil(myArticleTotal.value / myPageSize)))
  const totalAdminUserPages = computed(() => Math.max(1, Math.ceil(adminUserTotal.value / adminUsersPageSize)))

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

  function clearSession(showMessage = false) {
    authToken.value = ''
    currentUser.value = null
    localStorage.removeItem(TOKEN_KEY)
    if (showMessage) showToast('Session expired. Please sign in again.')
  }

  function syncProfileForm() {
    profileForm.nickname = currentUser.value?.nickname || ''
    profileForm.avatar = currentUser.value?.avatar || ''
    profileForm.bio = currentUser.value?.bio || ''
  }

  function resetArticleForm() {
    articleForm.id = 0
    articleForm.title = ''
    articleForm.slug = ''
    articleForm.summary = ''
    articleForm.content = '# Title\n\nStart writing here.'
    articleForm.cover_image = ''
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

  function resetAdminUserForm() {
    adminUserForm.id = 0
    adminUserForm.username = ''
    adminUserForm.nickname = ''
    adminUserForm.avatar = ''
    adminUserForm.bio = ''
    adminUserForm.role = 'member'
    adminUserForm.status = 'active'
    adminUserForm.password = ''
    adminUserPasswordForm.password = ''
  }

  function fillAdminUserForm(user: UserRecord) {
    adminUserForm.id = user.id
    adminUserForm.username = user.username
    adminUserForm.nickname = user.nickname
    adminUserForm.avatar = user.avatar || ''
    adminUserForm.bio = user.bio || ''
    adminUserForm.role = user.role
    adminUserForm.status = user.status
    adminUserForm.password = ''
    adminUserPasswordForm.password = ''
  }

  async function apiFetch<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
    const headers = new Headers(init.headers || {})
    if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    if (auth && authToken.value) {
      headers.set('Authorization', `Bearer ${authToken.value}`)
    }

    const response = await fetch(`${API_BASE}${path}`, { ...init, headers })
    if (!response.ok) {
      if (auth && response.status === 401) {
        clearSession(true)
        navigate('/login')
      }
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

    const response = await apiFetch<PaginatedResponse<Article>>(`/api/articles?${params.toString()}`, {}, true)
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
      await loadPublicArticles(1)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load content')
    } finally {
      publicLoading.value = false
    }
  }

  async function loadArticle(slug: string) {
    articleLoading.value = true
    currentArticle.value = null
    try {
      currentArticle.value = await apiFetch<Article>(`/api/articles/${encodeURIComponent(slug)}`, {}, true)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load article')
    } finally {
      articleLoading.value = false
    }
  }

  async function loadCurrentUser() {
    if (!authToken.value) {
      currentUser.value = null
      return
    }
    currentUser.value = await apiFetch<UserProfile>('/api/auth/me', {}, true)
    syncProfileForm()
  }

  function setLoginRedirectSuppressed(value: boolean) {
    suppressLoginRedirect.value = value
  }

  async function login(options: { redirect?: boolean } = {}) {
    const { redirect = true } = options
    busy.value = true
    try {
      const result = await apiFetch<{ access_token: string; token_type: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      })
      authToken.value = result.access_token
      localStorage.setItem(TOKEN_KEY, result.access_token)
      await loadCurrentUser()
      await loadPublicData()
      if (redirect) {
        navigate('/')
      }
      showToast('Signed in successfully')
      return true
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Sign in failed')
      return false
    } finally {
      busy.value = false
    }
  }

  async function logout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' }, true)
    } catch {
      // Ignore logout errors.
    }
    clearSession(false)
    navigate('/login')
    showToast('Signed out')
  }

  async function updateMyProfile() {
    busy.value = true
    try {
      currentUser.value = await apiFetch<UserProfile>(
        '/api/auth/me/profile',
        {
          method: 'PUT',
          body: JSON.stringify({
            nickname: profileForm.nickname,
            avatar: profileForm.avatar || null,
            bio: profileForm.bio || null,
          }),
        },
        true,
      )
      syncProfileForm()
      showToast('Profile updated')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      busy.value = false
    }
  }

  async function changeMyPassword() {
    busy.value = true
    try {
      await apiFetch(
        '/api/auth/me/password',
        {
          method: 'PUT',
          body: JSON.stringify({
            current_password: passwordForm.current_password,
            new_password: passwordForm.new_password,
          }),
        },
        true,
      )
      passwordForm.current_password = ''
      passwordForm.new_password = ''
      showToast('Password updated. Please sign in again.')
      await logout()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update password')
    } finally {
      busy.value = false
    }
  }

  async function loadMyArticles(page = myPage.value) {
    myPage.value = page
    meLoading.value = true
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(myPageSize),
      })
      if (myStatusFilter.value) params.set('status', myStatusFilter.value)
      const response = await apiFetch<PaginatedResponse<Article>>(`/api/me/articles?${params.toString()}`, {}, true)
      myArticles.value = response.items
      myArticleTotal.value = response.total
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load your articles')
    } finally {
      meLoading.value = false
    }
  }

  async function loadMyArticle(id: number) {
    meLoading.value = true
    try {
      const article = await apiFetch<Article>(`/api/me/articles/${id}`, {}, true)
      fillArticleForm(article)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load your article')
      navigate('/me/articles')
    } finally {
      meLoading.value = false
    }
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

  async function loadAdminUsers(page = adminUsersPage.value) {
    adminUsersPage.value = page
    usersLoading.value = true
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(adminUsersPageSize),
      })
      const response = await apiFetch<PaginatedResponse<UserRecord>>(`/api/admin/users?${params.toString()}`, {}, true)
      adminUsers.value = response.items
      adminUserTotal.value = response.total
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load users')
    } finally {
      usersLoading.value = false
    }
  }

  async function loadAdminUser(id: number) {
    usersLoading.value = true
    try {
      const user = await apiFetch<UserRecord>(`/api/admin/users/${id}`, {}, true)
      fillAdminUserForm(user)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load user')
      navigate('/admin/users')
    } finally {
      usersLoading.value = false
    }
  }

  async function loadAdminData() {
    adminLoading.value = true
    try {
      if (!siteConfigs.value.length) {
        const [configRes, categoriesRes, tagsRes] = await Promise.all([
          apiFetch<SiteConfigItem[]>('/api/site/config'),
          apiFetch<Category[]>('/api/categories'),
          apiFetch<Tag[]>('/api/tags'),
        ])
        siteConfigs.value = configRes
        categories.value = categoriesRes
        tags.value = tagsRes
        syncSiteSettingsForm()
      }
      await loadAdminArticles(1)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load admin data')
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

      const isAdminScope = route.value.name === 'admin'
      const basePath = isAdminScope ? '/api/admin/articles' : '/api/me/articles'
      const articleId = articleForm.id
      const result = articleId
        ? await apiFetch<Article>(`${basePath}/${articleId}`, { method: 'PUT', body: JSON.stringify(payload) }, true)
        : await apiFetch<Article>(basePath, { method: 'POST', body: JSON.stringify(payload) }, true)

      fillArticleForm(result)
      await loadPublicArticles(1)
      if (isAdminScope) {
        await loadAdminArticles(articleId ? adminPage.value : 1)
        navigate(`/admin/articles/${result.id}`)
      } else {
        await loadMyArticles(articleId ? myPage.value : 1)
        navigate(`/me/articles/${result.id}`)
      }
      showToast(articleId ? 'Article updated' : 'Article created')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save article')
    } finally {
      busy.value = false
    }
  }

  async function deleteCurrentArticle() {
    if (!articleForm.id) return
    busy.value = true
    try {
      const isAdminScope = route.value.name === 'admin'
      const basePath = isAdminScope ? '/api/admin/articles' : '/api/me/articles'
      await apiFetch(`${basePath}/${articleForm.id}`, { method: 'DELETE' }, true)
      resetArticleForm()
      await loadPublicArticles(1)
      if (isAdminScope) {
        await loadAdminArticles(adminPage.value)
        navigate('/admin/articles')
      } else {
        await loadMyArticles(myPage.value)
        navigate('/me/articles')
      }
      showToast('Article deleted')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete article')
    } finally {
      busy.value = false
    }
  }

  async function saveAdminUser() {
    busy.value = true
    try {
      const payload = {
        username: adminUserForm.username,
        nickname: adminUserForm.nickname,
        avatar: adminUserForm.avatar || null,
        bio: adminUserForm.bio || null,
        role: adminUserForm.role,
        status: adminUserForm.status,
        password: adminUserForm.password,
      }
      const result = adminUserForm.id
        ? await apiFetch<UserRecord>(
            `/api/admin/users/${adminUserForm.id}`,
            {
              method: 'PUT',
              body: JSON.stringify({
                nickname: payload.nickname,
                avatar: payload.avatar,
                bio: payload.bio,
                role: payload.role,
                status: payload.status,
              }),
            },
            true,
          )
        : await apiFetch<UserRecord>('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) }, true)

      fillAdminUserForm(result)
      await loadAdminUsers(adminUserForm.id ? adminUsersPage.value : 1)
      navigate(`/admin/users/${result.id}`)
      showToast(adminUserForm.id ? 'User updated' : 'User created')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save user')
    } finally {
      busy.value = false
    }
  }

  async function resetAdminUserPassword() {
    if (!adminUserForm.id || !adminUserPasswordForm.password) return
    busy.value = true
    try {
      await apiFetch(
        `/api/admin/users/${adminUserForm.id}/password`,
        {
          method: 'PUT',
          body: JSON.stringify({ password: adminUserPasswordForm.password }),
        },
        true,
      )
      adminUserPasswordForm.password = ''
      showToast('Password reset')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to reset password')
    } finally {
      busy.value = false
    }
  }

  async function toggleAdminUserStatus(user: UserRecord) {
    busy.value = true
    try {
      await apiFetch<UserRecord>(
        `/api/admin/users/${user.id}/status`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: user.status === 'active' ? 'disabled' : 'active' }),
        },
        true,
      )
      await loadAdminUsers(adminUsersPage.value)
      if (adminUserForm.id === user.id) {
        await loadAdminUser(user.id)
      }
      showToast('User status updated')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update status')
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
      const categoriesRes = await apiFetch<Category[]>('/api/categories')
      categories.value = categoriesRes
      showToast('Category created')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create category')
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
      const tagsRes = await apiFetch<Tag[]>('/api/tags')
      tags.value = tagsRes
      showToast('Tag created')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create tag')
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
      showToast('Settings updated')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save settings')
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
      showToast('Image uploaded')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to upload image')
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

  async function handleRouteChange() {
    if (!authReady.value) return

    if (!currentUser.value) {
      if (route.value.name !== 'login') navigate('/login')
      return
    }

    if (route.value.name === 'login') {
      if (suppressLoginRedirect.value) return
      navigate('/')
      return
    }

    if (route.value.name === 'admin' && !isAdmin.value) {
      navigate('/')
      return
    }

    if (!siteConfigs.value.length) {
      await loadPublicData()
    }

    if (route.value.name === 'articles') {
      await loadPublicArticles(1)
      return
    }

    if (route.value.name === 'article-detail' && route.value.slug) {
      await loadArticle(route.value.slug)
      return
    }

    if (route.value.name === 'me') {
      syncProfileForm()
      return
    }

    if (route.value.name === 'me-profile') {
      syncProfileForm()
      return
    }

    if (route.value.name === 'me-password') {
      passwordForm.current_password = ''
      passwordForm.new_password = ''
      return
    }

    if (route.value.name === 'me-articles') {
      await loadMyArticles(1)
      return
    }

    if (route.value.name === 'me-article-new') {
      resetArticleForm()
      return
    }

    if (route.value.name === 'me-article-detail' && route.value.articleId) {
      await loadMyArticle(route.value.articleId)
      return
    }

    if (route.value.name === 'admin') {
      await loadAdminData()

      if (route.value.path === '/admin/users') {
        await loadAdminUsers(1)
        return
      }

      if (route.value.path === '/admin/users/new') {
        resetAdminUserForm()
        return
      }

      if (route.value.userId) {
        await loadAdminUsers(adminUsersPage.value)
        await loadAdminUser(route.value.userId)
        return
      }

      if (route.value.path === '/admin/articles/new') {
        resetArticleForm()
        return
      }

      if (route.value.articleId) {
        await loadAdminArticle(route.value.articleId)
      }
    }
  }

  watch(
    () => route.value.path,
    async () => {
      await handleRouteChange()
    },
  )

  onMounted(async () => {
    window.addEventListener('hashchange', updateRoute)
    if (!window.location.hash) {
      navigate('/login')
    }

    if (authToken.value) {
      try {
        await loadCurrentUser()
        await loadPublicData()
      } catch {
        clearSession(false)
      }
    }

    authReady.value = true

    if (!currentUser.value) {
      navigate('/login')
      return
    }

    await handleRouteChange()
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
    adminUserForm,
    adminUserPasswordForm,
    adminUserTotal,
    adminUsers,
    adminUsersPage,
    articleFilters,
    articleForm,
    articleLoading,
    authReady,
    authToken,
    busy,
    categories,
    categoryForm,
    changeMyPassword,
    configMap,
    createCategory,
    createTag,
    currentArticle,
    currentUser,
    defaultProjects,
    deleteCurrentArticle,
    emailUrl,
    featuredArticles,
    getConfigValue,
    githubUrl,
    handleRouteChange,
    heroArticle,
    homeIntro,
    isAdmin,
    isAuthenticated,
    isEditingAdminUser,
    isEditingArticle,
    isMember,
    loadAdminArticles,
    loadAdminUsers,
    loadMyArticles,
    loadPublicArticles,
    login,
    loginForm,
    logout,
    meLoading,
    myArticleTotal,
    myArticles,
    myPage,
    myStatusFilter,
    navigate,
    pageSubtitle,
    pageTitle,
    passwordForm,
    profileForm,
    publicArticles,
    publicLoading,
    publicPage,
    publicTotal,
    recentPosts,
    resetAdminUserForm,
    resetArticleForm,
    resolveMediaUrl,
    route,
    saveAdminUser,
    saveArticle,
    saveSiteSettings,
    setPublicFilter,
    setLoginRedirectSuppressed,
    showToast,
    siteConfigs,
    siteSettingsForm,
    tags,
    tagForm,
    techStack,
    theme,
    toast,
    toggleAdminUserStatus,
    toggleTag,
    toggleTheme,
    totalAdminPages,
    totalAdminUserPages,
    totalMyPages,
    totalPublicPages,
    updateMyProfile,
    uploadedMedia,
    uploadImage,
    usersLoading,
    resetAdminUserPassword,
  }
}

export type BlogAppContext = ReturnType<typeof useBlogApp>
