import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Singleton pattern for Supabase client
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Get Supabase client for browser/server
 */
export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
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
    if (!supabase) return { data: null, error: new Error('Supabase not available') };
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signUp(email: string, password: string, metadata?: any) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: new Error('Supabase not available') };
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
    if (!supabase) {
      throw new Error('Supabase client not available');
    }
    return supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  },

  async signInWithMagicLink(email: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: new Error('Supabase not available') };
    return supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  },

  async signOut() {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: null };
    return supabase.auth.signOut();
  },

  async getSession() {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: { session: null }, error: null };
    return supabase.auth.getSession();
  },

  async getUser() {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: { user: null }, error: null };
    return supabase.auth.getUser();
  },

  onAuthStateChange(callback: (event: any, session: any) => void) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
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
    if (!supabase) {
      throw new Error('Supabase client not available for realtime channels');
    }
    return supabase.channel(channelName);
  },

  removeChannel(channel: any) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    return supabase.removeChannel(channel);
  },

  // Presence helper for user status
  async trackPresence(channelName: string, userState: any) {
    const channel = this.channel(channelName);
    
    channel.subscribe(async (status: string) => {
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