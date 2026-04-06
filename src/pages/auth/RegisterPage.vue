<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import NxInput from '@/components/ui/NxInput.vue';
import NxButton from '@/components/ui/NxButton.vue';

const router = useRouter();
const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const acceptTerms = ref(false);
const showPassword = ref(false);
const success = ref(false);

// Password validation
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
  return (
    name.value.length >= 3 &&
    email.value.includes('@') &&
    isPasswordValid.value &&
    password.value === confirmPassword.value &&
    acceptTerms.value
  );
});

async function handleSubmit() {
  if (!isValid.value) return;

  try {
    await authStore.register({
      name: name.value,
      email: email.value,
      password: password.value,
    });
    success.value = true;
    setTimeout(() => {
      router.push('/login');
    }, 2000);
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
          Create your account
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Get started with NexusFlow
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-8">
        <div v-if="success" class="text-center py-8">
          <div class="w-16 h-16 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Registration successful!</h3>
          <p class="text-gray-600 dark:text-gray-400 mt-2">Redirecting to login...</p>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <div v-if="authStore.error" class="p-4 bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400 rounded-lg text-sm">
            {{ authStore.error }}
          </div>

          <NxInput
            v-model="name"
            type="text"
            label="Full name"
            placeholder="John Doe"
            required
          />

          <NxInput
            v-model="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            required
          />

          <div>
            <NxInput
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              label="Password"
              placeholder="Create a password"
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
            label="Confirm password"
            placeholder="Confirm your password"
            :error="confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined"
            required
          />

          <label class="flex items-start">
            <input
              type="checkbox"
              v-model="acceptTerms"
              class="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
              I agree to the
              <a href="#" class="text-primary-600 hover:text-primary-700 dark:text-primary-400">Terms of Service</a>
              and
              <a href="#" class="text-primary-600 hover:text-primary-700 dark:text-primary-400">Privacy Policy</a>
            </span>
          </label>

          <NxButton
            type="submit"
            variant="primary"
            size="lg"
            class="w-full"
            :loading="authStore.isLoading"
            :disabled="!isValid"
          >
            Create account
          </NxButton>
        </form>

        <p v-if="!success" class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?
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
