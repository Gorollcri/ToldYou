<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, unref } from 'vue'

import { useBlogAppContext } from '../appContext'
import { formatDate, getReadMinutes, renderMarkdown } from '../utils/content'

const app = useBlogAppContext()
const {
  articleFilters,
  articleForm,
  articleLoading,
  authReady,
  busy,
  categories,
  changeMyPassword,
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
  loadMyArticles,
  loadPublicArticles,
  meLoading,
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
  recentPosts,
  resolveMediaUrl,
  route,
  saveArticle,
  setPublicFilter,
  tags,
  techStack,
  toggleTag,
  totalMyPages,
  totalPublicPages,
  updateMyProfile,
} = app

const showLoginTransition = ref(false)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const fadeRef = ref<HTMLDivElement | null>(null)
const glowRef = ref<HTMLDivElement | null>(null)

let animationId = 0
let startTime = 0
let ctx: CanvasRenderingContext2D | null = null
let canvasWidth = 0
let canvasHeight = 0
let fontSize = 0
let hasNavigatedToHome = false

function getTransitionLabel() {
  const label = `${unref(pageTitle) || 'ToldYou'}`.trim()
  return label.slice(0, 18)
}

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const dpr = window.devicePixelRatio || 1
  canvasWidth = window.innerWidth
  canvasHeight = window.innerHeight
  canvas.width = canvasWidth * dpr
  canvas.height = canvasHeight * dpr
  canvas.style.width = `${canvasWidth}px`
  canvas.style.height = `${canvasHeight}px`

  ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.scale(dpr, dpr)
  fontSize = Math.min(canvasWidth * 0.1, canvasHeight * 0.2)
}

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function drawMaskText(label: string, y: number) {
  if (!ctx) return
  ctx.fillStyle = '#ffffff'
  ctx.font = `900 ${fontSize}px "Georgia", "Times New Roman", serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, canvasWidth / 2, y)
}

function drawTransition(elapsed: number) {
  if (!ctx) return

  const w = canvasWidth
  const h = canvasHeight
  const halfH = h / 2
  const label = getTransitionLabel()

  let maskTop = 0
  let maskBottom = h
  let fadeOpacity = 0
  let glowOpacity = 0
  let topTextY = h / 2
  let bottomTextY = h / 2

  if (!hasNavigatedToHome && elapsed >= 800) {
    hasNavigatedToHome = true
    navigate('/')
  }

  if (elapsed < 800) {
    const progress = easeInOutCubic(elapsed / 800)
    maskTop = progress * halfH
    maskBottom = h - progress * halfH
    fadeOpacity = 0.2 + progress * 0.68
    glowOpacity = progress
  } else if (elapsed < 1350) {
    maskTop = halfH
    maskBottom = halfH
    fadeOpacity = 0.88
    glowOpacity = 1
  } else if (elapsed < 2250) {
    const progress = easeInOutCubic((elapsed - 1350) / 900)
    maskTop = (1 - progress) * halfH
    maskBottom = halfH + progress * halfH
    fadeOpacity = 0.88 * (1 - progress)
    glowOpacity = 1 - progress
    topTextY = maskTop - h / 2
  } else {
    finishLoginTransition()
    return
  }

  if (fadeRef.value) {
    fadeRef.value.style.opacity = `${fadeOpacity}`
  }

  if (glowRef.value) {
    glowRef.value.style.opacity = `${glowOpacity}`
  }

  ctx.clearRect(0, 0, w, h)

  if (maskTop > 0) {
    ctx.save()
    ctx.fillStyle = '#050816'
    ctx.fillRect(0, 0, w, maskTop)
    ctx.globalCompositeOperation = 'destination-out'
    drawMaskText(label, topTextY)
    ctx.restore()
  }

  if (maskBottom < h) {
    ctx.save()
    ctx.fillStyle = '#050816'
    ctx.fillRect(0, maskBottom, w, h - maskBottom)
    ctx.globalCompositeOperation = 'destination-out'
    drawMaskText(label, bottomTextY)
    ctx.restore()
  }
}

function animateTransition(timestamp: number) {
  drawTransition(timestamp - startTime)
  if (showLoginTransition.value) {
    animationId = window.requestAnimationFrame(animateTransition)
  }
}

async function startLoginTransition() {
  hasNavigatedToHome = false
  showLoginTransition.value = true
  document.body.classList.add('transition-lock')
  await nextTick()
  initCanvas()
  startTime = performance.now()
  animationId = window.requestAnimationFrame(animateTransition)
}

function stopAnimationFrame() {
  if (animationId) {
    window.cancelAnimationFrame(animationId)
    animationId = 0
  }
}

function finishLoginTransition() {
  stopAnimationFrame()
  showLoginTransition.value = false
  hasNavigatedToHome = false
  app.setLoginRedirectSuppressed(false)
  document.body.classList.remove('transition-lock')
}

async function handleLogin() {
  app.setLoginRedirectSuppressed(true)
  const success = await app.login({ redirect: false })
  if (!success) {
    app.setLoginRedirectSuppressed(false)
    return
  }

  await nextTick()
  await startLoginTransition()
}

function handleResize() {
  if (!showLoginTransition.value) return
  initCanvas()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  stopAnimationFrame()
  app.setLoginRedirectSuppressed(false)
  document.body.classList.remove('transition-lock')
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <main class="main-shell" :class="{ 'main-shell-transitioning': showLoginTransition }">
    <div v-if="showLoginTransition" class="transition-overlay" aria-hidden="true">
      <div ref="fadeRef" class="fade-scrim"></div>
      <div ref="glowRef" class="cutout-glow"></div>
      <canvas ref="canvasRef" class="mask-canvas"></canvas>
    </div>

    <section v-if="route.name === 'login'" class="login-shell">
      <div class="login-stage panel">
        <div class="login-art">
          <p class="login-kicker">PRIVATE ACCESS</p>
          <h1>Words stay quiet until the right person arrives.</h1>
          <p class="login-copy">A small internal publishing space for invited accounts, drafts, and editorial work.</p>
          <div class="login-quote-grid" aria-hidden="true">
            <span>WRITE WITH INTENT</span>
            <span>INVITED ONLY</span>
            <span>PRIVATE SYSTEM</span>
            <span>CURATED ACCESS</span>
          </div>
        </div>

        <div class="login-card">
          <div>
            <p class="eyebrow">Site Access</p>
            <h2 class="section-title">Sign in to continue</h2>
            <p class="intro">This site is available to invited users only.</p>
          </div>

          <div class="form-grid">
            <label>
              <span>Username</span>
              <input v-model="app.loginForm.username" type="text" autocomplete="username" />
            </label>
            <label>
              <span>Password</span>
              <input v-model="app.loginForm.password" type="password" autocomplete="current-password" />
            </label>
            <button class="btn btn-primary" :disabled="busy || showLoginTransition" @click="handleLogin">Sign in</button>
          </div>
        </div>
      </div>
    </section>

    <section v-else-if="!authReady || !currentUser" class="panel placeholder-card">Loading your workspace...</section>

    <template v-else>
      <section v-if="route.name === 'home'" class="hero-layout panel">
        <div class="hero-copy">
          <p class="eyebrow">Private Content System</p>
          <h1>{{ pageTitle }}</h1>
          <p class="subtitle">{{ pageSubtitle }}</p>
          <p class="intro">{{ homeIntro }}</p>

          <div class="hero-actions">
            <button class="btn btn-primary" @click="navigate('/articles')">Browse Articles</button>
            <button class="btn btn-secondary" @click="navigate('/me/articles')">My Articles</button>
          </div>

          <div class="contact-row">
            <a class="icon-link" :href="githubUrl" target="_blank" rel="noreferrer">GitHub</a>
            <a class="icon-link" :href="emailUrl">Email</a>
            <button class="icon-link" @click="navigate('/me')">{{ currentUser.nickname }}</button>
          </div>
        </div>

        <div class="hero-card-wrap">
          <article class="hero-feature-card" v-if="heroArticle">
            <div class="hero-feature-head">
              <span class="chip chip-hot">Featured</span>
              <span>{{ heroArticle.author.nickname }}</span>
            </div>
            <h2>{{ heroArticle.title }}</h2>
            <p>{{ heroArticle.summary || 'A featured article from the private workspace.' }}</p>
            <div class="chip-row">
              <span v-for="tag in heroArticle.tags.slice(0, 2)" :key="tag.id" class="chip">#{{ tag.name }}</span>
            </div>
            <div class="hero-feature-meta">
              <span>{{ formatDate(heroArticle.published_at || heroArticle.created_at) }}</span>
              <span>{{ getReadMinutes(heroArticle) }} min read</span>
            </div>
            <button class="btn btn-surface" @click="navigate(`/articles/${heroArticle.slug}`)">Read now</button>
          </article>
          <div v-else class="hero-feature-card placeholder-card">No published article yet.</div>
        </div>
      </section>

      <section v-if="route.name === 'home'" class="content-section">
        <div class="section-head">
          <h2>Featured Articles</h2>
          <button class="ghost-link" @click="navigate('/articles')">View all articles</button>
        </div>
        <div class="card-grid">
          <article
            v-for="article in featuredArticles.length ? featuredArticles : publicArticles.slice(0, 3)"
            :key="article.id"
            class="article-card panel"
          >
            <img v-if="article.cover_image" class="card-cover" :src="resolveMediaUrl(article.cover_image)" :alt="article.title" />
            <div v-else class="cover-placeholder card-cover">
              <span>{{ article.category?.name || 'ARTICLE' }}</span>
            </div>
            <p class="card-kicker">{{ article.category?.name || 'ARTICLE' }}</p>
            <h3>{{ article.title }}</h3>
            <p class="card-summary">{{ article.summary || 'Private article summary is not available yet.' }}</p>
            <div class="chip-row">
              <span v-for="tag in article.tags.slice(0, 3)" :key="tag.id" class="chip">#{{ tag.name }}</span>
            </div>
            <div class="card-meta">
              <span>{{ formatDate(article.published_at || article.created_at) }}</span>
              <span>{{ article.author.nickname }}</span>
            </div>
            <button class="arrow-link" @click="navigate(`/articles/${article.slug}`)">Read</button>
          </article>
        </div>
      </section>

      <section v-if="route.name === 'home' || route.name === 'projects'" class="content-section">
        <div class="section-head">
          <h2>Selected Projects</h2>
          <button v-if="route.name === 'home'" class="ghost-link" @click="navigate('/projects')">View all projects</button>
        </div>
        <div class="card-grid">
          <article v-for="project in defaultProjects" :key="project.title" class="project-card panel">
            <div class="project-icon">{{ project.title.slice(0, 1) }}</div>
            <h3>{{ project.title }}</h3>
            <p class="card-summary">{{ project.description }}</p>
            <div class="stack-line">
              <span v-for="stack in project.stack" :key="stack">{{ stack }}</span>
            </div>
            <div class="project-actions">
              <a :href="project.github" target="_blank" rel="noreferrer">GitHub</a>
              <a :href="project.demo" target="_blank" rel="noreferrer">Demo</a>
            </div>
          </article>
        </div>
      </section>

      <section v-if="route.name === 'home' || route.name === 'about'" class="content-section panel about-panel">
        <div>
          <h2>About</h2>
          <p class="about-copy">{{ homeIntro }}</p>
        </div>
        <div class="about-meta">
          <div>
            <span class="meta-label">Site title</span>
            <strong>{{ pageTitle }}</strong>
          </div>
          <div>
            <span class="meta-label">Contact</span>
            <strong>{{ getConfigValue('email', 'hello@example.com') }}</strong>
          </div>
          <div>
            <span class="meta-label">Signed in as</span>
            <strong>{{ currentUser.nickname }}</strong>
          </div>
        </div>
      </section>

      <section v-if="route.name === 'home'" class="content-section">
        <h2>Tech Stack</h2>
        <div class="chip-cloud panel">
          <span v-for="item in techStack" :key="item" class="stack-chip">{{ item }}</span>
        </div>
      </section>

      <section v-if="route.name === 'home'" class="content-section">
        <h2>Recent Posts</h2>
        <div class="list-panel panel">
          <button v-for="article in recentPosts" :key="article.id" class="post-row" @click="navigate(`/articles/${article.slug}`)">
            <span>{{ formatDate(article.published_at || article.created_at) }}</span>
            <strong>{{ article.title }}</strong>
            <span>{{ article.author.nickname }}</span>
          </button>
        </div>
      </section>

      <section v-if="route.name === 'articles'" class="content-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">Private Feed</p>
            <h1 class="section-title">Articles</h1>
          </div>
          <div class="filter-bar">
            <select v-model="articleFilters.category" @change="loadPublicArticles(1)">
              <option value="">All categories</option>
              <option v-for="category in categories" :key="category.id" :value="category.slug">{{ category.name }}</option>
            </select>
            <select v-model="articleFilters.tag" @change="loadPublicArticles(1)">
              <option value="">All tags</option>
              <option v-for="tag in tags" :key="tag.id" :value="tag.slug">{{ tag.name }}</option>
            </select>
            <input v-model="articleFilters.keyword" type="text" placeholder="Search title or summary" @keyup.enter="loadPublicArticles(1)" />
            <button class="btn btn-primary" @click="loadPublicArticles(1)">Apply</button>
          </div>
        </div>

        <div v-if="publicLoading" class="panel placeholder-card">Loading articles...</div>
        <div v-else class="article-list">
          <article v-for="article in publicArticles" :key="article.id" class="article-row panel">
            <img v-if="article.cover_image" class="row-cover" :src="resolveMediaUrl(article.cover_image)" :alt="article.title" />
            <div v-else class="cover-placeholder row-cover">
              <span>{{ article.category?.name || 'ARTICLE' }}</span>
            </div>
            <div class="row-main">
              <p class="card-kicker">{{ article.category?.name || 'UNCATEGORIZED' }}</p>
              <h3>{{ article.title }}</h3>
              <p class="card-summary">{{ article.summary || 'No summary yet.' }}</p>
              <div class="chip-row">
                <button v-for="tag in article.tags" :key="tag.id" class="chip chip-button" @click="setPublicFilter('tag', tag.slug)">
                  #{{ tag.name }}
                </button>
              </div>
              <div class="card-meta">
                <span>{{ formatDate(article.published_at || article.created_at) }}</span>
                <span>{{ article.author.nickname }}</span>
                <span>{{ article.view_count }} views</span>
              </div>
            </div>
            <button class="btn btn-secondary" @click="navigate(`/articles/${article.slug}`)">Read article</button>
          </article>
        </div>

        <div class="pagination">
          <button class="btn btn-secondary" :disabled="publicPage <= 1" @click="loadPublicArticles(publicPage - 1)">Previous</button>
          <span>Page {{ publicPage }} / {{ totalPublicPages }}</span>
          <button class="btn btn-secondary" :disabled="publicPage >= totalPublicPages" @click="loadPublicArticles(publicPage + 1)">Next</button>
        </div>
      </section>

      <section v-if="route.name === 'article-detail'" class="content-section">
        <div v-if="articleLoading" class="panel placeholder-card">Loading article...</div>
        <article v-else-if="currentArticle" class="detail-shell panel">
          <p class="eyebrow">{{ currentArticle.category?.name || 'ARTICLE' }}</p>
          <h1 class="detail-title">{{ currentArticle.title }}</h1>
          <div class="detail-meta">
            <span>{{ formatDate(currentArticle.published_at || currentArticle.created_at) }}</span>
            <span>{{ currentArticle.author.nickname }}</span>
            <span>{{ currentArticle.view_count }} views</span>
            <span>{{ getReadMinutes(currentArticle) }} min read</span>
          </div>
          <img
            v-if="currentArticle.cover_image"
            class="detail-cover"
            :src="resolveMediaUrl(currentArticle.cover_image)"
            :alt="currentArticle.title"
          />
          <div v-else class="cover-placeholder detail-cover">
            <span>{{ currentArticle.category?.name || 'ARTICLE' }}</span>
          </div>
          <div class="chip-row">
            <button v-for="tag in currentArticle.tags" :key="tag.id" class="chip chip-button" @click="setPublicFilter('tag', tag.slug)">
              #{{ tag.name }}
            </button>
          </div>
          <p class="detail-summary">{{ currentArticle.summary }}</p>
          <div class="markdown-body" v-html="renderMarkdown(currentArticle.content || '')"></div>
        </article>
        <div v-else class="panel placeholder-card">Article not found.</div>
      </section>

      <section v-if="route.name === 'me'" class="content-section panel about-panel">
        <div>
          <p class="eyebrow">My Center</p>
          <h1 class="section-title">{{ currentUser.nickname }}</h1>
          <p class="about-copy">{{ currentUser.bio || 'No bio yet.' }}</p>
        </div>
        <div class="about-meta">
          <div>
            <span class="meta-label">Username</span>
            <strong>{{ currentUser.username }}</strong>
          </div>
          <div>
            <span class="meta-label">Role</span>
            <strong>{{ currentUser.role }}</strong>
          </div>
          <div>
            <span class="meta-label">Last login</span>
            <strong>{{ currentUser.last_login_at ? formatDate(currentUser.last_login_at) : 'First session' }}</strong>
          </div>
        </div>
        <div class="hero-actions">
          <button class="btn btn-primary" @click="navigate('/me/articles')">My Articles</button>
          <button class="btn btn-secondary" @click="navigate('/me/profile')">Edit Profile</button>
          <button class="btn btn-secondary" @click="navigate('/me/password')">Change Password</button>
        </div>
      </section>

      <section v-if="route.name === 'me-profile'" class="panel admin-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">Profile</p>
            <h1 class="section-title">Edit Profile</h1>
          </div>
          <button class="btn btn-primary" :disabled="busy" @click="updateMyProfile">Save profile</button>
        </div>
        <div class="editor-grid">
          <label>
            <span>Nickname</span>
            <input v-model="profileForm.nickname" type="text" />
          </label>
          <label>
            <span>Avatar URL</span>
            <input v-model="profileForm.avatar" type="text" />
          </label>
          <label class="full">
            <span>Bio</span>
            <textarea v-model="profileForm.bio" rows="5"></textarea>
          </label>
        </div>
      </section>

      <section v-if="route.name === 'me-password'" class="panel admin-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">Security</p>
            <h1 class="section-title">Change Password</h1>
          </div>
          <button class="btn btn-primary" :disabled="busy" @click="changeMyPassword">Update password</button>
        </div>
        <div class="editor-grid">
          <label>
            <span>Current password</span>
            <input v-model="passwordForm.current_password" type="password" />
          </label>
          <label>
            <span>New password</span>
            <input v-model="passwordForm.new_password" type="password" />
          </label>
        </div>
      </section>

      <section v-if="route.name === 'me-articles'" class="panel admin-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">My Content</p>
            <h1 class="section-title">My Articles</h1>
          </div>
          <div class="filter-bar">
            <select v-model="myStatusFilter" @change="loadMyArticles(1)">
              <option value="">All statuses</option>
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="hidden">hidden</option>
              <option value="deleted">deleted</option>
            </select>
            <button class="btn btn-primary" @click="navigate('/me/articles/new')">New article</button>
          </div>
        </div>
        <div v-if="meLoading" class="panel placeholder-card">Loading your articles...</div>
        <div v-else class="list-panel">
          <button v-for="article in myArticles" :key="article.id" class="post-row admin-post-row" @click="navigate(`/me/articles/${article.id}`)">
            <span>#{{ article.id }}</span>
            <strong>{{ article.title }}</strong>
            <span>{{ article.status }}</span>
          </button>
        </div>
        <div class="pagination">
          <button class="btn btn-secondary" :disabled="myPage <= 1" @click="loadMyArticles(myPage - 1)">Previous</button>
          <span>Page {{ myPage }} / {{ totalMyPages }}</span>
          <button class="btn btn-secondary" :disabled="myPage >= totalMyPages" @click="loadMyArticles(myPage + 1)">Next</button>
        </div>
      </section>

      <section v-if="route.name === 'me-article-new' || route.name === 'me-article-detail'" class="panel admin-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">My Drafts</p>
            <h1 class="section-title">{{ isEditingArticle ? 'Edit Article' : 'Create Article' }}</h1>
          </div>
          <div class="hero-actions">
            <button class="btn btn-secondary" @click="navigate('/me/articles')">Back to list</button>
            <button v-if="isEditingArticle" class="btn btn-secondary" :disabled="busy" @click="deleteCurrentArticle">Delete</button>
            <button class="btn btn-primary" :disabled="busy" @click="saveArticle">Save article</button>
          </div>
        </div>

        <div class="editor-grid">
          <label class="full">
            <span>Title</span>
            <input v-model="articleForm.title" type="text" />
          </label>
          <label>
            <span>Slug</span>
            <input v-model="articleForm.slug" type="text" />
          </label>
          <label>
            <span>Status</span>
            <select v-model="articleForm.status">
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="hidden">hidden</option>
            </select>
          </label>
          <label>
            <span>Category</span>
            <select v-model="articleForm.category_id">
              <option :value="''">Uncategorized</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
            </select>
          </label>
          <label class="full">
            <span>Summary</span>
            <textarea v-model="articleForm.summary" rows="3"></textarea>
          </label>
          <label class="full">
            <span>Cover image</span>
            <input v-model="articleForm.cover_image" type="text" placeholder="/media/cover.png" />
          </label>
          <label class="full">
            <span>Markdown</span>
            <textarea v-model="articleForm.content" rows="16"></textarea>
          </label>
        </div>

        <div class="toolbar-row">
          <label class="check-item"><input v-model="articleForm.is_top" type="checkbox" /> Top</label>
          <label class="check-item"><input v-model="articleForm.is_featured" type="checkbox" /> Featured</label>
        </div>

        <div>
          <span class="meta-label">Tags</span>
          <div class="chip-row">
            <button
              v-for="tag in tags"
              :key="tag.id"
              class="chip chip-button"
              :class="{ selected: articleForm.tag_ids.includes(tag.id) }"
              @click="toggleTag(tag.id)"
            >
              #{{ tag.name }}
            </button>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.main-shell-transitioning {
  z-index: 100001;
  isolation: isolate;
}

.transition-overlay {
  position: fixed;
  inset: 0;
  z-index: 100002;
  pointer-events: none;
}

.fade-scrim {
  position: fixed;
  inset: 0;
  z-index: 100000;
  background:
    radial-gradient(circle at 50% 40%, rgba(24, 32, 62, 0.22), transparent 42%),
    linear-gradient(180deg, rgba(5, 8, 22, 0.84), rgba(5, 8, 22, 0.92));
  opacity: 0;
}

.cutout-glow {
  position: fixed;
  inset: 0;
  z-index: 100001;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 248, 230, 0.92) 0%, rgba(194, 201, 255, 0.42) 24%, rgba(67, 91, 167, 0.14) 52%, transparent 72%),
    linear-gradient(180deg, rgba(6, 8, 18, 0.18), rgba(6, 8, 18, 0));
  opacity: 0;
}

.mask-canvas {
  position: fixed;
  inset: 0;
  z-index: 100002;
  pointer-events: none;
}
</style>
