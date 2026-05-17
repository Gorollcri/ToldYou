<script setup lang="ts">
import { useBlogAppContext } from '../../appContext'

const app = useBlogAppContext()
const { emailUrl, githubUrl, navigate, pageTitle } = app
</script>

<template>
  <footer class="footer panel">
    <p>© 2026 {{ pageTitle }}</p>
    <div class="footer-links">
      <a :href="githubUrl" target="_blank" rel="noreferrer">GitHub</a>
      <a :href="emailUrl">Email</a>
      <button @click="navigate('/admin')">Admin</button>
    </div>
  </footer>
</template>
