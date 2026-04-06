<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import NxInput from '@/components/ui/NxInput.vue';
import NxButton from '@/components/ui/NxButton.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);

const isValid = computed(() => {
  return email.value.includes('@') && password.value.length >= 8;
});

async function handleSubmit() {
  if (!isValid.value) return;

  try {
    await authStore.login({ email: email.value, password: password.value });
    const redirect = route.query.redirect as string || '/';
    router.push(redirect);
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
          Welcome back
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Sign in to your account
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl p-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">
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

          <NxInput
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="Password"
            placeholder="Enter your password"
            required
          />

          <div class="flex items-center justify-between">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="showPassword"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Show password</span>
            </label>

            <router-link
              to="/forgot-password"
              class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Forgot password?
            </router-link>
          </div>

          <NxButton
            type="submit"
            variant="primary"
            size="lg"
            class="w-full"
            :loading="authStore.isLoading"
            :disabled="!isValid"
          >
            Sign in
          </NxButton>
        </form>

        <p class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?
          <router-link
            to="/register"
            class="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
          >
            Sign up
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
