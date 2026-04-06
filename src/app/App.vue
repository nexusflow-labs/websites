<script setup lang="ts">
import { useToast } from '@/composables/useToast';
import NxToast from '@/components/ui/NxToast.vue';

const { toasts, removeToast } = useToast();
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <router-view />

    <!-- Toast Container -->
    <div class="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full">
      <NxToast
        v-for="toast in toasts"
        :key="toast.id"
        :type="toast.type"
        :title="toast.title"
        :message="toast.message"
        :duration="toast.duration"
        @dismiss="removeToast(toast.id)"
      />
    </div>
  </div>
</template>
