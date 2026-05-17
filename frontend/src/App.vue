<script setup lang="ts">
import { provide } from 'vue'

import { blogAppKey } from './appContext'
import AppFooter from './components/layout/AppFooter.vue'
import AppHeader from './components/layout/AppHeader.vue'
import ToastMessage from './components/layout/ToastMessage.vue'
import { useBlogApp } from './composables/useBlogApp'
import AdminSite from './pages/AdminSite.vue'
import PublicSite from './pages/PublicSite.vue'

const app = useBlogApp()
const { route, theme } = app

provide(blogAppKey, app)
</script>

<template>
  <div class="app-shell" :data-theme="theme">
    <div class="aurora aurora-a"></div>
    <div class="aurora aurora-b"></div>
    <div class="aurora aurora-c"></div>

    <AppHeader />
    <PublicSite v-if="route.name !== 'admin'" />
    <AdminSite v-else />
    <AppFooter v-if="route.name !== 'admin'" />
    <ToastMessage />
  </div>
</template>
