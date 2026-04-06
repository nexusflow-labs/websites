<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import NxInput from '@/components/ui/NxInput.vue';
import NxButton from '@/components/ui/NxButton.vue';

const authStore = useAuthStore();

const email = ref('');
const success = ref(false);
const message = ref('');

const isValid = computed(() => email.value.includes('@'));

async function handleSubmit() {
  if (!isValid.value) return;

  try {
    message.value = await authStore.forgotPassword(email.value);
    success.value = true;
  } catch {
    // Error is handled by the store
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Forgot your password?
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-8">
        <div v-if="success" class="text-center py-4">
          <div class="w-16 h-16 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Check your email</h3>
          <p class="text-gray-600 dark:text-gray-400 mt-2 text-sm">
            {{ message }}
          </p>
          <router-link
            to="/login"
            class="mt-6 inline-block text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
          >
            Back to login
          </router-link>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <div v-if="authStore.error" class="p-4 bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400 rounded-lg text-sm">
            {{ authStore.error }}
          </div>

          <NxInput
            v-model="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            required
          />

          <NxButton
            type="submit"
            variant="primary"
            size="lg"
            class="w-full"
            :loading="authStore.isLoading"
            :disabled="!isValid"
          >
            Send reset link
          </NxButton>
        </form>

        <p v-if="!success" class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Remember your password?
          <router-link
            to="/login"
            class="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
          >
            Sign in
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
