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
      throw new Error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
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

// Mock client removed - using real Supabase only

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
 * Note: File storage moved to Cloudflare R2
 * All file operations now handled by src/lib/storage/storage-router.ts
 * Supabase only handles database and authentication
 */

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