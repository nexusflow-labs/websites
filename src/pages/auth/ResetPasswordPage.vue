<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import NxInput from '@/components/ui/NxInput.vue';
import NxButton from '@/components/ui/NxButton.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const token = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const success = ref(false);

onMounted(() => {
  token.value = route.query.token as string || '';
  if (!token.value) {
    router.push('/forgot-password');
  }
});

const passwordValidation = computed(() => {
  const pwd = password.value;
  return {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  };
});

const isPasswordValid = computed(() => {
  return Object.values(passwordValidation.value).every(Boolean);
});

const isValid = computed(() => {
  return isPasswordValid.value && password.value === confirmPassword.value;
});

async function handleSubmit() {
  if (!isValid.value) return;

  try {
    await authStore.resetPassword(token.value, password.value);
    success.value = true;
    setTimeout(() => {
      router.push('/login');
    }, 3000);
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
          Reset your password
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Enter your new password below
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-8">
        <div v-if="success" class="text-center py-8">
          <div class="w-16 h-16 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Password reset successful!</h3>
          <p class="text-gray-600 dark:text-gray-400 mt-2">Redirecting to login...</p>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <div v-if="authStore.error" class="p-4 bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400 rounded-lg text-sm">
            {{ authStore.error }}
          </div>

          <div>
            <NxInput
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              label="New password"
              placeholder="Enter new password"
              required
            />

            <div class="mt-2 space-y-1 text-xs">
              <div :class="passwordValidation.length ? 'text-success-600' : 'text-gray-400'">
                <span>{{ passwordValidation.length ? '✓' : '○' }}</span> At least 8 characters
              </div>
              <div :class="passwordValidation.uppercase ? 'text-success-600' : 'text-gray-400'">
                <span>{{ passwordValidation.uppercase ? '✓' : '○' }}</span> One uppercase letter
              </div>
              <div :class="passwordValidation.lowercase ? 'text-success-600' : 'text-gray-400'">
                <span>{{ passwordValidation.lowercase ? '✓' : '○' }}</span> One lowercase letter
              </div>
              <div :class="passwordValidation.number ? 'text-success-600' : 'text-gray-400'">
                <span>{{ passwordValidation.number ? '✓' : '○' }}</span> One number
              </div>
              <div :class="passwordValidation.special ? 'text-success-600' : 'text-gray-400'">
                <span>{{ passwordValidation.special ? '✓' : '○' }}</span> One special character
              </div>
            </div>
          </div>

          <NxInput
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            label="Confirm new password"
            placeholder="Confirm new password"
            :error="confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined"
            required
          />

          <label class="flex items-center">
            <input
              type="checkbox"
              v-model="showPassword"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Show password</span>
          </label>

          <NxButton
            type="submit"
            variant="primary"
            size="lg"
            class="w-full"
            :loading="authStore.isLoading"
            :disabled="!isValid"
          >
            Reset password
          </NxButton>
        </form>
      </div>
    </div>
  </div>
</template>
