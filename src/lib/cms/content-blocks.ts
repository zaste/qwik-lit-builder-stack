/**
 * Content Blocks Service
 * Handles content block management for pages
 */

import { getSupabaseClient } from '../supabase';
import type { Database } from '../database.types';
import { logger } from '../logger';

type ContentBlock = Database['public']['Tables']['content_blocks']['Row'];
type ContentBlockInsert = Database['public']['Tables']['content_blocks']['Insert'];
type ContentBlockUpdate = Database['public']['Tables']['content_blocks']['Update'];

export interface CreateBlockRequest {
  page_id: string;
  block_type: string;
  component_name?: string;
  properties?: any;
  children?: any[];
  order_index?: number;
  region?: string;
  parent_block_id?: string;
}

export interface UpdateBlockRequest {
  block_type?: string;
  component_name?: string;
  properties?: any;
  children?: any[];
  order_index?: number;
  region?: string;
  visibility_rules?: any;
  custom_css?: string;
  custom_classes?: string[];
}

export interface ReorderBlocksRequest {
  blocks: { id: string; order_index: number }[];
}

/**
 * Content Blocks Service Class
 */
export class ContentBlocksService {
  private supabase = getSupabaseClient();

  /**
   * Get all blocks for a page
   */
  async getPageBlocks(pageId: string): Promise<ContentBlock[]> {
    try {
      const { data, error } = await this.supabase
        .from('content_blocks')
        .select('*')
        .eq('page_id', pageId)
        .order('order_index', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch content blocks: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching page blocks', { pageId }, error as Error);
      throw error;
    }
  }

  /**
   * Get blocks by region
   */
  async getBlocksByRegion(pageId: string, region: string): Promise<ContentBlock[]> {
    try {
      const { data, error } = await this.supabase
        .from('content_blocks')
        .select('*')
        .eq('page_id', pageId)
        .eq('region', region)
        .order('order_index', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch blocks for region: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching blocks by region', { pageId, region }, error as Error);
      throw error;
    }
  }

  /**
   * Get single block
   */
  async getBlock(blockId: string): Promise<ContentBlock | null> {
    try {
      const { data, error } = await this.supabase
        .from('content_blocks')
        .select('*')
        .eq('id', blockId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw new Error(`Failed to fetch content block: ${error.message}`);
      }

      return data || null;
    } catch (error) {
      logger.error('Error fetching content block', { blockId }, error as Error);
      throw error;
    }
  }

  /**
   * Create new content block
   */
  async createBlock(blockData: CreateBlockRequest): Promise<ContentBlock> {
    try {
      // Get the highest order index for the region if not specified
      let orderIndex = blockData.order_index;
      if (orderIndex === undefined) {
        const { data: maxOrderData } = await this.supabase
          .from('content_blocks')
          .select('order_index')
          .eq('page_id', blockData.page_id)
          .eq('region', blockData.region || 'main')
          .order('order_index', { ascending: false })
          .limit(1);

        orderIndex = (maxOrderData?.[0]?.order_index || -1) + 1;
      }

      const insertData: ContentBlockInsert = {
        page_id: blockData.page_id,
        block_type: blockData.block_type,
        component_name: blockData.component_name || blockData.block_type,
        properties: blockData.properties || {},
        children: blockData.children as any || [],
        order_index: orderIndex,
        region: blockData.region || 'main',
        parent_block_id: blockData.parent_block_id || null,
        visibility_rules: {},
        block_version: '1.0.0'
      };

      const { data, error } = await this.supabase
        .from('content_blocks')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create content block: ${error.message}`);
      }

      logger.info('Content block created successfully', {
        blockId: data.id,
        pageId: blockData.page_id,
        type: blockData.block_type
      });

      return data;
    } catch (error) {
      logger.error('Error creating content block', blockData, error as Error);
      throw error;
    }
  }

  /**
   * Update content block
   */
  async updateBlock(blockId: string, updates: UpdateBlockRequest): Promise<ContentBlock> {
    try {
      const updateData: ContentBlockUpdate = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('content_blocks')
        .update(updateData)
        .eq('id', blockId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update content block: ${error.message}`);
      }

      logger.info('Content block updated successfully', {
        blockId,
        updates: Object.keys(updates)
      });

      return data;
    } catch (error) {
      logger.error('Error updating content block', { blockId, updates }, error as Error);
      throw error;
    }
  }

  /**
   * Delete content block
   */
  async deleteBlock(blockId: string): Promise<void> {
    try {
      // First get the block to know its position for reordering
      const block = await this.getBlock(blockId);
      if (!block) {
        throw new Error('Content block not found');
      }

      // Delete the block
      const { error } = await this.supabase
        .from('content_blocks')
        .delete()
        .eq('id', blockId);

      if (error) {
        throw new Error(`Failed to delete content block: ${error.message}`);
      }

      // Reorder remaining blocks in the same region
      await this.reorderBlocksAfterDeletion(block.page_id, block.region, block.order_index);

      logger.info('Content block deleted successfully', { blockId });
    } catch (error) {
      logger.error('Error deleting content block', { blockId }, error as Error);
      throw error;
    }
  }

