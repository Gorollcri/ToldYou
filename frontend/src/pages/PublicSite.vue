<script setup lang="ts">
import { useBlogAppContext } from '../appContext'
import { formatDate, getReadMinutes, renderMarkdown } from '../utils/content'

const app = useBlogAppContext()
const {
  articleFilters,
  articleLoading,
  categories,
  currentArticle,
  defaultProjects,
  emailUrl,
  featuredArticles,
  getConfigValue,
  githubUrl,
  heroArticle,
  homeIntro,
  loadPublicArticles,
  navigate,
  pageSubtitle,
  pageTitle,
  publicArticles,
  publicLoading,
  publicPage,
  recentPosts,
  resolveMediaUrl,
  route,
  setPublicFilter,
  tags,
  techStack,
  totalPublicPages,
} = app
</script>

<template>
  <main class="main-shell">
    <section v-if="route.name === 'home'" class="hero-layout panel">
      <div class="hero-copy">
        <p class="eyebrow">Hi, I'm ToldYou</p>
        <h1>Express and Share.<br />Write thoughtful notes.</h1>
        <p class="subtitle">{{ pageSubtitle }}</p>
        <p class="intro">{{ homeIntro }}</p>

        <div class="hero-actions">
          <button class="btn btn-primary" @click="navigate('/articles')">查看帖子</button>
          <button class="btn btn-secondary" @click="navigate('/about')">关于我</button>
        </div>

        <div class="contact-row">
          <a class="icon-link" :href="githubUrl" target="_blank" rel="noreferrer">GitHub</a>
          <a class="icon-link" :href="emailUrl">Email</a>
          <button class="icon-link" @click="navigate('/admin')">Resume</button>
        </div>
      </div>

      <div class="hero-card-wrap">
        <article class="hero-feature-card" v-if="heroArticle">
          <div class="hero-feature-head">
            <span class="chip chip-hot">HOT POST</span>
            <span>{{ featuredArticles.length || 1 }} / 03</span>
          </div>
          <h2>{{ heroArticle.title }}</h2>
          <p>{{ heroArticle.summary || '一篇关于工程实践、系统设计与开发思考的文章。' }}</p>
          <div class="chip-row">
            <span v-for="tag in heroArticle.tags.slice(0, 2)" :key="tag.id" class="chip">#{{ tag.name }}</span>
          </div>
          <div class="hero-feature-meta">
            <span>{{ formatDate(heroArticle.published_at || heroArticle.created_at) }}</span>
            <span>{{ getReadMinutes(heroArticle) }} min read</span>
          </div>
          <button class="btn btn-surface" @click="navigate(`/articles/${heroArticle.slug}`)">Read Now</button>
        </article>
        <div v-else class="hero-feature-card placeholder-card">正在等待第一篇已发布文章。</div>
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
          <p class="card-kicker">{{ article.category?.name || 'ARTICLE' }}</p>
          <h3>{{ article.title }}</h3>
          <p class="card-summary">{{ article.summary || '这是一篇聚焦工程实践和系统设计的技术文章。' }}</p>
          <div class="chip-row">
            <span v-for="tag in article.tags.slice(0, 3)" :key="tag.id" class="chip">#{{ tag.name }}</span>
          </div>
          <div class="card-meta">
            <span>{{ formatDate(article.published_at || article.created_at) }}</span>
            <span>{{ getReadMinutes(article) }} min read</span>
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
          <span class="meta-label">Focus</span>
          <strong>{{ pageSubtitle }}</strong>
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
          <span>→</span>
        </button>
      </div>
    </section>

    <section v-if="route.name === 'articles'" class="content-section">
      <div class="section-head">
        <div>
          <p class="eyebrow">Public API Connected</p>
          <h1 class="section-title">Articles</h1>
        </div>
        <div class="filter-bar">
          <select v-model="articleFilters.category" @change="loadPublicArticles(1)">
            <option value="">全部分类</option>
            <option v-for="category in categories" :key="category.id" :value="category.slug">{{ category.name }}</option>
          </select>
          <select v-model="articleFilters.tag" @change="loadPublicArticles(1)">
            <option value="">全部标签</option>
            <option v-for="tag in tags" :key="tag.id" :value="tag.slug">{{ tag.name }}</option>
          </select>
          <input v-model="articleFilters.keyword" type="text" placeholder="搜索标题或摘要" @keyup.enter="loadPublicArticles(1)" />
          <button class="btn btn-primary" @click="loadPublicArticles(1)">筛选</button>
        </div>
      </div>

      <div v-if="publicLoading" class="panel placeholder-card">文章列表加载中...</div>
      <div v-else class="article-list">
        <article v-for="article in publicArticles" :key="article.id" class="article-row panel">
          <img v-if="article.cover_image" class="row-cover" :src="resolveMediaUrl(article.cover_image)" :alt="article.title" />
          <div class="row-main">
            <p class="card-kicker">{{ article.category?.name || 'UNCATEGORIZED' }}</p>
            <h3>{{ article.title }}</h3>
            <p class="card-summary">{{ article.summary || '暂无摘要。' }}</p>
            <div class="chip-row">
              <button v-for="tag in article.tags" :key="tag.id" class="chip chip-button" @click="setPublicFilter('tag', tag.slug)">
                #{{ tag.name }}
              </button>
            </div>
            <div class="card-meta">
              <span>{{ formatDate(article.published_at || article.created_at) }}</span>
              <span>{{ article.view_count }} views</span>
            </div>
          </div>
          <button class="btn btn-secondary" @click="navigate(`/articles/${article.slug}`)">Read Article</button>
        </article>
      </div>

      <div class="pagination">
        <button class="btn btn-secondary" :disabled="publicPage <= 1" @click="loadPublicArticles(publicPage - 1)">上一页</button>
        <span>第 {{ publicPage }} / {{ totalPublicPages }} 页</span>
        <button class="btn btn-secondary" :disabled="publicPage >= totalPublicPages" @click="loadPublicArticles(publicPage + 1)">
          下一页
        </button>
      </div>
    </section>

    <section v-if="route.name === 'article-detail'" class="content-section">
      <div v-if="articleLoading" class="panel placeholder-card">文章加载中...</div>
      <article v-else-if="currentArticle" class="detail-shell panel">
        <p class="eyebrow">{{ currentArticle.category?.name || 'ARTICLE' }}</p>
        <h1 class="detail-title">{{ currentArticle.title }}</h1>
        <div class="detail-meta">
          <span>{{ formatDate(currentArticle.published_at || currentArticle.created_at) }}</span>
          <span>{{ currentArticle.view_count }} views</span>
          <span>{{ getReadMinutes(currentArticle) }} min read</span>
        </div>
        <img
          v-if="currentArticle.cover_image"
          class="detail-cover"
          :src="resolveMediaUrl(currentArticle.cover_image)"
          :alt="currentArticle.title"
        />
        <div class="chip-row">
          <button v-for="tag in currentArticle.tags" :key="tag.id" class="chip chip-button" @click="setPublicFilter('tag', tag.slug)">
            #{{ tag.name }}
          </button>
        </div>
        <p class="detail-summary">{{ currentArticle.summary }}</p>
        <div class="markdown-body" v-html="renderMarkdown(currentArticle.content || '')"></div>
      </article>
      <div v-else class="panel placeholder-card">文章不存在或尚未发布。</div>
    </section>
  </main>
</template>
