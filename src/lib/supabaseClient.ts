import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseBrowserClient: SupabaseClient | null = null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const getSupabaseBrowserClient = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!supabaseBrowserClient) {
    supabaseBrowserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return supabaseBrowserClient;
};
