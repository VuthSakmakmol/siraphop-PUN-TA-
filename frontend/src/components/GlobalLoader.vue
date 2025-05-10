<!-- src/components/GlobalLoader.vue -->
<template>
  <v-overlay :model-value="loading" class="d-flex align-center justify-center" persistent>
    <v-progress-circular indeterminate size="64" color="primary" />
  </v-overlay>
</template>

<script setup>
defineProps({
  loading: Boolean
})
</script>