  /**
   * Reorder blocks within a region
   */
  async reorderBlocks(pageId: string, region: string, reorderData: ReorderBlocksRequest): Promise<void> {
    try {
      // Update each block's order_index in a transaction-like manner
      const updates = reorderData.blocks.map(block => 
        this.supabase
          .from('content_blocks')
          .update({ 
            order_index: block.order_index,
            updated_at: new Date().toISOString()
          })
          .eq('id', block.id)
          .eq('page_id', pageId)
          .eq('region', region)
      );

      const results = await Promise.all(updates);
      
      // Check for errors
      const errorResults = results.filter(result => result.error);
      if (errorResults.length > 0) {
        throw new Error(`Failed to reorder blocks: ${errorResults[0].error?.message}`);
      }

      logger.info('Blocks reordered successfully', {
        pageId,
        region,
        blocksCount: reorderData.blocks.length
      });
    } catch (error) {
      logger.error('Error reordering blocks', { pageId, region, reorderData }, error as Error);
      throw error;
    }
  }

  /**
   * Move block to different region
   */
  async moveBlockToRegion(blockId: string, newRegion: string, newOrderIndex?: number): Promise<ContentBlock> {
    try {
      const block = await this.getBlock(blockId);
      if (!block) {
        throw new Error('Content block not found');
      }

      // Get the highest order index for the new region if not specified
      let orderIndex = newOrderIndex;
      if (orderIndex === undefined) {
        const { data: maxOrderData } = await this.supabase
          .from('content_blocks')
          .select('order_index')
          .eq('page_id', block.page_id)
          .eq('region', newRegion)
          .order('order_index', { ascending: false })
          .limit(1);

        orderIndex = (maxOrderData?.[0]?.order_index || -1) + 1;
      }

      // Update the block
      const updatedBlock = await this.updateBlock(blockId, {
        region: newRegion,
        order_index: orderIndex
      });

      // Reorder blocks in the old region
      await this.reorderBlocksAfterDeletion(block.page_id, block.region, block.order_index);

      logger.info('Block moved to new region', {
        blockId,
        oldRegion: block.region,
        newRegion,
        orderIndex
      });

      return updatedBlock;
    } catch (error) {
      logger.error('Error moving block to region', { blockId, newRegion }, error as Error);
      throw error;
    }
  }

  /**
   * Duplicate content block
   */
  async duplicateBlock(blockId: string): Promise<ContentBlock> {
    try {
      const originalBlock = await this.getBlock(blockId);
      if (!originalBlock) {
        throw new Error('Content block not found');
      }

      // Create a copy with new order index
      const duplicateData: CreateBlockRequest = {
        page_id: originalBlock.page_id,
        block_type: originalBlock.block_type,
        component_name: originalBlock.component_name || undefined,
        properties: originalBlock.properties,
        children: originalBlock.children as any,
        region: originalBlock.region,
        parent_block_id: originalBlock.parent_block_id || undefined
      };

      const duplicatedBlock = await this.createBlock(duplicateData);

      logger.info('Block duplicated successfully', {
        originalBlockId: blockId,
        duplicatedBlockId: duplicatedBlock.id
      });

      return duplicatedBlock;
    } catch (error) {
      logger.error('Error duplicating block', { blockId }, error as Error);
      throw error;
    }
  }

  /**
   * Get available component types from component library
   */
  async getAvailableComponents(): Promise<Database['public']['Tables']['component_library']['Row'][]> {
    try {
      const { data, error } = await this.supabase
        .from('component_library')
        .select('*')
        .eq('active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch component library: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching available components', {}, error as Error);
      throw error;
    }
  }

  /**
   * Helper: Reorder blocks after deletion
   */
  private async reorderBlocksAfterDeletion(pageId: string, region: string, deletedOrderIndex: number): Promise<void> {
    try {
      // Get all blocks in the region that come after the deleted block
      const { data: blocksToReorder, error } = await this.supabase
        .from('content_blocks')
        .select('id, order_index')
        .eq('page_id', pageId)
        .eq('region', region)
        .gt('order_index', deletedOrderIndex)
        .order('order_index', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch blocks for reordering: ${error.message}`);
      }

      if (!blocksToReorder || blocksToReorder.length === 0) {
        return; // Nothing to reorder
      }

      // Update order indexes (shift everything down by 1)
      const updates = blocksToReorder.map(block => 
        this.supabase
          .from('content_blocks')
          .update({ 
            order_index: block.order_index - 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', block.id)
      );

      await Promise.all(updates);

      logger.info('Blocks reordered after deletion', {
        pageId,
        region,
        reorderedCount: blocksToReorder.length
      });
    } catch (error) {
      logger.error('Error reordering blocks after deletion', 
        { pageId, region, deletedOrderIndex }, error as Error);
      // Don't throw - this is a cleanup operation
    }
  }
}

// Export singleton instance
export const contentBlocksService = new ContentBlocksService();

// Export types for external use
export type { ContentBlock };