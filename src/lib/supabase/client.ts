import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Lazily creates the Supabase client. Returns null (instead of throwing at
 * module load) when realtime env vars are not configured, so the rest of the
 * app still runs.
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key);
  }
  return client;
}
