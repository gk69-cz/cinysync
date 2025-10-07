// client/src/services/videoUploadService.ts

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export interface CloudinaryError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  maxRetries?: number;
  retryDelay?: number;
}

export class VideoUploadService {
  private static CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  private static CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  
  // Constants
  private static readonly MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
  private static readonly TIMEOUT = 600000; // 10 minutes
  private static readonly DEFAULT_MAX_RETRIES = 3;
  private static readonly DEFAULT_RETRY_DELAY = 2000; // 2 seconds

  /**
   * Upload a video file to Cloudinary with comprehensive error handling
   */
  static async uploadVideo(
    file: File,
    options: UploadOptions = {}
  ): Promise<string> {
    const { onProgress, maxRetries = this.DEFAULT_MAX_RETRIES, retryDelay = this.DEFAULT_RETRY_DELAY } = options;
    
    console.log('🚀 Starting video upload...');
    console.log('📦 File:', { name: file.name, size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`, type: file.type });

    // Validation
    try {
      this.validateConfiguration();
      this.validateFile(file);
    } catch (error: any) {
      console.error('❌ Validation failed:', error.message);
      throw error;
    }

    // Upload with retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Upload attempt ${attempt}/${maxRetries}`);
        const url = await this.performUpload(file, onProgress);
        console.log('✅ Upload successful!');
        return url;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          console.log('⚠️ Non-retryable error, stopping attempts');
          throw error;
        }
        
        // Wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          const delay = retryDelay * attempt; // Exponential backoff
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    console.error('❌ All upload attempts failed');
    throw new Error(`Upload failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Perform the actual upload
   */
  private static performUpload(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.CLOUDINARY_UPLOAD_PRESET);
    formData.append('resource_type', 'video'); // CRITICAL: Must specify video
    
    // Optional: Add folder organization
    // formData.append('folder', 'watch-party-videos');
    
    // Optional: Add tags for organization
    // formData.append('tags', 'watch-party,user-upload');
    
    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.CLOUDINARY_CLOUD_NAME}/video/upload`;
    
    console.log('📡 Upload URL:', uploadUrl);
    console.log('📋 Upload preset:', this.CLOUDINARY_UPLOAD_PRESET);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = {
            bytesTransferred: event.loaded,
            totalBytes: event.total,
            progress: (event.loaded / event.total) * 100
          };
          console.log(`📊 Progress: ${progress.progress.toFixed(1)}%`);
          onProgress(progress);
        }
      });

      // Success
      xhr.addEventListener('load', () => {
        console.log('📬 Response:', xhr.status, xhr.statusText);
        
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('✅ Upload complete:', response.secure_url);
            console.log('📊 Response details:', {
              publicId: response.public_id,
              format: response.format,
              duration: response.duration,
              bytes: response.bytes
            });
            resolve(response.secure_url);
          } catch (error) {
            console.error('❌ Failed to parse response:', xhr.responseText);
            reject(this.createError('Failed to parse upload response', 'PARSE_ERROR', xhr.status));
          }
        } else {
          reject(this.handleHttpError(xhr));
        }
      });

      // Network error
      xhr.addEventListener('error', () => {
        console.error('❌ Network error');
        reject(this.createError(
          'Network error. Check your internet connection.',
          'NETWORK_ERROR'
        ));
      });

      // Upload cancelled
      xhr.addEventListener('abort', () => {
        console.warn('⚠️ Upload cancelled');
        reject(this.createError('Upload was cancelled', 'CANCELLED'));
      });

      // Timeout
      xhr.addEventListener('timeout', () => {
        console.error('⏱️ Upload timeout');
        reject(this.createError(
          `Upload timeout after ${this.TIMEOUT / 1000}s. File may be too large or connection is slow.`,
          'TIMEOUT'
        ));
      });

      xhr.timeout = this.TIMEOUT;
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  }

  /**
   * Validate Cloudinary configuration
   */
  private static validateConfiguration(): void {
    const errors: string[] = [];

    if (!this.CLOUDINARY_CLOUD_NAME) {
      errors.push('VITE_CLOUDINARY_CLOUD_NAME is not set');
    }

    if (!this.CLOUDINARY_UPLOAD_PRESET) {
      errors.push('VITE_CLOUDINARY_UPLOAD_PRESET is not set');
    }

    if (errors.length > 0) {
      console.error('❌ Configuration errors:', errors);
      console.log('\n💡 Setup Instructions:');
      console.log('1. Create .env file in project root');
      console.log('2. Add these lines:');
      console.log('   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name');
      console.log('   VITE_CLOUDINARY_UPLOAD_PRESET=your_preset_name');
      console.log('3. Restart dev server: npm run dev\n');
      
      throw this.createError(
        `Cloudinary configuration missing:\n${errors.join('\n')}`,
        'CONFIG_ERROR'
      );
    }

    console.log('✅ Configuration validated');
  }

  /**
   * Validate video file
   */
  private static validateFile(file: File): void {
    // Check if it's a video
    if (!file.type.startsWith('video/')) {
      throw this.createError(
        `Invalid file type: ${file.type}. Please select a video file.`,
        'INVALID_FILE_TYPE'
      );
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const maxSizeMB = (this.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      throw this.createError(
        `File is too large (${sizeMB}MB). Maximum size is ${maxSizeMB}MB.`,
        'FILE_TOO_LARGE'
      );
    }

    // Check if file is empty
    if (file.size === 0) {
      throw this.createError('File is empty', 'EMPTY_FILE');
    }

    // Validate supported formats
    const supportedFormats = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    if (!supportedFormats.includes(file.type)) {
      console.warn('⚠️ Unusual video format:', file.type);
      // Don't throw, just warn - Cloudinary might still support it
    }

    console.log('✅ File validated');
  }

  /**
   * Handle HTTP errors with detailed messages
   */
  private static handleHttpError(xhr: XMLHttpRequest): Error {
    console.error('❌ HTTP Error:', xhr.status, xhr.statusText);
    console.error('Response:', xhr.responseText);

    let errorMessage = `Upload failed with status ${xhr.status}`;
    let errorCode = 'HTTP_ERROR';
    let details: any = {};

    // Try to parse error response
    try {
      const errorData = JSON.parse(xhr.responseText);
      details = errorData;
      
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch (e) {
      // Response is not JSON
      if (xhr.responseText) {
        details.rawResponse = xhr.responseText;
      }
    }

    // Provide specific error messages based on status code
    switch (xhr.status) {
      case 400:
        errorCode = 'BAD_REQUEST';
        errorMessage = this.getError400Message(details);
        break;
      
      case 401:
        errorCode = 'UNAUTHORIZED';
        errorMessage = 
          '🔒 Upload preset not authorized. Please check:\n' +
          '1. Upload preset exists in Cloudinary dashboard\n' +
          '2. Preset is set to "Unsigned" mode\n' +
          '3. Preset name matches exactly: ' + this.CLOUDINARY_UPLOAD_PRESET + '\n' +
          '4. Cloud name is correct: ' + this.CLOUDINARY_CLOUD_NAME;
        break;
      
      case 403:
        errorCode = 'FORBIDDEN';
        errorMessage = 
          '🚫 Access denied. Possible reasons:\n' +
          '1. Upload preset doesn\'t allow this file type\n' +
          '2. File size exceeds preset limits\n' +
          '3. Account storage/bandwidth limit reached\n' +
          '4. IP/domain restrictions in preset settings';
        break;
      
      case 404:
        errorCode = 'NOT_FOUND';
        errorMessage = 
          '❓ Resource not found. Please check:\n' +
          '1. Cloud name is correct: ' + this.CLOUDINARY_CLOUD_NAME + '\n' +
          '2. Upload preset exists: ' + this.CLOUDINARY_UPLOAD_PRESET;
        break;
      
      case 413:
        errorCode = 'FILE_TOO_LARGE';
        errorMessage = '📦 File is too large for Cloudinary. Maximum size varies by plan.';
        break;
      
      case 420:
        errorCode = 'RATE_LIMITED';
        errorMessage = '⏱️ Rate limit exceeded. Please wait a moment and try again.';
        break;
      
      case 500:
      case 502:
      case 503:
        errorCode = 'SERVER_ERROR';
        errorMessage = '🔧 Cloudinary server error. This is usually temporary - please try again.';
        break;
      
      case 504:
        errorCode = 'GATEWAY_TIMEOUT';
        errorMessage = '⏱️ Upload timeout. File may be too large or connection is slow.';
        break;
    }

    return this.createError(errorMessage, errorCode, xhr.status, details);
  }

  /**
   * Get specific error message for 400 Bad Request
   */
  private static getError400Message(details: any): string {
    const errorMsg = details?.error?.message?.toLowerCase() || '';
    
    if (errorMsg.includes('resource_type')) {
      return '❌ Invalid resource type. Video files must use resource_type="video"';
    }
    
    if (errorMsg.includes('upload_preset')) {
      return '❌ Invalid upload preset. Check preset name: ' + this.CLOUDINARY_UPLOAD_PRESET;
    }
    
    if (errorMsg.includes('signature')) {
      return '❌ Invalid signature. For unsigned uploads, ensure preset is set to "Unsigned"';
    }
    
    if (errorMsg.includes('format')) {
      return '❌ Unsupported video format. Try MP4, WebM, or MOV';
    }
    
    if (errorMsg.includes('transformation')) {
      return '❌ Invalid transformation parameters';
    }
    
    return `❌ Bad request: ${details?.error?.message || 'Unknown error'}`;
  }

  /**
   * Create a structured error
   */
  private static createError(
    message: string,
    code: string,
    statusCode?: number,
    details?: any
  ): Error {
    const error = new Error(message) as Error & CloudinaryError;
    error.code = code;
    error.statusCode = statusCode;
    error.details = details;
    return error;
  }

  /**
   * Check if error is non-retryable
   */
  private static isNonRetryableError(error: any): boolean {
    const nonRetryableCodes = [
      'CONFIG_ERROR',
      'INVALID_FILE_TYPE',
      'FILE_TOO_LARGE',
      'EMPTY_FILE',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
      'BAD_REQUEST',
      'PARSE_ERROR'
    ];
    
    return nonRetryableCodes.includes(error.code) || 
           (error.statusCode && error.statusCode >= 400 && error.statusCode < 500);
  }

  /**
   * Sleep utility for retry delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Delete a video (requires backend implementation)
   */
  static async deleteVideo(videoUrl: string): Promise<void> {
    console.log('🗑️ Delete video request:', videoUrl);
    
    const publicId = this.extractPublicId(videoUrl);
    
    if (!publicId) {
      throw this.createError('Invalid Cloudinary URL', 'INVALID_URL');
    }

    console.log('🔍 Public ID:', publicId);
    console.warn('⚠️ Video deletion requires backend implementation');
    console.log('💡 Implement: POST /api/videos/delete with body: { publicId }');
    
    // TODO: Call your backend API
    throw this.createError(
      'Video deletion must be implemented on the backend for security',
      'NOT_IMPLEMENTED'
    );
  }

  /**
   * Extract public_id from Cloudinary URL
   */
  private static extractPublicId(url: string): string | null {
    try {
      const match = url.match(/\/v\d+\/(.+?)(?:\.[^.]+)?$/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error extracting public_id:', error);
      return null;
    }
  }

  /**
   * Validate if URL is from Cloudinary
   */
  static isCloudinaryUrl(url: string): boolean {
    return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
  }

  /**
   * Get optimized video URL with transformations
   */
  static getOptimizedUrl(
    url: string,
    options: {
      quality?: 'auto' | number;
      format?: 'auto' | 'mp4' | 'webm';
      width?: number;
      height?: number;
    } = {}
  ): string {
    if (!this.isCloudinaryUrl(url)) {
      console.warn('⚠️ Not a Cloudinary URL, cannot optimize');
      return url;
    }

    const transformations: string[] = [];

    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);

    if (transformations.length > 0) {
      const transformation = transformations.join(',');
      return url.replace('/upload/', `/upload/${transformation}/`);
    }

    return url;
  }

  /**
   * Generate video thumbnail
   */
  static getThumbnailUrl(
    videoUrl: string,
    options: {
      width?: number;
      height?: number;
      time?: number;
    } = {}
  ): string {
    if (!this.isCloudinaryUrl(videoUrl)) {
      throw this.createError('Cannot generate thumbnail for non-Cloudinary URL', 'INVALID_URL');
    }

    const transformations: string[] = [];
    
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.time) transformations.push(`so_${options.time}`);
    transformations.push('f_jpg');

    const transformation = transformations.join(',');
    
    return videoUrl
      .replace('/video/upload/', `/video/upload/${transformation}/`)
      .replace(/\.\w+$/, '.jpg');
  }

  /**
   * Debug configuration
   */
  static debugConfig(): void {
    console.log('\n🔧 Cloudinary Configuration Debug');
    console.log('================================');
    console.log('Cloud Name:', this.CLOUDINARY_CLOUD_NAME || '❌ NOT SET');
    console.log('Upload Preset:', this.CLOUDINARY_UPLOAD_PRESET || '❌ NOT SET');
    console.log('\nEnvironment Variables:');
    console.log('  VITE_CLOUDINARY_CLOUD_NAME:', this.CLOUDINARY_CLOUD_NAME ? '✅' : '❌');
    console.log('  VITE_CLOUDINARY_UPLOAD_PRESET:', this.CLOUDINARY_UPLOAD_PRESET ? '✅' : '❌');
    
    if (!this.CLOUDINARY_CLOUD_NAME || !this.CLOUDINARY_UPLOAD_PRESET) {
      console.log('\n❌ Configuration incomplete!\n');
      console.log('To fix:');
      console.log('1. Create .env file in project root');
      console.log('2. Add:');
      console.log('   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name');
      console.log('   VITE_CLOUDINARY_UPLOAD_PRESET=your_preset_name');
      console.log('3. Restart: npm run dev\n');
    } else {
      console.log('\n✅ Configuration looks good!\n');
    }
    console.log('================================\n');
  }
}

// Auto-debug in development
if (import.meta.env.DEV) {
  console.log('📦 VideoUploadService loaded');

}