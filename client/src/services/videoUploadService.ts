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
    console.log('🚀 Starting video upload...');
    
    // Validate file
    if (!file.type.startsWith('video/')) {
      console.error('❌ Invalid file type:', file.type);
      throw new Error('Please select a valid video file');
    }

    // Check file size (max 500MB for better UX)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      console.error('❌ File too large:', (file.size / (1024 * 1024)).toFixed(2), 'MB');
      throw new Error('Video file must be less than 500MB');
    }

    // Validate Cloudinary configuration
    console.log('🔧 Checking Cloudinary configuration...');
    console.log('Cloud Name:', this.CLOUDINARY_CLOUD_NAME);
    console.log('Upload Preset:', this.CLOUDINARY_UPLOAD_PRESET);
    
    if (!this.CLOUDINARY_CLOUD_NAME || !this.CLOUDINARY_UPLOAD_PRESET) {
      console.error('❌ Missing configuration:', {
        cloudName: this.CLOUDINARY_CLOUD_NAME ? '✓' : '✗',
        uploadPreset: this.CLOUDINARY_UPLOAD_PRESET ? '✓' : '✗'
      });
      throw new Error('Cloudinary configuration missing. Please check environment variables:\nVITE_CLOUDINARY_CLOUD_NAME\nVITE_CLOUDINARY_UPLOAD_PRESET');
    }

    console.log('✓ Configuration OK');
    console.log('📦 File details:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    });

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.CLOUDINARY_UPLOAD_PRESET);
    
    // Don't add folder or resource_type - let the upload preset handle it
    // This is important for unsigned uploads

    // Upload URL - using /auto/upload for automatic resource detection
    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.CLOUDINARY_CLOUD_NAME}/auto/upload`;
    
    console.log('📤 Upload URL:', uploadUrl);
    console.log('📋 FormData contents:');
    console.log('  - file:', file.name);
    console.log('  - upload_preset:', this.CLOUDINARY_UPLOAD_PRESET);

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
          console.log(`📊 Upload progress: ${progress.progress.toFixed(1)}%`);
          onProgress(progress);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        console.log('📬 Response received:', {
          status: xhr.status,
          statusText: xhr.statusText
        });

        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('✅ Upload successful!');
            console.log('🔗 Video URL:', response.secure_url);
            console.log('📝 Full response:', response);
            
            // Return the secure URL (uses HTTPS and CDN)
            resolve(response.secure_url);
          } catch (error) {
            console.error('❌ Failed to parse response:', xhr.responseText);
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          console.error('❌ Upload failed with status:', xhr.status);
          console.error('Response:', xhr.responseText);
          
          let errorMessage = `Upload failed with status: ${xhr.status}`;
          let detailedError = '';
          
          try {
            const errorData = JSON.parse(xhr.responseText);
            console.error('Error details:', errorData);
            
            if (errorData.error && errorData.error.message) {
              errorMessage = errorData.error.message;
              detailedError = errorData.error.message;
            }
          } catch (e) {
            detailedError = xhr.responseText;
          }

          // Provide helpful error messages based on status code
          if (xhr.status === 401) {
            console.error('🔒 401 Unauthorized - Upload preset configuration issue');
            errorMessage = 'Upload preset not authorized. Please check:\n' +
                          '1. Upload preset exists in Cloudinary\n' +
                          '2. Upload preset is set to "Unsigned" mode\n' +
                          '3. Preset name matches exactly: ' + this.CLOUDINARY_UPLOAD_PRESET;
          } else if (xhr.status === 400) {
            console.error('⚠️ 400 Bad Request - Invalid request');
            errorMessage = 'Invalid upload request: ' + detailedError;
          } else if (xhr.status === 403) {
            console.error('🚫 403 Forbidden - Access denied');
            errorMessage = 'Access denied. Check your upload preset permissions.';
          }
          
          reject(new Error(errorMessage));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        console.error('❌ Network error during upload');
        reject(new Error('Network error during upload. Check your internet connection.'));
      });

      xhr.addEventListener('abort', () => {
        console.warn('⚠️ Upload cancelled');
        reject(new Error('Upload cancelled'));
      });

      xhr.addEventListener('timeout', () => {
        console.error('⏱️ Upload timeout');
        reject(new Error('Upload timeout. File might be too large or connection is slow.'));
      });

      // Set timeout (10 minutes for large files)
      xhr.timeout = 600000;

      // Send request
      console.log('🚀 Sending upload request...');
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
    console.log('🗑️ Delete video request:', videoUrl);
    
    // Extract public_id from Cloudinary URL
    const publicId = this.extractPublicId(videoUrl);
    
    if (!publicId) {
      console.error('❌ Invalid Cloudinary URL');
      throw new Error('Invalid Cloudinary URL');
    }

    console.log('📝 Public ID:', publicId);
    
    // Note: Direct deletion from client is not recommended for security
    // This should be implemented on your backend using Cloudinary Admin API
    console.warn('⚠️ Video deletion should be handled by backend API');
    console.log('💡 Implement server endpoint: DELETE /api/videos/:publicId');
    
    // You would typically call your backend API here:
    // await fetch('/api/videos/delete', {
    //   method: 'DELETE',
    //   headers: { 'Content-Type': 'application/json' },
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
    } catch (error) {
      console.error('Error extracting public_id:', error);
      return null;
    }
  }

  /**
   * Validate video URL format
   * @param url - URL to validate
   * @returns true if valid Cloudinary URL
   */
  static isCloudinaryUrl(url: string): boolean {
    const isValid = url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
    console.log('🔍 URL validation:', url, '→', isValid ? '✓' : '✗');
    return isValid;
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
    if (!this.isCloudinaryUrl(url)) {
      console.log('⚠️ Not a Cloudinary URL, skipping optimization');
      return url;
    }

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
      const optimizedUrl = url.replace('/upload/', `/upload/${transformation}/`);
      console.log('🎨 Optimized URL:', optimizedUrl);
      return optimizedUrl;
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
    if (!this.isCloudinaryUrl(videoUrl)) {
      console.warn('⚠️ Cannot generate thumbnail for non-Cloudinary URL');
      return '';
    }

    const transformations: string[] = [];
    
    if (options?.width) transformations.push(`w_${options.width}`);
    if (options?.height) transformations.push(`h_${options.height}`);
    if (options?.time) transformations.push(`so_${options.time}`);
    
    transformations.push('f_jpg'); // Convert to image format

    const transformation = transformations.join(',');
    
    // Replace /video/upload/ with /video/upload/TRANSFORMATIONS/ and change to .jpg
    const thumbnailUrl = videoUrl
      .replace('/video/upload/', `/video/upload/${transformation}/`)
      .replace(/\.\w+$/, '.jpg');
    
    console.log('🖼️ Thumbnail URL generated:', thumbnailUrl);
    return thumbnailUrl;
  }

  /**
   * Get video file extension from URL
   * @param url - Video URL
   * @returns file extension or null
   */
  static getVideoExtension(url: string): string | null {
    const match = url.match(/\.(mp4|webm|ogg|mov|avi|mkv)($|\?)/i);
    const extension = match ? match[1] : null;
    console.log('📹 Video extension:', extension || 'unknown');
    return extension;
  }

  /**
   * Debug helper - Print current configuration
   */
  static debugConfig(): void {
    console.log('🔧 Cloudinary Configuration Debug:');
    console.log('================================');
    console.log('Cloud Name:', this.CLOUDINARY_CLOUD_NAME || '❌ NOT SET');
    console.log('Upload Preset:', this.CLOUDINARY_UPLOAD_PRESET || '❌ NOT SET');
    console.log('');
    console.log('Environment Variables:');
    console.log('  VITE_CLOUDINARY_CLOUD_NAME:', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Missing');
    console.log('  VITE_CLOUDINARY_UPLOAD_PRESET:', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ? '✓ Set' : '✗ Missing');
    console.log('');
    
    if (!this.CLOUDINARY_CLOUD_NAME || !this.CLOUDINARY_UPLOAD_PRESET) {
      console.error('❌ Configuration incomplete!');
      console.log('');
      console.log('To fix:');
      console.log('1. Create .env file in project root');
      console.log('2. Add these lines:');
      console.log('   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name');
      console.log('   VITE_CLOUDINARY_UPLOAD_PRESET=your_preset_name');
      console.log('3. Restart dev server: npm run dev');
    } else {
      console.log('✅ Configuration looks good!');
    }
    console.log('================================');
  }
}

// Auto-run debug on import in development
if (import.meta.env.DEV) {
  console.log('📦 VideoUploadService loaded');
  // Uncomment to see config on every page load:
  // VideoUploadService.debugConfig();
}