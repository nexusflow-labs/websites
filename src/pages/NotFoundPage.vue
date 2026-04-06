<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goHome() {
  router.push('/');
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
    <div class="text-center">
      <h1 class="text-9xl font-bold text-gray-200 dark:text-gray-800">404</h1>
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mt-4">
        Page Not Found
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mt-2 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        class="mt-8 btn bg-primary-600 text-white hover:bg-primary-700 px-6 py-3 rounded-lg font-medium"
        @click="goHome"
      >
        Go Home
      </button>
    </div>
  </div>
</template>
