<script setup lang="ts">
import { useBlogAppContext } from '../../appContext'

const app = useBlogAppContext()
const { currentUser, isAdmin, navigate, logout, pageTitle, route, theme, toggleTheme } = app
</script>

<template>
  <header class="topbar">
    <button class="brand" @click="navigate('/')">
      {{ pageTitle }}<span>.</span>
    </button>

    <nav class="topnav">
      <button :class="{ active: route.name === 'home' }" @click="navigate('/')">Home</button>
      <button :class="{ active: route.name === 'articles' || route.name === 'article-detail' }" @click="navigate('/articles')">
        Articles
      </button>
      <button :class="{ active: route.name === 'projects' }" @click="navigate('/projects')">Projects</button>
      <button :class="{ active: route.name === 'about' }" @click="navigate('/about')">About</button>
      <button
        :class="{ active: route.name === 'me' || route.name.startsWith('me-') }"
        @click="navigate('/me')"
      >
        Me
      </button>
      <button v-if="isAdmin" @click="navigate('/admin')">Admin</button>
    </nav>

    <div class="hero-actions">
      <span v-if="currentUser" class="chip">{{ currentUser.nickname }}</span>
      <button class="btn btn-secondary" @click="logout">Logout</button>
      <button class="theme-toggle" @click="toggleTheme()">
        {{ theme === 'light' ? 'Moon' : 'Sun' }}
      </button>
    </div>
  </header>
</template>
