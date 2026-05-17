<script setup lang="ts">
import { useBlogAppContext } from '../../appContext'

const app = useBlogAppContext()
const { toast } = app
</script>

<template>
  <div v-if="toast" class="toast">{{ toast }}</div>
</template>
