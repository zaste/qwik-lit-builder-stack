/**
 * CMS Pages Service
 * Handles all page management operations with Supabase
 */

import { getSupabaseClient } from '../supabase';
import type { Database } from '../database.types';
import { logger } from '../logger';

type Page = Database['public']['Tables']['pages']['Row'];
type PageInsert = Database['public']['Tables']['pages']['Insert'];
type PageUpdate = Database['public']['Tables']['pages']['Update'];
type ContentBlock = Database['public']['Tables']['content_blocks']['Row'];
type _ContentBlockInsert = Database['public']['Tables']['content_blocks']['Insert'];

export interface PageWithBlocks extends Page {
  blocks: ContentBlock[];
}

export interface CreatePageRequest {
  title: string;
  slug: string;
  description?: string;
  template?: string;
  published?: boolean;
}

export interface UpdatePageRequest {
  title?: string;
  slug?: string;
  description?: string;
  content?: any;
  published?: boolean;
  seo_title?: string;
  seo_description?: string;
  featured_image?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  published?: boolean;
  author_id?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Pages Service Class
 */
export class PagesService {
  private supabase = getSupabaseClient();

  /**
   * Get paginated list of pages
   */
  async getPages(params: PaginationParams = {}): Promise<PaginatedResponse<Page>> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        published,
        author_id
      } = params;

      const offset = (page - 1) * limit;

      // Build query
      let query = this.supabase
        .from('pages')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Apply filters
      if (published !== undefined) {
        query = query.eq('published', published);
      }

