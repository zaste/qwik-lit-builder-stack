import { logger } from '../logger';

export interface ProcessedImageResult {
  original: {
    url: string;
    filename: string;
    contentType: string;
    size: number;
  };
  thumbnails: {
    thumbnail: ImageVariant;
    medium: ImageVariant;
    large: ImageVariant;
  };
  metadata: ImageMetadata;
}

export interface ImageVariant {
  url: string;
  filename: string;
  contentType: string;
  width: number;
  height: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

export class CloudflareImageProcessor {
  // Image size configurations matching original Sharp implementation
  private static readonly SIZES = {
    thumbnail: { width: 150, height: 150 },
    medium: { width: 800, height: 600 },
    large: { width: 1920, height: 1080 }
  };

  /**
   * Process an uploaded image file using Cloudflare Images API
   * This replaces Sharp processing for Cloudflare Workers compatibility
   */
  static async processImage(
    file: File,
    cloudflareImageId?: string
  ): Promise<ProcessedImageResult> {
    try {
      // Get basic metadata from the file
      const metadata = await this.extractBasicMetadata(file);
      
      // Generate base filename without extension
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const baseFilename = `${timestamp}-${randomId}-${file.name.replace(/\.[^/.]+$/, "")}`;
      
      // If we have Cloudflare Images integration, use it for URL-based transformations
      if (cloudflareImageId) {
        return this.generateCloudflareImageUrls(cloudflareImageId, baseFilename, metadata);
      }
      
      // Fallback: Just return original file info (will be handled by R2 direct upload)
      return this.generateFallbackResult(file, baseFilename, metadata);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Cloudflare image processing failed', { error: errorMessage, filename: file.name });
      throw new Error(`Image processing failed: ${errorMessage}`);
    }
  }

  /**
   * Extract basic metadata from file (without Sharp)
   */
  static async extractBasicMetadata(file: File): Promise<ImageMetadata> {
    try {
      // Basic metadata extraction using native browser APIs
      const format = file.type.split('/')[1] || 'unknown';
      
      // For basic dimensions, we'll need to load the image in a canvas (if in browser context)
      // In server context, we'll return basic info
      const metadata: ImageMetadata = {
        width: 0, // Will be populated by Cloudflare Images API
        height: 0, // Will be populated by Cloudflare Images API
        format,
        size: file.size
      };
      
      return metadata;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Basic metadata extraction failed', { error: errorMessage });
      throw new Error(`Metadata extraction failed: ${errorMessage}`);
    }
  }

  /**
   * Generate Cloudflare Images transformation URLs
   */
  private static generateCloudflareImageUrls(
    imageId: string,
    baseFilename: string,
    metadata: ImageMetadata
  ): ProcessedImageResult {
    const baseUrl = `https://imagedelivery.net/${process.env.CLOUDFLARE_ACCOUNT_HASH}/${imageId}`;
    
    return {
      original: {
        url: `${baseUrl}/public`, // public variant = original
        filename: `${baseFilename}.${this.getFileExtension(metadata.format)}`,
        contentType: this.getMimeType(metadata.format),
        size: metadata.size
      },
      thumbnails: {
        thumbnail: {
          url: `${baseUrl}/thumbnail`, // Custom variant for 150x150
          filename: `${baseFilename}-thumbnail.webp`,
          contentType: 'image/webp',
          width: this.SIZES.thumbnail.width,
          height: this.SIZES.thumbnail.height
        },
        medium: {
          url: `${baseUrl}/medium`, // Custom variant for 800x600
          filename: `${baseFilename}-medium.webp`,
          contentType: 'image/webp',
          width: this.SIZES.medium.width,
          height: this.SIZES.medium.height
        },
        large: {
          url: `${baseUrl}/large`, // Custom variant for 1920x1080
          filename: `${baseFilename}-large.webp`,
          contentType: 'image/webp',
          width: this.SIZES.large.width,
          height: this.SIZES.large.height
        }
      },
      metadata
    };
  }

