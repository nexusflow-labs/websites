import { ref, onMounted, onUnmounted, watch } from 'vue';
import {
  connect,
  disconnect,
  getConnectionState,
  onConnectionStateChange,
  on,
  joinWorkspace,
  leaveWorkspace,
  joinProject,
  leaveProject,
  joinTask,
  leaveTask,
  startTyping,
  stopTyping,
  type ConnectionState,
  type SocketEvents,
} from '@/api/socket';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Composable for WebSocket connection management
 */
export function useWebSocket() {
  const connectionState = ref<ConnectionState>(getConnectionState());
  const authStore = useAuthStore();

  onMounted(() => {
    // Subscribe to connection state changes
    const unsubscribe = onConnectionStateChange((state) => {
      connectionState.value = state;
    });

    // Connect if authenticated
    if (authStore.isAuthenticated) {
      connect();
    }

    // Watch for auth changes
    const stopWatch = watch(
      () => authStore.isAuthenticated,
      (isAuthenticated) => {
        if (isAuthenticated) {
          connect();
        } else {
          disconnect();
        }
      }
    );

    onUnmounted(() => {
      unsubscribe();
      stopWatch();
    });
  });

  return {
    connectionState,
    connect,
    disconnect,
  };
}

/**
 * Composable for workspace room
 */
export function useWorkspaceRoom(workspaceId: () => string | undefined) {
  onMounted(() => {
    const id = workspaceId();
    if (id) {
      joinWorkspace(id);
    }
  });

  onUnmounted(() => {
    const id = workspaceId();
    if (id) {
      leaveWorkspace(id);
    }
  });

  // Watch for workspace ID changes
  watch(workspaceId, (newId, oldId) => {
    if (oldId) {
      leaveWorkspace(oldId);
    }
    if (newId) {
      joinWorkspace(newId);
    }
  });
}

/**
 * Composable for project room
 */
export function useProjectRoom(projectId: () => string | undefined) {
  onMounted(() => {
    const id = projectId();
    if (id) {
      joinProject(id);
    }
  });

  onUnmounted(() => {
    const id = projectId();
    if (id) {
      leaveProject(id);
    }
  });

  watch(projectId, (newId, oldId) => {
    if (oldId) {
      leaveProject(oldId);
    }
    if (newId) {
      joinProject(newId);
    }
  });
}

/**
 * Composable for task room
 */
export function useTaskRoom(taskId: () => string | undefined, projectId: () => string) {
  onMounted(() => {
    const id = taskId();
    if (id) {
      joinTask(id, projectId());
    }
  });

  onUnmounted(() => {
    const id = taskId();
    if (id) {
      leaveTask(id);
    }
  });

  watch(taskId, (newId, oldId) => {
    if (oldId) {
      leaveTask(oldId);
    }
    if (newId) {
      joinTask(newId, projectId());
    }
  });
}

/**
 * Composable for subscribing to socket events
 */
export function useSocketEvent<K extends keyof SocketEvents>(
  event: K,
  handler: (data: SocketEvents[K]) => void
) {
  onMounted(() => {
    const unsubscribe = on(event, handler);
    onUnmounted(unsubscribe);
  });
}

/**
 * Composable for typing indicators
 */
export function useTypingIndicator(taskId: () => string) {
  const typingUsers = ref<Set<string>>(new Set());
  const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  onMounted(() => {
    const unsubStart = on('user:typing', ({ taskId: eventTaskId, userId }) => {
      if (eventTaskId === taskId()) {
        typingUsers.value.add(userId);

        // Clear existing timeout
        const existing = timeouts.get(userId);
        if (existing) {
          clearTimeout(existing);
        }

        // Auto-clear after 5 seconds
        timeouts.set(
          userId,
          setTimeout(() => {
            typingUsers.value.delete(userId);
            timeouts.delete(userId);
          }, 5000)
        );
      }
    });

    const unsubStop = on('user:stop_typing', ({ taskId: eventTaskId, userId }) => {
      if (eventTaskId === taskId()) {
        typingUsers.value.delete(userId);
        const timeout = timeouts.get(userId);
        if (timeout) {
          clearTimeout(timeout);
          timeouts.delete(userId);
        }
      }
    });

    onUnmounted(() => {
      unsubStart();
      unsubStop();
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    });
  });

  return {
    typingUsers,
    startTyping: () => startTyping(taskId()),
    stopTyping: () => stopTyping(taskId()),
  };
}