      if (author_id) {
        query = query.eq('author_id', author_id);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch pages: ${error.message}`);
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages
        }
      };
    } catch (error) {
      logger.error('Error fetching pages', {}, error as Error);
      throw error;
    }
  }

  /**
   * Get single page by ID or slug
   */
  async getPage(identifier: string, includeBlocks = false): Promise<PageWithBlocks | null> {
    try {
      // Determine if identifier is UUID or slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
      
      let query: any = this.supabase
        .from('pages')
        .select('*')
        .is('deleted_at', null)
        .single();

      if (isUUID) {
        query = query.eq('id', identifier);
      } else {
        query = query.eq('slug', identifier);
      }

      const { data: page, error } = await query;

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw new Error(`Failed to fetch page: ${error.message}`);
      }

      if (!page) {
        return null;
      }

      let blocks: ContentBlock[] = [];

      if (includeBlocks) {
        const { data: blocksData, error: blocksError } = await this.supabase
          .from('content_blocks')
          .select('*')
          .eq('page_id', page.id)
          .order('order_index', { ascending: true });

        if (blocksError) {
          logger.error('Error fetching content blocks', { pageId: page.id }, blocksError);
        } else {
          blocks = blocksData || [];
        }
      }

      return { ...page, blocks };
    } catch (error) {
      logger.error('Error fetching page', { identifier }, error as Error);
      throw error;
    }
  }

  /**
   * Create new page
   */
  async createPage(pageData: CreatePageRequest, authorId: string): Promise<Page> {
    try {
      // Validate slug uniqueness
      const existingPage = await this.getPage(pageData.slug);
      if (existingPage) {
        throw new Error(`Page with slug "${pageData.slug}" already exists`);
      }

      // Prepare page data
      const _insertData: PageInsert = {
        title: pageData.title,
        slug: pageData.slug,
        description: pageData.description || null,
        template: pageData.template || 'default',
        published: pageData.published || false,
        author_id: authorId,
        published_at: pageData.published ? new Date().toISOString() : null
      };

      // Create page using Supabase function for template integration
      const { data, error } = await this.supabase.rpc('create_page_with_template', {
        page_title: pageData.title,
        page_slug: pageData.slug,
        template_name: pageData.template || 'default',
        author_uuid: authorId
      });

      if (error) {
        throw new Error(`Failed to create page: ${error.message}`);
      }

      // Fetch the created page
      const createdPage = await this.getPage(data);
      if (!createdPage) {
        throw new Error('Page was created but could not be retrieved');
      }

      logger.info('Page created successfully', {
        pageId: createdPage.id,
        title: createdPage.title,
        slug: createdPage.slug
      });

      return createdPage;
    } catch (error) {
      logger.error('Error creating page', pageData, error as Error);
      throw error;
    }
  }

  /**
   * Update existing page
   */
  async updatePage(pageId: string, updates: UpdatePageRequest, authorId: string): Promise<Page> {
    try {
      // Check if page exists and user has permission
      const existingPage = await this.getPage(pageId);
      if (!existingPage) {
        throw new Error('Page not found');
      }

      if (existingPage.author_id !== authorId) {
        throw new Error('Permission denied: You can only update your own pages');
      }

      // Validate slug uniqueness if changed
      if (updates.slug && updates.slug !== existingPage.slug) {
        const conflictingPage = await this.getPage(updates.slug);
        if (conflictingPage) {
          throw new Error(`Page with slug "${updates.slug}" already exists`);
        }
      }

      // Prepare update data
      const updateData: PageUpdate = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Handle publishing
      if (updates.published !== undefined) {
        if (updates.published && !existingPage.published) {
          updateData.published_at = new Date().toISOString();
        } else if (!updates.published && existingPage.published) {
          updateData.published_at = null;
        }
      }

      const { data, error } = await this.supabase
        .from('pages')
        .update(updateData)
        .eq('id', pageId)
        .eq('author_id', authorId) // Extra security check
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update page: ${error.message}`);
      }

      logger.info('Page updated successfully', {
        pageId,
        updates: Object.keys(updates)
      });

      return data;
    } catch (error) {
      logger.error('Error updating page', { pageId, updates }, error as Error);
      throw error;
    }
  }

  /**
   * Soft delete page
   */
  async deletePage(pageId: string, authorId: string): Promise<void> {
    try {
      // Check if page exists and user has permission
      const existingPage = await this.getPage(pageId);
      if (!existingPage) {
        throw new Error('Page not found');
      }

      if (existingPage.author_id !== authorId) {
        throw new Error('Permission denied: You can only delete your own pages');
      }

      const { error } = await this.supabase
        .from('pages')
        .update({
          deleted_at: new Date().toISOString(),
          published: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', pageId)
        .eq('author_id', authorId); // Extra security check

      if (error) {
        throw new Error(`Failed to delete page: ${error.message}`);
      }

      logger.info('Page deleted successfully', { pageId });
    } catch (error) {
      logger.error('Error deleting page', { pageId }, error as Error);
      throw error;
    }
  }

  /**
   * Publish/unpublish page
   */
  async togglePublished(pageId: string, published: boolean, authorId: string): Promise<Page> {
    try {
      return this.updatePage(pageId, { published }, authorId);
    } catch (error) {
      logger.error('Error toggling page published status', { pageId, published }, error as Error);
      throw error;
    }
  }

  /**
   * Get pages by author
   */
  async getPagesByAuthor(authorId: string, params: PaginationParams = {}): Promise<PaginatedResponse<Page>> {
    return this.getPages({ ...params, author_id: authorId });
  }

  /**
   * Get published pages only
   */
  async getPublishedPages(params: PaginationParams = {}): Promise<PaginatedResponse<Page>> {
    return this.getPages({ ...params, published: true });
  }

  /**
   * Get available page templates
   */
  async getPageTemplates(): Promise<Database['public']['Tables']['page_templates']['Row'][]> {
    try {
      const { data, error } = await this.supabase
        .from('page_templates')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        throw new Error(`Failed to fetch page templates: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching page templates', {}, error as Error);
      throw error;
    }
  }

  /**
   * Search pages
   */
  async searchPages(query: string, options: { published?: boolean; limit?: number } = {}): Promise<Page[]> {
    try {
      const { published, limit = 10 } = options;

      let searchQuery = this.supabase
        .from('pages')
        .select('*')
        .is('deleted_at', null)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,content.cs.{"text": "${query}"}`)
        .order('view_count', { ascending: false })
        .limit(limit);

      if (published !== undefined) {
        searchQuery = searchQuery.eq('published', published);
      }

      const { data, error } = await searchQuery;

      if (error) {
        throw new Error(`Failed to search pages: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Error searching pages', { query, options }, error as Error);
      throw error;
    }
  }

  /**
   * Increment view count
   */
  async incrementViewCount(pageId: string): Promise<void> {
    try {
      // Get current view count and increment
      const { data: currentPage } = await this.supabase
        .from('pages')
        .select('view_count')
        .eq('id', pageId)
        .single();
        
      if (currentPage) {
        const { error } = await this.supabase
          .from('pages')
          .update({ view_count: (currentPage.view_count || 0) + 1 })
          .eq('id', pageId);
          
        if (error) {
          logger.warn('Failed to increment view count', { pageId, error: error.message });
        }
      }
    } catch (error) {
      logger.warn('Error incrementing view count', { pageId });
    }
  }
}

// Export singleton instance
export const pagesService = new PagesService();

// Export types for external use
export type { Page, PageInsert, PageUpdate };