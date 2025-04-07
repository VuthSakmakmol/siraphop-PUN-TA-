<template>
  <DefaultLayout v-if="isLoggedIn" />
  <router-view v-else />
</template>

<script setup>
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { computed } from 'vue'

const isLoggedIn = computed(() => !!localStorage.getItem('token'))
</script>
