<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { filesApi } from '@/api/files.api';
import { useToast } from '@/composables/useToast';
import { formatDate } from '@/utils';
import NxButton from '@/components/ui/NxButton.vue';
import NxSpinner from '@/components/ui/NxSpinner.vue';
import type { FileUpload } from '@/types';

interface Props {
  taskId: string;
  workspaceId: string;
}

const props = defineProps<Props>();

const toast = useToast();

const attachments = ref<FileUpload[]>([]);
const isLoading = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);
const isDragging = ref(false);
const deletingFileId = ref<string | null>(null);

// File type icons
function getFileIcon(contentType: string): string {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  if (contentType.includes('pdf')) return 'pdf';
  if (contentType.includes('word') || contentType.includes('document')) return 'doc';
  if (contentType.includes('sheet') || contentType.includes('excel')) return 'sheet';
  if (contentType.includes('presentation') || contentType.includes('powerpoint')) return 'presentation';
  if (contentType.includes('zip') || contentType.includes('archive') || contentType.includes('compressed')) return 'archive';
  return 'file';
}

function getFileIconPath(type: string): string {
  const icons: Record<string, string> = {
    image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    video: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    audio: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
    pdf: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    doc: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    sheet: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
    presentation: 'M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
    archive: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
    file: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  };
  return icons[type] || icons.file;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown size';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

async function loadAttachments() {
  isLoading.value = true;
  try {
    attachments.value = await filesApi.getTaskAttachments(props.taskId);
  } catch (error) {
    toast.error('Failed to load attachments');
  } finally {
    isLoading.value = false;
  }
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    await uploadFile(target.files[0]);
    target.value = ''; // Reset input
  }
}

async function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;

  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    await uploadFile(event.dataTransfer.files[0]);
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  isDragging.value = true;
}

function handleDragLeave() {
  isDragging.value = false;
}

async function uploadFile(file: File) {
  isUploading.value = true;
  uploadProgress.value = 0;

  try {
    // Register upload
    const registration = await filesApi.register({
      filename: file.name,
      contentType: file.type,
      workspaceId: props.workspaceId,
    });

    uploadProgress.value = 30;

    // Upload to pre-signed URL
    await filesApi.uploadToUrl(registration.uploadUrl, file);

    uploadProgress.value = 70;

    // Attach to task
    const attachment = await filesApi.attachToTask(props.taskId, registration.id);

    uploadProgress.value = 100;

    // Add to list
    attachments.value.unshift(attachment);

    toast.success('File uploaded successfully');
  } catch (error) {
    toast.error('Failed to upload file');
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;
  }
}

async function downloadFile(fileId: string) {
  try {
    const { downloadUrl } = await filesApi.getDownloadUrl(fileId);
    window.open(downloadUrl, '_blank');
  } catch (error) {
    toast.error('Failed to get download link');
  }
}

async function deleteFile(fileId: string) {
  deletingFileId.value = fileId;
  try {
    await filesApi.delete(fileId);
    attachments.value = attachments.value.filter((a) => a.id !== fileId);
    toast.success('File deleted');
  } catch (error) {
    toast.error('Failed to delete file');
  } finally {
    deletingFileId.value = null;
  }
}

onMounted(() => {
  loadAttachments();
});
</script>

<template>
  <div class="space-y-4">
    <!-- Upload Zone -->
    <div
      :class="[
        'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
        isDragging
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-300 dark:border-gray-600 hover:border-primary-400',
        isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer',
      ]"
      @click="($refs.fileInput as HTMLInputElement).click()"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        @change="handleFileSelect"
      >

      <template v-if="isUploading">
        <NxSpinner class="mx-auto" />
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Uploading... {{ uploadProgress }}%
        </p>
        <div class="mt-2 w-full max-w-xs mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="bg-primary-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${uploadProgress}%` }"
          />
        </div>
      </template>

      <template v-else>
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
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span class="font-medium text-primary-600 dark:text-primary-400">Click to upload</span>
          or drag and drop
        </p>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">
          Any file up to 10MB
        </p>
      </template>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex justify-center py-8"
    >
      <NxSpinner />
    </div>

    <!-- Attachments List -->
    <template v-else>
      <!-- Empty State -->
      <div
        v-if="attachments.length === 0"
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
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No attachments yet
        </p>
      </div>

      <!-- File List -->
      <div
        v-else
        class="space-y-2"
      >
        <div
          v-for="file in attachments"
          :key="file.id"
          class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <!-- File Icon -->
          <div class="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-600">
            <svg
              class="w-5 h-5 text-gray-600 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="getFileIconPath(getFileIcon(file.contentType))"
              />
            </svg>
          </div>

          <!-- File Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ file.filename }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatFileSize(file.size) }}
              <span v-if="file.attachedAt">
                &middot; {{ formatDate(file.attachedAt) }}
              </span>
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1">
            <button
              class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
              title="Download"
              @click="downloadFile(file.id)"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
            <button
              class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
              title="Delete"
              :disabled="deletingFileId === file.id"
              @click="deleteFile(file.id)"
            >
              <NxSpinner
                v-if="deletingFileId === file.id"
                size="sm"
              />
              <svg
                v-else
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
