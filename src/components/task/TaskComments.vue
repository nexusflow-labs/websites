<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { commentsApi } from '@/api/comments.api';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/composables/useToast';
import { formatRelativeTime } from '@/utils';
import NxButton from '@/components/ui/NxButton.vue';
import NxTextarea from '@/components/ui/NxTextarea.vue';
import NxSpinner from '@/components/ui/NxSpinner.vue';
import NxAvatar from '@/components/ui/NxAvatar.vue';
import type { CommentWithUser, PaginationMeta } from '@/types';

interface Props {
  taskId: string;
}

const props = defineProps<Props>();

const authStore = useAuthStore();
const toast = useToast();

const comments = ref<CommentWithUser[]>([]);
const pagination = ref<PaginationMeta | null>(null);
const isLoading = ref(false);
const isLoadingMore = ref(false);

// New comment
const newComment = ref('');
const isSubmitting = ref(false);

// Edit state
const editingCommentId = ref<string | null>(null);
const editedContent = ref('');
const isSavingEdit = ref(false);

// Delete state
const deletingCommentId = ref<string | null>(null);

const currentUserId = computed(() => authStore.user?.id);

async function loadComments(page = 1) {
  if (page === 1) {
    isLoading.value = true;
  } else {
    isLoadingMore.value = true;
  }

  try {
    const response = await commentsApi.getAll(props.taskId, { page, pageSize: 20 });
    if (page === 1) {
      comments.value = response.items;
    } else {
      comments.value.push(...response.items);
    }
    pagination.value = response.meta;
  } catch (error) {
    toast.error('Failed to load comments');
  } finally {
    isLoading.value = false;
    isLoadingMore.value = false;
  }
}

async function submitComment() {
  if (!newComment.value.trim()) return;

  isSubmitting.value = true;
  try {
    const comment = await commentsApi.create(props.taskId, {
      content: newComment.value.trim(),
    });

    // Add to list with current user info
    const commentWithUser: CommentWithUser = {
      ...comment,
      author: {
        id: authStore.user?.id || '',
        fullName: authStore.user?.fullName || '',
        email: authStore.user?.email || '',
        avatar: authStore.user?.avatar,
      },
    };
    comments.value.unshift(commentWithUser);

    newComment.value = '';
    toast.success('Comment added');
  } catch (error) {
    toast.error('Failed to add comment');
  } finally {
    isSubmitting.value = false;
  }
}

function startEdit(comment: CommentWithUser) {
  editingCommentId.value = comment.id;
  editedContent.value = comment.content;
}

function cancelEdit() {
  editingCommentId.value = null;
  editedContent.value = '';
}

async function saveEdit() {
  if (!editingCommentId.value || !editedContent.value.trim()) return;

  isSavingEdit.value = true;
  try {
    await commentsApi.update(props.taskId, editingCommentId.value, {
      content: editedContent.value.trim(),
    });

    // Update in list
    const index = comments.value.findIndex((c) => c.id === editingCommentId.value);
    if (index !== -1) {
      comments.value[index].content = editedContent.value.trim();
      comments.value[index].updatedAt = new Date().toISOString();
    }

    cancelEdit();
    toast.success('Comment updated');
  } catch (error) {
    toast.error('Failed to update comment');
  } finally {
    isSavingEdit.value = false;
  }
}

async function deleteComment(commentId: string) {
  deletingCommentId.value = commentId;
  try {
    await commentsApi.delete(props.taskId, commentId);
    comments.value = comments.value.filter((c) => c.id !== commentId);
    toast.success('Comment deleted');
  } catch (error) {
    toast.error('Failed to delete comment');
  } finally {
    deletingCommentId.value = null;
  }
}

function loadMore() {
  if (pagination.value?.hasNextPage) {
    loadComments(pagination.value.page + 1);
  }
}

onMounted(() => {
  loadComments();
});
</script>

<template>
  <div class="space-y-4">
    <!-- Add Comment Form -->
    <div class="space-y-2">
      <div class="flex items-start gap-3">
        <NxAvatar
          :name="authStore.user?.fullName"
          :src="authStore.user?.avatar"
          size="sm"
        />
        <div class="flex-1">
          <NxTextarea
            v-model="newComment"
            placeholder="Write a comment..."
            :rows="3"
            :disabled="isSubmitting"
          />
        </div>
      </div>
      <div class="flex justify-end">
        <NxButton
          size="sm"
          :loading="isSubmitting"
          :disabled="!newComment.trim()"
          @click="submitComment"
        >
          Comment
        </NxButton>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex justify-center py-8"
    >
      <NxSpinner />
    </div>

    <!-- Comments List -->
    <template v-else>
      <!-- Empty State -->
      <div
        v-if="comments.length === 0"
        class="text-center py-8"
      >
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No comments yet. Be the first to comment!
        </p>
      </div>

      <!-- Comments -->
      <div
        v-else
        class="space-y-4"
      >
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="flex gap-3"
        >
          <NxAvatar
            :name="comment.author.fullName"
            :src="comment.author.avatar"
            size="sm"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900 dark:text-white">
                {{ comment.author.fullName }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatRelativeTime(comment.createdAt) }}
              </span>
              <span
                v-if="comment.updatedAt !== comment.createdAt"
                class="text-xs text-gray-400 dark:text-gray-500"
              >
                (edited)
              </span>
            </div>

            <!-- Edit Mode -->
            <div
              v-if="editingCommentId === comment.id"
              class="mt-2"
            >
              <NxTextarea
                v-model="editedContent"
                :rows="3"
                :disabled="isSavingEdit"
              />
              <div class="flex gap-2 mt-2">
                <NxButton
                  size="sm"
                  :loading="isSavingEdit"
                  @click="saveEdit"
                >
                  Save
                </NxButton>
                <NxButton
                  size="sm"
                  variant="ghost"
                  :disabled="isSavingEdit"
                  @click="cancelEdit"
                >
                  Cancel
                </NxButton>
              </div>
            </div>

            <!-- Display Mode -->
            <template v-else>
              <p class="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                {{ comment.content }}
              </p>

              <!-- Actions (only for own comments) -->
              <div
                v-if="comment.author.id === currentUserId"
                class="mt-2 flex gap-2"
              >
                <button
                  class="text-xs text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                  @click="startEdit(comment)"
                >
                  Edit
                </button>
                <button
                  class="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  :disabled="deletingCommentId === comment.id"
                  @click="deleteComment(comment.id)"
                >
                  {{ deletingCommentId === comment.id ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </template>
          </div>
        </div>

        <!-- Load More -->
        <div
          v-if="pagination?.hasNextPage"
          class="text-center pt-2"
        >
          <NxButton
            variant="ghost"
            size="sm"
            :loading="isLoadingMore"
            @click="loadMore"
          >
            Load more comments
          </NxButton>
        </div>
      </div>
    </template>
  </div>
</template>
