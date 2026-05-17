<script setup lang="ts">
import { useBlogAppContext } from '../../appContext'

const app = useBlogAppContext()
const { navigate, pageTitle, route, theme, toggleTheme } = app
</script>

<template>
  <header class="topbar">
    <button class="brand" @click="navigate('/')">
      {{ pageTitle }}<span>.</span>
    </button>

    <nav class="topnav">
      <button :class="{ active: route.name === 'home' }" @click="navigate('/')">首页</button>
      <button :class="{ active: route.name === 'articles' || route.name === 'article-detail' }" @click="navigate('/articles')">
        帖子
      </button>
      <button :class="{ active: route.name === 'projects' }" @click="navigate('/projects')">项目</button>
      <button :class="{ active: route.name === 'about' }" @click="navigate('/about')">关于我</button>
      <!-- <button :class="{ active: route.name === 'admin' }" @click="navigate('/admin')">Admin</button> -->
    </nav>

    <button class="theme-toggle" @click="toggleTheme()">
      {{ theme === 'light' ? '◐' : '◑' }}
    </button>
  </header>
</template>
