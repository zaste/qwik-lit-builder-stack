/**
 * Database types generated from Supabase
 * Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          website: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
        }
      }
      pages: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          slug: string
          description: string | null
          content: Json
          meta_data: Json
          published: boolean
          published_at: string | null
          seo_title: string | null
          seo_description: string | null
          featured_image: string | null
          social_image: string | null
          template: string
          layout: Json
          author_id: string | null
          view_count: number
          deleted_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          slug: string
          description?: string | null
          content?: Json
          meta_data?: Json
          published?: boolean
          published_at?: string | null
          seo_title?: string | null
          seo_description?: string | null
          featured_image?: string | null
          social_image?: string | null
          template?: string
          layout?: Json
          author_id?: string | null
          view_count?: number
          deleted_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          slug?: string
          description?: string | null
          content?: Json
          meta_data?: Json
          published?: boolean
          published_at?: string | null
          seo_title?: string | null
          seo_description?: string | null
          featured_image?: string | null
          social_image?: string | null
          template?: string
          layout?: Json
          author_id?: string | null
          view_count?: number
          deleted_at?: string | null
        }
      }
      content_blocks: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          page_id: string
          parent_block_id: string | null
          block_type: string
          component_name: string | null
          properties: Json
          children: Json
          order_index: number
          region: string
          visibility_rules: Json
          block_version: string
          custom_css: string | null
          custom_classes: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          page_id: string
          parent_block_id?: string | null
          block_type: string
          component_name?: string | null
          properties?: Json
          children?: Json
          order_index?: number
          region?: string
          visibility_rules?: Json
          block_version?: string
          custom_css?: string | null
          custom_classes?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          page_id?: string
          parent_block_id?: string | null
          block_type?: string
          component_name?: string | null
          properties?: Json
          children?: Json
          order_index?: number
          region?: string
          visibility_rules?: Json
          block_version?: string
          custom_css?: string | null
          custom_classes?: string[] | null
        }
      }
      page_templates: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          preview_image: string | null
          structure: Json
          default_blocks: Json
          regions: string[] | null
          settings: Json
          author_id: string | null
          active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          preview_image?: string | null
          structure: Json
          default_blocks?: Json
          regions?: string[] | null
          settings?: Json
          author_id?: string | null
          active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          preview_image?: string | null
          structure?: Json
          default_blocks?: Json
          regions?: string[] | null
          settings?: Json
          author_id?: string | null
          active?: boolean
        }
      }
      component_library: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          display_name: string
          description: string | null
          category: string
          schema: Json
          default_props: Json
          design_tokens: Json
          style_variants: Json
          example_usage: Json
          documentation_url: string | null
          active: boolean
          version: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          display_name: string
          description?: string | null
          category?: string
          schema: Json
          default_props?: Json
          design_tokens?: Json
          style_variants?: Json
          example_usage?: Json
          documentation_url?: string | null
          active?: boolean
          version?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          display_name?: string
          description?: string | null
          category?: string
          schema?: Json
          default_props?: Json
          design_tokens?: Json
          style_variants?: Json
          example_usage?: Json
          documentation_url?: string | null
          active?: boolean
          version?: string
        }
      }
      posts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          content: string | null
          published: boolean
          author_id: string
          slug: string
          featured_image: string | null
          view_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          content?: string | null
          published?: boolean
          author_id: string
          slug: string
          featured_image?: string | null
          view_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          content?: string | null
          published?: boolean
          author_id?: string
          slug?: string
          featured_image?: string | null
          view_count?: number
        }
      }
      comments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          content: string
          post_id: string
          author_id: string
          parent_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          content: string
          post_id: string
          author_id: string
          parent_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          content?: string
          post_id?: string
          author_id?: string
          parent_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}