  /**
   * Fallback result when Cloudflare Images is not available
   * Returns R2 URLs that can be transformed via URL parameters
   */
  private static generateFallbackResult(
    file: File,
    baseFilename: string,
    metadata: ImageMetadata
  ): ProcessedImageResult {
    // Generate R2 URLs with Cloudflare Image Resizing parameters
    const r2BaseUrl = process.env.R2_PUBLIC_URL || 'https://files.example.com';
    const originalUrl = `${r2BaseUrl}/images/original/${baseFilename}.${this.getFileExtension(metadata.format)}`;
    
    return {
      original: {
        url: originalUrl,
        filename: `${baseFilename}.${this.getFileExtension(metadata.format)}`,
        contentType: this.getMimeType(metadata.format),
        size: metadata.size
      },
      thumbnails: {
        thumbnail: {
          url: `${originalUrl}?width=${this.SIZES.thumbnail.width}&height=${this.SIZES.thumbnail.height}&fit=cover&f=webp`,
          filename: `${baseFilename}-thumbnail.webp`,
          contentType: 'image/webp',
          width: this.SIZES.thumbnail.width,
          height: this.SIZES.thumbnail.height
        },
        medium: {
          url: `${originalUrl}?width=${this.SIZES.medium.width}&height=${this.SIZES.medium.height}&fit=cover&f=webp`,
          filename: `${baseFilename}-medium.webp`,
          contentType: 'image/webp',
          width: this.SIZES.medium.width,
          height: this.SIZES.medium.height
        },
        large: {
          url: `${originalUrl}?width=${this.SIZES.large.width}&height=${this.SIZES.large.height}&fit=cover&f=webp`,
          filename: `${baseFilename}-large.webp`,
          contentType: 'image/webp',
          width: this.SIZES.large.width,
          height: this.SIZES.large.height
        }
      },
      metadata
    };
  }

  /**
   * Upload to Cloudflare Images and get image ID
   */
  static async uploadToCloudflareImages(
    file: File,
    env: any
  ): Promise<string | null> {
    try {
      // This would require Cloudflare Images API integration
      // For now, return null to use fallback R2 approach
      if (!env.CLOUDFLARE_IMAGES_API_TOKEN) {
        logger.warn('Cloudflare Images API not configured, using R2 fallback');
        return null;
      }

      // TODO: Implement actual Cloudflare Images upload
      // const formData = new FormData();
      // formData.append('file', file);
      
      // const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${env.CLOUDFLARE_IMAGES_API_TOKEN}`
      //   },
      //   body: formData
      // });

      // const result = await response.json();
      // return result.success ? result.result.id : null;
      
      return null; // Fallback for now
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Cloudflare Images upload failed', { error: errorMessage });
      return null;
    }
  }

  /**
   * Get file extension for format
   */
  private static getFileExtension(format: string): string {
    const extensions: Record<string, string> = {
      jpeg: 'jpg',
      jpg: 'jpg',
      png: 'png',
      webp: 'webp',
      gif: 'gif',
      tiff: 'tiff',
      bmp: 'bmp'
    };
    return extensions[format.toLowerCase()] || 'jpg';
  }

  /**
   * Get MIME type for format
   */
  private static getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      tiff: 'image/tiff',
      bmp: 'image/bmp'
    };
    return mimeTypes[format.toLowerCase()] || 'image/jpeg';
  }

  /**
   * Create Cloudflare Images variants (to be called during setup)
   */
  static async createImageVariants(env: any): Promise<void> {
    try {
      if (!env.CLOUDFLARE_IMAGES_API_TOKEN) {
        logger.info('Cloudflare Images API not configured, skipping variant creation');
        return;
      }

      // TODO: Implement variant creation API calls
      logger.info('Image variants creation would be implemented here');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create Cloudflare Images variants', { error: errorMessage });
    }
  }
}