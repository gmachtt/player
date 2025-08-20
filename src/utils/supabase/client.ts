import { createBrowserClient } from "@supabase/ssr";
import { createClient as createNewClient } from "@supabase/supabase-js";

// For client-side Supabase browser client (replaces createClientComponentClient)
export function createClient<T = Record<string, unknown>>() {
  return createBrowserClient<T>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
}

// For admin/server-side Supabase client (unchanged - this was already correct)
export const createAdminClient = <T = Record<string, unknown>>() =>
  createNewClient<T>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
