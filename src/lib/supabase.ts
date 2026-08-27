import { createClient } from "@supabase/supabase-js";

const projectUrl = import.meta.env.VITE_SUPABASE_URL || "https://mhzowfiofnpbsysfnvpf.supabase.co";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabaseConfigured = Boolean(anonKey);
export const supabase = supabaseConfigured
  ? createClient(projectUrl, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const SUPABASE_PROJECT_URL = projectUrl;
