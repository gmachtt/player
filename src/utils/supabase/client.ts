import { createBrowserClient } from "@supabase/ssr";
import { createClient as createNewClient } from "@supabase/supabase-js";

// For client-side Supabase browser client (replaces createClientComponentClient)
export function createClient<T = any>() {
  return createBrowserClient<T>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// For admin/server-side Supabase client (unchanged - this was already correct)
export const createAdminClient = <T = any>() =>
  createNewClient<T>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
  );
