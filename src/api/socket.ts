import { io, Socket } from 'socket.io-client';
import { tokenManager } from './http';
import type { Task, CommentWithUser, Project, MemberWithUser, Invitation, Member } from '@/types';

const WS_URL = import.meta.env.VITE_WS_URL;

// Socket instance
let socket: Socket | null = null;

// Connection state
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
let connectionState: ConnectionState = 'disconnected';
const stateListeners: Set<(state: ConnectionState) => void> = new Set();

// Event types for type safety
export interface SocketEvents {
  // Task events
  'task:created': { task: Task };
  'task:updated': { task: Task; changes: Record<string, unknown>; updatedBy: string };
  'task:deleted': { taskId: string; deletedBy: string };
  'task:assigned': {
    taskId: string;
    assigneeId: string | null;
    previousAssigneeId: string | null;
    assignedBy: string;
  };

  // Comment events
  'comment:created': { comment: CommentWithUser };
  'comment:updated': { comment: CommentWithUser; updatedBy: string };
  'comment:deleted': { commentId: string; deletedBy: string };

  // Project events
  'project:created': { project: Project };
  'project:updated': { project: Project; changes: Record<string, unknown>; updatedBy: string };
  'project:deleted': { projectId: string; deletedBy: string };

  // Member events
  'member:added': { member: MemberWithUser; addedBy: string };
  'member:removed': { memberId: string; userId: string; removedBy: string };
  'member:role_changed': {
    memberId: string;
    userId: string;
    oldRole: string;
    newRole: string;
    changedBy: string;
  };

  // Invitation events
  'invitation:received': { invitation: Invitation };
  'invitation:accepted': { invitation: Invitation; member: Member };
  'invitation:rejected': { invitation: Invitation };

  // Typing events
  'user:typing': { taskId: string; userId: string };
  'user:stop_typing': { taskId: string; userId: string };
}

// Event handlers storage
const eventHandlers: Map<string, Set<(data: unknown) => void>> = new Map();

/**
 * Initialize socket connection
 */
export function connect(): void {
  if (socket?.connected) {
    return;
  }

  const token = tokenManager.getAccessToken();
  if (!token) {
    console.warn('[Socket] No access token, cannot connect');
    return;
  }

  setConnectionState('connecting');

  socket = io(WS_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  // Connection events
  socket.on('connect', () => {
    console.log('[Socket] Connected');
    setConnectionState('connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    setConnectionState('disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
    setConnectionState('error');
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
    setConnectionState('connected');
  });

  socket.on('reconnect_error', (error) => {
    console.error('[Socket] Reconnection error:', error.message);
  });

  socket.on('reconnect_failed', () => {
    console.error('[Socket] Reconnection failed');
    setConnectionState('error');
  });

  // Forward all events to registered handlers
  socket.onAny((event: string, data: unknown) => {
    const handlers = eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  });
}

/**
 * Disconnect socket
 */
export function disconnect(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    setConnectionState('disconnected');
  }
}

/**
 * Get current connection state
 */
export function getConnectionState(): ConnectionState {
  return connectionState;
}

/**
 * Subscribe to connection state changes
 */
export function onConnectionStateChange(callback: (state: ConnectionState) => void): () => void {
  stateListeners.add(callback);
  return () => stateListeners.delete(callback);
}

function setConnectionState(state: ConnectionState): void {
  connectionState = state;
  stateListeners.forEach((listener) => listener(state));
}

/**
 * Subscribe to a socket event
 */
export function on<K extends keyof SocketEvents>(
  event: K,
  handler: (data: SocketEvents[K]) => void
): () => void {
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, new Set());
  }
  eventHandlers.get(event)!.add(handler as (data: unknown) => void);

  // Return unsubscribe function
  return () => {
    eventHandlers.get(event)?.delete(handler as (data: unknown) => void);
  };
}

/**
 * Remove all handlers for an event
 */
export function off<K extends keyof SocketEvents>(event: K): void {
  eventHandlers.delete(event);
}

// Room management
export function joinWorkspace(workspaceId: string): void {
  socket?.emit('workspace:join', { workspaceId });
}

export function leaveWorkspace(workspaceId: string): void {
  socket?.emit('workspace:leave', { workspaceId });
}

export function joinProject(projectId: string): void {
  socket?.emit('project:join', { projectId });
}

export function leaveProject(projectId: string): void {
  socket?.emit('project:leave', { projectId });
}

export function joinTask(taskId: string, projectId: string): void {
  socket?.emit('task:join', { taskId, projectId });
}

export function leaveTask(taskId: string): void {
  socket?.emit('task:leave', { taskId });
}

// Typing indicators
export function startTyping(taskId: string): void {
  socket?.emit('typing:start', { taskId });
}

export function stopTyping(taskId: string): void {
  socket?.emit('typing:stop', { taskId });
}

// Export socket instance for advanced use cases
export function getSocket(): Socket | null {
  return socket;
}
