<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const token = ref('');

onMounted(() => {
  token.value = route.query.token as string || '';
  if (!token.value) {
    router.push('/');
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-soft p-8 text-center">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Workspace Invitation
      </h1>
      <p class="text-gray-500 dark:text-gray-500 mt-4">
        Invitation handling will be implemented in Phase 3.
      </p>
      <p class="text-sm text-gray-400 mt-2">
        Token: {{ token.slice(0, 20) }}...
      </p>
    </div>
  </div>
</template>
