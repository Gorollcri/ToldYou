<script setup lang="ts">
import { useBlogAppContext } from '../appContext'

const app = useBlogAppContext()
const {
  adminArticles,
  adminLoading,
  adminPage,
  adminStatusFilter,
  articleForm,
  busy,
  categories,
  categoryForm,
  createCategory,
  createTag,
  currentUser,
  deleteCurrentArticle,
  isEditingArticle,
  loadAdminArticles,
  login,
  loginForm,
  logout,
  navigate,
  route,
  saveArticle,
  saveSiteSettings,
  siteSettingsForm,
  tagForm,
  tags,
  toggleTag,
  totalAdminPages,
  uploadedMedia,
  uploadImage,
  resolveMediaUrl,
} = app
</script>

<template>
  <main class="admin-shell">
    <section v-if="!currentUser" class="admin-login panel">
      <div>
        <p class="eyebrow">Admin Access</p>
        <h1 class="section-title">登录内容后台</h1>
        <p class="intro">使用后端默认管理员账号即可接通文章、分类、标签、站点配置和图片上传能力。</p>
      </div>
      <div class="form-grid">
        <label>
          <span>用户名</span>
          <input v-model="loginForm.username" type="text" />
        </label>
        <label>
          <span>密码</span>
          <input v-model="loginForm.password" type="password" />
        </label>
        <button class="btn btn-primary" :disabled="busy" @click="login">登录后台</button>
      </div>
    </section>

    <template v-else>
      <aside class="admin-sidebar panel">
        <div>
          <p class="eyebrow">Signed in</p>
          <h2>{{ currentUser.nickname }}</h2>
          <p class="sidebar-copy">{{ currentUser.username }} · {{ currentUser.role }}</p>
        </div>
        <div class="sidebar-nav">
          <button :class="{ active: route.path === '/admin' }" @click="navigate('/admin')">Dashboard</button>
          <button :class="{ active: route.path.startsWith('/admin/articles') }" @click="navigate('/admin/articles')">Articles</button>
          <button :class="{ active: route.path === '/admin/categories' }" @click="navigate('/admin/categories')">Categories</button>
          <button :class="{ active: route.path === '/admin/tags' }" @click="navigate('/admin/tags')">Tags</button>
          <button :class="{ active: route.path === '/admin/settings' }" @click="navigate('/admin/settings')">Settings</button>
          <button :class="{ active: route.path === '/admin/upload' }" @click="navigate('/admin/upload')">Upload</button>
        </div>
        <button class="btn btn-secondary" @click="logout">退出登录</button>
      </aside>

      <section class="admin-main">
        <div v-if="adminLoading" class="panel placeholder-card">后台数据加载中...</div>

        <template v-else>
          <section v-if="route.path === '/admin'" class="panel dashboard-grid">
            <article>
              <span class="meta-label">Published</span>
              <strong>{{ adminArticles.filter((item) => item.status === 'published').length }}</strong>
            </article>
            <article>
              <span class="meta-label">Drafts</span>
              <strong>{{ adminArticles.filter((item) => item.status === 'draft').length }}</strong>
            </article>
            <article>
              <span class="meta-label">Categories</span>
              <strong>{{ categories.length }}</strong>
            </article>
            <article>
              <span class="meta-label">Tags</span>
              <strong>{{ tags.length }}</strong>
            </article>
          </section>

          <section v-if="route.path === '/admin/articles'" class="panel admin-section">
            <div class="section-head">
              <div>
                <p class="eyebrow">Article Manager</p>
                <h1 class="section-title">文章管理</h1>
              </div>
              <div class="filter-bar">
                <select v-model="adminStatusFilter" @change="loadAdminArticles(1)">
                  <option value="">全部状态</option>
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="hidden">hidden</option>
                  <option value="deleted">deleted</option>
                </select>
                <button class="btn btn-primary" @click="navigate('/admin/articles/new')">新建文章</button>
              </div>
            </div>
            <div class="list-panel">
              <button v-for="article in adminArticles" :key="article.id" class="post-row admin-post-row" @click="navigate(`/admin/articles/${article.id}`)">
                <span>#{{ article.id }}</span>
                <strong>{{ article.title }}</strong>
                <span>{{ article.status }}</span>
              </button>
            </div>
            <div class="pagination">
              <button class="btn btn-secondary" :disabled="adminPage <= 1" @click="loadAdminArticles(adminPage - 1)">上一页</button>
              <span>第 {{ adminPage }} / {{ totalAdminPages }} 页</span>
              <button class="btn btn-secondary" :disabled="adminPage >= totalAdminPages" @click="loadAdminArticles(adminPage + 1)">
                下一页
              </button>
            </div>
          </section>

          <section v-if="route.path === '/admin/articles/new' || /^\/admin\/articles\/\d+$/.test(route.path)" class="panel admin-section">
            <div class="section-head">
              <div>
                <p class="eyebrow">Article Editor</p>
                <h1 class="section-title">{{ isEditingArticle ? '编辑文章' : '创建文章' }}</h1>
              </div>
              <div class="hero-actions">
                <button class="btn btn-secondary" @click="navigate('/admin/articles')">返回列表</button>
                <button v-if="isEditingArticle" class="btn btn-secondary" :disabled="busy" @click="deleteCurrentArticle">删除</button>
                <button class="btn btn-primary" :disabled="busy" @click="saveArticle">保存文章</button>
              </div>
            </div>

            <div class="editor-grid">
              <label class="full">
                <span>标题</span>
                <input v-model="articleForm.title" type="text" placeholder="输入文章标题" />
              </label>
              <label>
                <span>Slug</span>
                <input v-model="articleForm.slug" type="text" placeholder="可留空自动生成" />
              </label>
              <label>
                <span>状态</span>
                <select v-model="articleForm.status">
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="hidden">hidden</option>
                </select>
              </label>
              <label>
                <span>分类</span>
                <select v-model="articleForm.category_id">
                  <option :value="''">未分类</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
                </select>
              </label>
              <label class="full">
                <span>摘要</span>
                <textarea v-model="articleForm.summary" rows="3" placeholder="输入文章摘要"></textarea>
              </label>
              <label class="full">
                <span>封面地址</span>
                <input v-model="articleForm.cover_image" type="text" placeholder="/media/your-image.png" />
              </label>
              <label class="full">
                <span>正文 Markdown</span>
                <textarea v-model="articleForm.content" rows="16" placeholder="输入 Markdown 内容"></textarea>
              </label>
            </div>

            <div class="toolbar-row">
              <label class="check-item"><input v-model="articleForm.is_top" type="checkbox" /> 置顶</label>
              <label class="check-item"><input v-model="articleForm.is_featured" type="checkbox" /> 推荐</label>
            </div>

            <div>
              <span class="meta-label">标签</span>
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

            <div class="upload-inline panel">
              <div>
                <span class="meta-label">上传封面</span>
                <p class="sidebar-copy">上传成功后会自动写入当前文章的封面地址。</p>
              </div>
              <input type="file" accept="image/*" @change="uploadImage" />
            </div>
          </section>

          <section v-if="route.path === '/admin/categories'" class="panel admin-section">
            <div class="section-head">
              <div>
                <p class="eyebrow">Taxonomy</p>
                <h1 class="section-title">分类管理</h1>
              </div>
            </div>
            <div class="editor-grid">
              <label>
                <span>名称</span>
                <input v-model="categoryForm.name" type="text" />
              </label>
              <label>
                <span>Slug</span>
                <input v-model="categoryForm.slug" type="text" />
              </label>
              <label>
                <span>排序</span>
                <input v-model.number="categoryForm.sort_order" type="number" />
              </label>
              <label class="full">
                <span>描述</span>
                <textarea v-model="categoryForm.description" rows="3"></textarea>
              </label>
            </div>
            <button class="btn btn-primary" :disabled="busy" @click="createCategory">创建分类</button>
            <div class="table-list">
              <article v-for="category in categories" :key="category.id" class="panel mini-card">
                <strong>{{ category.name }}</strong>
                <span>{{ category.slug }}</span>
                <p>{{ category.description || '暂无描述' }}</p>
              </article>
            </div>
          </section>

          <section v-if="route.path === '/admin/tags'" class="panel admin-section">
            <div class="section-head">
              <div>
                <p class="eyebrow">Tag Manager</p>
                <h1 class="section-title">标签管理</h1>
              </div>
            </div>
            <div class="editor-grid">
              <label>
                <span>名称</span>
                <input v-model="tagForm.name" type="text" />
              </label>
              <label>
                <span>Slug</span>
                <input v-model="tagForm.slug" type="text" />
              </label>
            </div>
            <button class="btn btn-primary" :disabled="busy" @click="createTag">创建标签</button>
            <div class="chip-row">
              <span v-for="tag in tags" :key="tag.id" class="chip">#{{ tag.name }}</span>
            </div>
          </section>

          <section v-if="route.path === '/admin/settings'" class="panel admin-section">
            <div class="section-head">
              <div>
                <p class="eyebrow">Site Config</p>
                <h1 class="section-title">站点设置</h1>
              </div>
              <button class="btn btn-primary" :disabled="busy" @click="saveSiteSettings">保存配置</button>
            </div>
            <div class="editor-grid">
              <label v-for="item in siteSettingsForm" :key="item.key" class="full">
                <span>{{ item.key }}</span>
                <input v-model="item.value" type="text" />
                <small>{{ item.description || '未设置描述' }}</small>
              </label>
            </div>
          </section>

          <section v-if="route.path === '/admin/upload'" class="panel admin-section">
            <div class="section-head">
              <div>
                <p class="eyebrow">Media Upload</p>
                <h1 class="section-title">图片上传</h1>
              </div>
            </div>
            <input type="file" accept="image/*" @change="uploadImage" />
            <div v-if="uploadedMedia" class="upload-result panel">
              <img :src="resolveMediaUrl(uploadedMedia.url)" :alt="uploadedMedia.original_name" />
              <div>
                <strong>{{ uploadedMedia.original_name }}</strong>
                <p>{{ uploadedMedia.url }}</p>
                <p>{{ uploadedMedia.mime_type }} · {{ uploadedMedia.size }} bytes</p>
              </div>
            </div>
          </section>
        </template>
      </section>
    </template>
  </main>
</template>
