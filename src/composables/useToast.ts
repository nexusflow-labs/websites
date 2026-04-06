import { ref, readonly } from 'vue';

export interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  duration?: number;
}

const toasts = ref<Toast[]>([]);

export function useToast() {
  function addToast(toast: Omit<Toast, 'id'>): string {
    const id = Math.random().toString(36).slice(2, 9);
    toasts.value.push({ ...toast, id });
    return id;
  }

  function removeToast(id: string): void {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  }

  function info(message: string, title?: string, duration?: number): string {
    return addToast({ type: 'info', message, title, duration });
  }

  function success(message: string, title?: string, duration?: number): string {
    return addToast({ type: 'success', message, title, duration });
  }

  function warning(message: string, title?: string, duration?: number): string {
    return addToast({ type: 'warning', message, title, duration });
  }

  function error(message: string, title?: string, duration?: number): string {
    return addToast({ type: 'error', message, title, duration });
  }

  function clearAll(): void {
    toasts.value = [];
  }

  return {
    toasts: readonly(toasts),
    addToast,
    removeToast,
    info,
    success,
    warning,
    error,
    clearAll,
  };
}
