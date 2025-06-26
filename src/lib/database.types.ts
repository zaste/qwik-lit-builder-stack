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