// client/src/services/videoUploadService.ts
export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export class VideoUploadService {
  private static CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  private static CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  /**
   * Upload a video file to Cloudinary
   * @param file - The video file to upload
   * @param onProgress - Callback for upload progress updates
   * @returns Promise with the video URL
   */
  static async uploadVideo(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // Validate file
    if (!file.type.startsWith('video/')) {
      throw new Error('Please select a valid video file');
    }

    // Check file size (max 500MB for better UX)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      throw new Error('Video file must be less than 500MB');
    }

    // Validate Cloudinary configuration
    if (!this.CLOUDINARY_CLOUD_NAME || !this.CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Cloudinary configuration missing. Please check environment variables.');
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'watchparty-videos');
    formData.append('resource_type', 'video');

    // Upload URL
    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.CLOUDINARY_CLOUD_NAME}/video/upload`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = {
            bytesTransferred: event.loaded,
            totalBytes: event.total,
            progress: (event.loaded / event.total) * 100
          };
          onProgress(progress);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            // Return the secure URL (uses HTTPS and CDN)
            resolve(response.secure_url);
          } catch (error) {
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Send request
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  }

  /**
   * Delete a video from Cloudinary
   * @param videoUrl - The URL of the video to delete
   * Note: Deletion requires server-side implementation with Cloudinary API
   */
  static async deleteVideo(videoUrl: string): Promise<void> {
    // Extract public_id from Cloudinary URL
    const publicId = this.extractPublicId(videoUrl);
    
    if (!publicId) {
      throw new Error('Invalid Cloudinary URL');
    }

    // Note: Direct deletion from client is not recommended for security
    // This should be implemented on your backend using Cloudinary Admin API
    console.warn('Video deletion should be handled by backend API');
    
    // You would typically call your backend API here:
    // await fetch('/api/videos/delete', {
    //   method: 'DELETE',
    //   body: JSON.stringify({ publicId })
    // });
  }

  /**
   * Extract public_id from Cloudinary URL
   * @param url - Cloudinary URL
   * @returns public_id or null
   */
  private static extractPublicId(url: string): string | null {
    try {
      // Example URL: https://res.cloudinary.com/demo/video/upload/v1234567890/folder/filename.mp4
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Validate video URL format
   * @param url - URL to validate
   * @returns true if valid Cloudinary URL
   */
  static isCloudinaryUrl(url: string): boolean {
    return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
  }

  /**
   * Get optimized video URL with transformations
   * @param url - Original Cloudinary URL
   * @param options - Transformation options
   * @returns Optimized URL
   */
  static getOptimizedUrl(
    url: string,
    options?: {
      quality?: 'auto' | number;
      format?: 'auto' | 'mp4' | 'webm';
      width?: number;
      height?: number;
    }
  ): string {
    if (!this.isCloudinaryUrl(url)) return url;

    const transformations: string[] = [];

    if (options?.quality) {
      transformations.push(`q_${options.quality}`);
    }

    if (options?.format) {
      transformations.push(`f_${options.format}`);
    }

    if (options?.width) {
      transformations.push(`w_${options.width}`);
    }

    if (options?.height) {
      transformations.push(`h_${options.height}`);
    }

    // Insert transformations into URL
    if (transformations.length > 0) {
      const transformation = transformations.join(',');
      return url.replace('/upload/', `/upload/${transformation}/`);
    }

    return url;
  }

  /**
   * Generate video thumbnail URL
   * @param videoUrl - Cloudinary video URL
   * @param options - Thumbnail options
   * @returns Thumbnail image URL
   */
  static getThumbnailUrl(
    videoUrl: string,
    options?: {
      width?: number;
      height?: number;
      time?: number; // seconds into video
    }
  ): string {
    if (!this.isCloudinaryUrl(videoUrl)) return '';

    const transformations: string[] = [];
    
    if (options?.width) transformations.push(`w_${options.width}`);
    if (options?.height) transformations.push(`h_${options.height}`);
    if (options?.time) transformations.push(`so_${options.time}`);
    
    transformations.push('f_jpg'); // Convert to image format

    const transformation = transformations.join(',');
    
    // Replace /video/upload/ with /video/upload/TRANSFORMATIONS/ and change to .jpg
    return videoUrl
      .replace('/video/upload/', `/video/upload/${transformation}/`)
      .replace(/\.\w+$/, '.jpg');
  }

  /**
   * Get video file extension from URL
   * @param url - Video URL
   * @returns file extension or null
   */
  static getVideoExtension(url: string): string | null {
    const match = url.match(/\.(mp4|webm|ogg|mov|avi|mkv)($|\?)/i);
    return match ? match[1] : null;
  }
}