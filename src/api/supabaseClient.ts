import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly at startup rather than producing confusing runtime errors
  // on the first auth call.
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in."
  );
}

// The anon key is a "publishable" key by design — safe to ship in frontend
// bundles. Every table it can touch is protected by Row Level Security
// (see supabase/migrations/0001_init.sql), so the key itself grants no
// access on its own.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
