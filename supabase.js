import { createClient } from "@supabase/supabase-js";

const env = process["env"];
const url = env["NEXT_PUBLIC_SUPABASE_URL"];
const key = env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

if (!url || !key) throw new Error("Missing Supabase environment variables");

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});