/**
 * CMS Module - Central exports for content management system
 */

// Services
export { pagesService, PagesService } from './pages';
export { contentBlocksService, ContentBlocksService } from './content-blocks';

// Types
export type {
  Page,
  PageInsert,
  PageUpdate,
  PageWithBlocks,
  CreatePageRequest,
  UpdatePageRequest,
  PaginationParams,
  PaginatedResponse
} from './pages';

export type {
  ContentBlock,
  CreateBlockRequest,
  UpdateBlockRequest,
  ReorderBlocksRequest
} from './content-blocks';

// Common CMS utilities
export class CMSError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'CMSError';
  }
}

export const CMS_ERRORS = {
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_SLUG: 'DUPLICATE_SLUG',
  INVALID_TEMPLATE: 'INVALID_TEMPLATE'
} as const;

/**
 * Validation utilities
 */
export const validateSlug = (slug: string): boolean => {
  return /^[a-z0-9-]+$/.test(slug);
};

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export const validatePageTitle = (title: string): boolean => {
  return title.length >= 1 && title.length <= 200;
};

/**
 * Content block utilities
 */
export const DEFAULT_REGIONS = ['header', 'main', 'sidebar', 'footer'] as const;
export type Region = typeof DEFAULT_REGIONS[number];

export const COMPONENT_CATEGORIES = [
  'layout',
  'interactive',
  'form',
  'display',
  'media',
  'navigation'
] as const;
export type ComponentCategory = typeof COMPONENT_CATEGORIES[number];

/**
 * Template utilities
 */
export const DEFAULT_TEMPLATES = [
  { name: 'default', display: 'Default Page' },
  { name: 'landing', display: 'Landing Page' },
  { name: 'blog', display: 'Blog Post' },
  { name: 'product', display: 'Product Page' }
] as const;

/**
 * SEO utilities
 */
export const generateSEOTitle = (title: string, siteName?: string): string => {
  if (siteName) {
    return `${title} | ${siteName}`;
  }
  return title;
};

export const truncateDescription = (description: string, maxLength = 160): string => {
  if (description.length <= maxLength) {
    return description;
  }
  return description.substring(0, maxLength - 3) + '...';
};

/**
 * Content utilities
 */
export const extractTextFromBlocks = (blocks: any[]): string => {
  return blocks
    .map(block => {
      if (block.properties && typeof block.properties === 'object') {
        const props = block.properties as any;
        return [props.text, props.title, props.subtitle, props.content]
          .filter(Boolean)
          .join(' ');
      }
      return '';
    })
    .join(' ')
    .trim();
};

export const estimateReadingTime = (text: string): number => {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

/**
 * Publishing utilities
 */
export const canPublishPage = (page: any): boolean => {
  return !!(page.title && page.slug && page.content);
};

export const getPageStatus = (page: any): 'draft' | 'published' | 'scheduled' => {
  if (!page.published) {
    return 'draft';
  }
  
  if (page.published_at && new Date(page.published_at) > new Date()) {
    return 'scheduled';
  }
  
  return 'published';
};

/**
 * Analytics utilities
 */
export const formatViewCount = (count: number): string => {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    return `${(count / 1000).toFixed(1)}K`;
  } else {
    return `${(count / 1000000).toFixed(1)}M`;
  }
};

/**
 * Export all from database types for convenience
 */
export type { Database } from '../database.types';