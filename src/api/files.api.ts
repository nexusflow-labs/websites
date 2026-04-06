import http from './http';
import type {
  FileUpload,
  RegisterUploadRequest,
  RegisterUploadResponse,
  DownloadUrlResponse,
} from '@/types';

export const filesApi = {
  /**
   * Register a file for upload
   */
  async register(data: RegisterUploadRequest): Promise<RegisterUploadResponse> {
    const response = await http.post<RegisterUploadResponse>('/files/register', data);
    return response.data;
  },

  /**
   * Upload file to the pre-signed URL
   */
  async uploadToUrl(url: string, file: File): Promise<void> {
    await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
  },

  /**
   * Attach file to task
   */
  async attachToTask(taskId: string, fileId: string): Promise<FileUpload> {
    const response = await http.post<FileUpload>(`/tasks/${taskId}/attachments`, { fileId });
    return response.data;
  },

  /**
   * Get task attachments
   */
  async getTaskAttachments(taskId: string): Promise<FileUpload[]> {
    const response = await http.get<FileUpload[]>(`/tasks/${taskId}/attachments`);
    return response.data;
  },

  /**
   * Get download URL for a file
   */
  async getDownloadUrl(fileId: string): Promise<DownloadUrlResponse> {
    const response = await http.get<DownloadUrlResponse>(`/files/${fileId}/download`);
    return response.data;
  },

  /**
   * Delete a file
   */
  async delete(fileId: string): Promise<void> {
    await http.delete(`/files/${fileId}`);
  },
};
