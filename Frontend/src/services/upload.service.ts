import axiosClient from '../config/axiosClient';

interface UploadResponse {
  message: string;
  url: string;
  public_id: string;
  resource_type: string;
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a single file to Cloudinary
 */
const uploadFile = async (file: File): Promise<UploadResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosClient.post<UploadResponse>(
      '/api/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Timeout for large files (30 seconds)
        timeout: 30000,
      }
    );

    return {
      success: true,
      url: response.data.url,
    };
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Upload failed';
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Upload multiple files to Cloudinary
 * Returns array of URLs for successfully uploaded files
 */
const uploadFiles = async (files: File[]): Promise<{
  success: boolean;
  urls: string[];
  errors: string[];
}> => {
  const results = await Promise.all(
    files.map(file => uploadFile(file))
  );

  const urls: string[] = [];
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.success && result.url) {
      urls.push(result.url);
    } else {
      errors.push(`${files[index].name}: ${result.error || 'Failed'}`);
    }
  });

  return {
    success: urls.length > 0,
    urls,
    errors,
  };
};

export default {
  uploadFile,
  uploadFiles,
};
