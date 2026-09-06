import { createClient } from "@supabase/supabase-js";

const projectUrl = import.meta.env.VITE_SUPABASE_URL || "https://mhzowfiofnpbsysfnvpf.supabase.co";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// supabase-js persists the auth session to localStorage itself
// (persistSession: true), with its own setItem calls we don't control.
// If the browser's storage quota is already full, an unwrapped setItem
// throws — and since session persistence runs during auth
// init/refresh (i.e. very early after load), an uncaught
// QuotaExceededError here could crash the whole app to a blank screen
// moments after it starts. This adapter makes every operation
// swallow storage errors instead of throwing, mirroring the
// safeLocalStorageSet wrapper the rest of the app already uses.
const safeAuthStorage = {
  getItem: (key: string) => {
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key: string, value: string) => {
    try { window.localStorage.setItem(key, value); } catch { /* quota exceeded or storage disabled — ignore */ }
  },
  removeItem: (key: string) => {
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
  },
};

export const supabaseConfigured = Boolean(anonKey);
export const supabase = supabaseConfigured
  ? createClient(projectUrl, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: safeAuthStorage,
      },
    })
  : null;

export const SUPABASE_PROJECT_URL = projectUrl;
