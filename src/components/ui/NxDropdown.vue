<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue';

interface DropdownItem {
  label: string;
  icon?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

interface Props {
  items?: (DropdownItem | 'divider')[];
  align?: 'left' | 'right';
}

withDefaults(defineProps<Props>(), {
  align: 'right',
});
</script>

<template>
  <Menu
    as="div"
    class="relative inline-block text-left"
  >
    <MenuButton as="template">
      <slot name="trigger">
        <button
          class="inline-flex items-center justify-center rounded-lg p-2
                 text-gray-500 hover:text-gray-700 hover:bg-gray-100
                 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </slot>
    </MenuButton>

    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <MenuItems
        :class="[
          'absolute z-10 mt-2 w-56 origin-top-right',
          'rounded-lg bg-white dark:bg-gray-800',
          'shadow-lg',
          'focus:outline-none',
          align === 'right' ? 'right-0' : 'left-0'
        ]"
      >
        <!-- Slot-based content -->
        <slot
          v-if="$slots.content"
          name="content"
        />

        <!-- Items-based content -->
        <template v-else-if="items">
          <div class="py-1">
            <template
              v-for="(item, index) in items"
              :key="index"
            >
              <div
                v-if="item === 'divider'"
                class="my-1 border-t border-gray-200 dark:border-gray-700"
              />
              <MenuItem
                v-else
                v-slot="{ active }"
                :disabled="item.disabled"
              >
                <button
                  :class="[
                    'flex w-full items-center px-4 py-2 text-sm',
                    active ? 'bg-gray-100 dark:bg-gray-700' : '',
                    item.danger
                      ? 'text-danger-600 dark:text-danger-400'
                      : 'text-gray-700 dark:text-gray-300',
                    item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                  ]"
                  :disabled="item.disabled"
                  @click="item.onClick?.()"
                >
                  <span
                    v-if="item.icon"
                    class="mr-3"
                    v-html="item.icon"
                  />
                  {{ item.label }}
                </button>
              </MenuItem>
            </template>
          </div>
        </template>
      </MenuItems>
    </transition>
  </Menu>
</template>
