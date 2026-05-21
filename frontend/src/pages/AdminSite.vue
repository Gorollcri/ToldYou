<script setup lang="ts">
import { useBlogAppContext } from '../appContext'

const app = useBlogAppContext()
const {
  adminArticles,
  adminLoading,
  adminPage,
  adminStatusFilter,
  adminUserForm,
  adminUserPasswordForm,
  adminUsers,
  adminUsersPage,
  articleForm,
  busy,
  categories,
  categoryForm,
  createCategory,
  createTag,
  currentUser,
  deleteCurrentArticle,
  isEditingAdminUser,
  isEditingArticle,
  loadAdminArticles,
  loadAdminUsers,
  logout,
  navigate,
  resetAdminUserForm,
  resolveMediaUrl,
  route,
  saveAdminUser,
  saveArticle,
  saveSiteSettings,
  siteSettingsForm,
  tagForm,
  tags,
  toggleAdminUserStatus,
  toggleTag,
  totalAdminPages,
  totalAdminUserPages,
  uploadedMedia,
  uploadImage,
  usersLoading,
  resetAdminUserPassword,
} = app
</script>

<template>
  <main class="admin-shell">
    <aside class="admin-sidebar panel">
      <div>
        <p class="eyebrow">Admin Access</p>
        <h2>{{ currentUser?.nickname }}</h2>
        <p class="sidebar-copy">{{ currentUser?.username }} · {{ currentUser?.role }}</p>
      </div>
      <div class="sidebar-nav">
        <button :class="{ active: route.path === '/admin' }" @click="navigate('/admin')">Dashboard</button>
        <button :class="{ active: route.path.startsWith('/admin/articles') }" @click="navigate('/admin/articles')">Articles</button>
        <button :class="{ active: route.path.startsWith('/admin/users') }" @click="navigate('/admin/users')">Users</button>
        <button :class="{ active: route.path === '/admin/categories' }" @click="navigate('/admin/categories')">Categories</button>
        <button :class="{ active: route.path === '/admin/tags' }" @click="navigate('/admin/tags')">Tags</button>
        <button :class="{ active: route.path === '/admin/settings' }" @click="navigate('/admin/settings')">Settings</button>
        <button :class="{ active: route.path === '/admin/upload' }" @click="navigate('/admin/upload')">Upload</button>
      </div>
      <div class="hero-actions">
        <button class="btn btn-secondary" @click="navigate('/')">Back to site</button>
        <button class="btn btn-secondary" @click="logout">Logout</button>
      </div>
    </aside>

    <section class="admin-main">
      <div v-if="adminLoading" class="panel placeholder-card">Loading admin data...</div>

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
            <span class="meta-label">Users</span>
            <strong>{{ adminUsers.length }}</strong>
          </article>
          <article>
            <span class="meta-label">Categories</span>
            <strong>{{ categories.length }}</strong>
          </article>
        </section>

        <section v-if="route.path === '/admin/articles'" class="panel admin-section">
          <div class="section-head">
            <div>
              <p class="eyebrow">Article Manager</p>
              <h1 class="section-title">Admin Articles</h1>
            </div>
            <div class="filter-bar">
              <select v-model="adminStatusFilter" @change="loadAdminArticles(1)">
                <option value="">All statuses</option>
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="hidden">hidden</option>
                <option value="deleted">deleted</option>
              </select>
              <button class="btn btn-primary" @click="navigate('/admin/articles/new')">New article</button>
            </div>
          </div>
          <div class="list-panel">
            <button v-for="article in adminArticles" :key="article.id" class="post-row admin-post-row" @click="navigate(`/admin/articles/${article.id}`)">
              <span>#{{ article.id }}</span>
              <strong>{{ article.title }}</strong>
              <span>{{ article.author.nickname }}</span>
              <span>{{ article.status }}</span>
            </button>
          </div>
          <div class="pagination">
            <button class="btn btn-secondary" :disabled="adminPage <= 1" @click="loadAdminArticles(adminPage - 1)">Previous</button>
            <span>Page {{ adminPage }} / {{ totalAdminPages }}</span>
            <button class="btn btn-secondary" :disabled="adminPage >= totalAdminPages" @click="loadAdminArticles(adminPage + 1)">Next</button>
          </div>
        </section>

        <section v-if="route.path === '/admin/articles/new' || /^\/admin\/articles\/\d+$/.test(route.path)" class="panel admin-section">
          <div class="section-head">
            <div>
              <p class="eyebrow">Article Editor</p>
              <h1 class="section-title">{{ isEditingArticle ? 'Edit Article' : 'Create Article' }}</h1>
            </div>
            <div class="hero-actions">
              <button class="btn btn-secondary" @click="navigate('/admin/articles')">Back</button>
              <button v-if="isEditingArticle" class="btn btn-secondary" :disabled="busy" @click="deleteCurrentArticle">Delete</button>
              <button class="btn btn-primary" :disabled="busy" @click="saveArticle">Save</button>
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
              <input v-model="articleForm.cover_image" type="text" />
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

          <div class="upload-inline panel">
            <div>
              <span class="meta-label">Upload cover</span>
              <p class="sidebar-copy">Uploaded images are available for admin editing.</p>
            </div>
            <input type="file" accept="image/*" @change="uploadImage" />
          </div>
        </section>

        <section v-if="route.path === '/admin/users'" class="panel admin-section">
          <div class="section-head">
            <div>
              <p class="eyebrow">Account Manager</p>
              <h1 class="section-title">Users</h1>
            </div>
            <button class="btn btn-primary" @click="navigate('/admin/users/new')">New user</button>
          </div>
          <div v-if="usersLoading" class="panel placeholder-card">Loading users...</div>
          <div v-else class="list-panel">
            <article v-for="user in adminUsers" :key="user.id" class="post-row admin-post-row">
              <span>#{{ user.id }}</span>
              <strong>{{ user.nickname }}</strong>
              <span>{{ user.username }}</span>
              <span>{{ user.role }}</span>
              <span>{{ user.status }}</span>
              <div class="hero-actions">
                <button class="btn btn-secondary" @click="navigate(`/admin/users/${user.id}`)">Edit</button>
                <button class="btn btn-secondary" @click="toggleAdminUserStatus(user)">
                  {{ user.status === 'active' ? 'Disable' : 'Enable' }}
                </button>
              </div>
            </article>
          </div>
          <div class="pagination">
            <button class="btn btn-secondary" :disabled="adminUsersPage <= 1" @click="loadAdminUsers(adminUsersPage - 1)">Previous</button>
            <span>Page {{ adminUsersPage }} / {{ totalAdminUserPages }}</span>
            <button class="btn btn-secondary" :disabled="adminUsersPage >= totalAdminUserPages" @click="loadAdminUsers(adminUsersPage + 1)">Next</button>
          </div>
        </section>

        <section v-if="route.path === '/admin/users/new' || /^\/admin\/users\/\d+$/.test(route.path)" class="panel admin-section">
          <div class="section-head">
            <div>
              <p class="eyebrow">User Editor</p>
              <h1 class="section-title">{{ isEditingAdminUser ? 'Edit User' : 'Create User' }}</h1>
            </div>
            <div class="hero-actions">
              <button class="btn btn-secondary" @click="navigate('/admin/users')">Back</button>
              <button v-if="isEditingAdminUser" class="btn btn-secondary" @click="resetAdminUserForm">Reset form</button>
              <button class="btn btn-primary" :disabled="busy" @click="saveAdminUser">Save user</button>
            </div>
          </div>
          <div class="editor-grid">
            <label>
              <span>Username</span>
              <input v-model="adminUserForm.username" type="text" :disabled="isEditingAdminUser" />
            </label>
            <label>
              <span>Nickname</span>
              <input v-model="adminUserForm.nickname" type="text" />
            </label>
            <label>
              <span>Role</span>
              <select v-model="adminUserForm.role">
                <option value="admin">admin</option>
                <option value="member">member</option>
              </select>
            </label>
            <label>
              <span>Status</span>
              <select v-model="adminUserForm.status">
                <option value="active">active</option>
                <option value="disabled">disabled</option>
              </select>
            </label>
            <label class="full">
              <span>Avatar URL</span>
              <input v-model="adminUserForm.avatar" type="text" />
            </label>
            <label class="full">
              <span>Bio</span>
              <textarea v-model="adminUserForm.bio" rows="4"></textarea>
            </label>
            <label v-if="!isEditingAdminUser" class="full">
              <span>Initial password</span>
              <input v-model="adminUserForm.password" type="password" />
            </label>
          </div>

          <div v-if="isEditingAdminUser" class="upload-inline panel">
            <div>
              <span class="meta-label">Reset password</span>
              <p class="sidebar-copy">Set a new password for this account.</p>
            </div>
            <input v-model="adminUserPasswordForm.password" type="password" placeholder="New password" />
            <button class="btn btn-primary" :disabled="busy" @click="resetAdminUserPassword">Reset password</button>
          </div>
        </section>

        <section v-if="route.path === '/admin/categories'" class="panel admin-section">
          <div class="section-head">
            <div>
              <p class="eyebrow">Taxonomy</p>
              <h1 class="section-title">Categories</h1>
            </div>
          </div>
          <div class="editor-grid">
            <label>
              <span>Name</span>
              <input v-model="categoryForm.name" type="text" />
            </label>
            <label>
              <span>Slug</span>
              <input v-model="categoryForm.slug" type="text" />
            </label>
            <label>
              <span>Sort order</span>
              <input v-model.number="categoryForm.sort_order" type="number" />
            </label>
            <label class="full">
              <span>Description</span>
              <textarea v-model="categoryForm.description" rows="3"></textarea>
            </label>
          </div>
          <button class="btn btn-primary" :disabled="busy" @click="createCategory">Create category</button>
          <div class="table-list">
            <article v-for="category in categories" :key="category.id" class="panel mini-card">
              <strong>{{ category.name }}</strong>
              <span>{{ category.slug }}</span>
              <p>{{ category.description || 'No description' }}</p>
            </article>
          </div>
        </section>

        <section v-if="route.path === '/admin/tags'" class="panel admin-section">
          <div class="section-head">
            <div>
              <p class="eyebrow">Tag Manager</p>
              <h1 class="section-title">Tags</h1>
            </div>
          </div>
          <div class="editor-grid">
            <label>
              <span>Name</span>
              <input v-model="tagForm.name" type="text" />
            </label>
            <label>
              <span>Slug</span>
              <input v-model="tagForm.slug" type="text" />
            </label>
          </div>
          <button class="btn btn-primary" :disabled="busy" @click="createTag">Create tag</button>
          <div class="chip-row">
            <span v-for="tag in tags" :key="tag.id" class="chip">#{{ tag.name }}</span>
          </div>
        </section>

        <section v-if="route.path === '/admin/settings'" class="panel admin-section">
          <div class="section-head">
            <div>
              <p class="eyebrow">Site Config</p>
              <h1 class="section-title">Settings</h1>
            </div>
            <button class="btn btn-primary" :disabled="busy" @click="saveSiteSettings">Save settings</button>
          </div>
          <div class="editor-grid">
            <label v-for="item in siteSettingsForm" :key="item.key" class="full">
              <span>{{ item.key }}</span>
              <input v-model="item.value" type="text" />
              <small>{{ item.description || 'No description' }}</small>
            </label>
          </div>
        </section>

        <section v-if="route.path === '/admin/upload'" class="panel admin-section">
          <div class="section-head">
            <div>
              <p class="eyebrow">Media Upload</p>
              <h1 class="section-title">Upload</h1>
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
  </main>
</template>
