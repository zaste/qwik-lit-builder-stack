import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Singleton pattern for Supabase client
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Get Supabase client for browser/server
 */
export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'x-application-name': 'qwik-lit-builder',
        },
      },
      // Enable realtime for specific schemas
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return supabaseClient;
}

/**
 * Supabase auth helpers
 */
export const supabaseAuth = {
  async signIn(email: string, password: string) {
    const supabase = getSupabaseClient();
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signUp(email: string, password: string, metadata?: any) {
    const supabase = getSupabaseClient();
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
  },

  async signInWithOAuth(provider: 'google' | 'github' | 'discord') {
    const supabase = getSupabaseClient();
    return supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  },

  async signInWithMagicLink(email: string) {
    const supabase = getSupabaseClient();
    return supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  },

  async signOut() {
    const supabase = getSupabaseClient();
    return supabase.auth.signOut();
  },

  async getSession() {
    const supabase = getSupabaseClient();
    return supabase.auth.getSession();
  },

  async getUser() {
    const supabase = getSupabaseClient();
    return supabase.auth.getUser();
  },

  onAuthStateChange(callback: (event: any, session: any) => void) {
    const supabase = getSupabaseClient();
    return supabase.auth.onAuthStateChange(callback);
  },
};

/**
 * Supabase storage helpers
 */
export const supabaseStorage = {
  async uploadFile(bucket: string, path: string, file: File) {
    const supabase = getSupabaseClient();
    return supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
  },

  async downloadFile(bucket: string, path: string) {
    const supabase = getSupabaseClient();
    return supabase.storage.from(bucket).download(path);
  },

  async deleteFile(bucket: string, paths: string[]) {
    const supabase = getSupabaseClient();
    return supabase.storage.from(bucket).remove(paths);
  },

  getPublicUrl(bucket: string, path: string) {
    const supabase = getSupabaseClient();
    return supabase.storage.from(bucket).getPublicUrl(path);
  },

  async createSignedUrl(bucket: string, path: string, expiresIn: number) {
    const supabase = getSupabaseClient();
    return supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  },
};

/**
 * Supabase realtime helpers
 */
export const supabaseRealtime = {
  channel(channelName: string) {
    const supabase = getSupabaseClient();
    return supabase.channel(channelName);
  },

  removeChannel(channel: any) {
    const supabase = getSupabaseClient();
    return supabase.removeChannel(channel);
  },

  // Presence helper for user status
  async trackPresence(channelName: string, userState: any) {
    const channel = this.channel(channelName);
    
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track(userState);
      }
    });

    return channel;
  },

  // Broadcast helper for real-time updates
  broadcast(channelName: string, event: string, payload: any) {
    const channel = this.channel(channelName);
    return channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  },
};