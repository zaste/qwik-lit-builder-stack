// Database types for TypeScript support
export interface Database {
  public: {
    Tables: {
      file_metadata: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_size: number;
          mime_type: string | null;
          storage_path: string;
          storage_provider: string;
          thumbnail_path: string | null;
          upload_status: string;
          created_at: string;
          updated_at: string;
          metadata: any;
          tags: string[];
          search_vector: unknown | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          file_size: number;
          mime_type?: string | null;
          storage_path: string;
          storage_provider?: string;
          thumbnail_path?: string | null;
          upload_status?: string;
          created_at?: string;
          updated_at?: string;
          metadata?: any;
          tags?: string[];
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          file_size?: number;
          mime_type?: string | null;
          storage_path?: string;
          storage_provider?: string;
          thumbnail_path?: string | null;
          upload_status?: string;
          created_at?: string;
          updated_at?: string;
          metadata?: any;
          tags?: string[];
        };
      };
      file_versions: {
        Row: {
          id: string;
          file_id: string;
          version_number: number;
          storage_path: string;
          file_size: number;
          created_at: string;
          changes_description: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          file_id: string;
          version_number: number;
          storage_path: string;
          file_size: number;
          created_at?: string;
          changes_description?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          file_id?: string;
          version_number?: number;
          storage_path?: string;
          file_size?: number;
          created_at?: string;
          changes_description?: string | null;
          created_by?: string | null;
        };
      };
      batch_operations: {
        Row: {
          id: string;
          user_id: string;
          operation_type: string;
          status: string;
          total_files: number;
          processed_files: number;
          failed_files: number;
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
          error_message: string | null;
          operation_data: any;
        };
        Insert: {
          id?: string;
          user_id: string;
          operation_type: string;
          status?: string;
          total_files?: number;
          processed_files?: number;
          failed_files?: number;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          operation_data?: any;
        };
        Update: {
          id?: string;
          user_id?: string;
          operation_type?: string;
          status?: string;
          total_files?: number;
          processed_files?: number;
          failed_files?: number;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          operation_data?: any;
        };
      };
      file_sharing: {
        Row: {
          id: string;
          file_id: string;
          shared_with_user_id: string | null;
          shared_by_user_id: string;
          permission_level: string;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          file_id: string;
          shared_with_user_id?: string | null;
          shared_by_user_id: string;
          permission_level?: string;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          file_id?: string;
          shared_with_user_id?: string | null;
          shared_by_user_id?: string;
          permission_level?: string;
          expires_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      user_file_stats: {
        Row: {
          user_id: string;
          total_files: number;
          total_size: number;
          image_count: number;
          video_count: number;
          audio_count: number;
          document_count: number;
          last_upload: string;
          avg_file_size: number;
        };
      };
      recent_files: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_size: number;
          mime_type: string | null;
          storage_path: string;
          storage_provider: string;
          thumbnail_path: string | null;
          upload_status: string;
          created_at: string;
          updated_at: string;
          metadata: any;
          tags: string[];
          search_vector: unknown | null;
          user_email: string;
        };
      };
    };
    Functions: {
      cleanup_orphaned_files: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
    };
  };
}