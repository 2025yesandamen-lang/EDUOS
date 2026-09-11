import { createBrowserClient } from "@supabase/ssr";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const supabaseUrl = 
  (typeof process !== "undefined" && process.env?.SUPABASE_URL) ||
  (typeof window !== "undefined" && (window as any).env?.SUPABASE_URL) ||
  "https://qobtybbklcqmdwsrwito.supabase.co";

const supabaseKey =
  (typeof process !== "undefined" && (process.env?.SUPABASE_PUBLISHABLE_KEY || process.env?.SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_PUBLISHABLE_KEY || process.env?.VITE_SUPABASE_ANON_KEY)) ||
  (typeof window !== "undefined" && ((window as any).env?.SUPABASE_PUBLISHABLE_KEY || (window as any).env?.SUPABASE_ANON_KEY || (window as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || (window as any).env?.VITE_SUPABASE_ANON_KEY)) ||
  "";

export const createClient = () => {
  if (!supabaseKey) {
    return new Proxy({} as any, {
      get: () => () => Promise.resolve({ data: null, error: null }),
    });
  }
  return createBrowserClient(
    supabaseUrl,
    supabaseKey
  );
};
