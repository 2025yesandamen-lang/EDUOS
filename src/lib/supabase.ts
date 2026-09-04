import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Ensure local env vars are loaded before the Supabase client is initialized.
dotenv.config({ path: ".env.local" });
dotenv.config();

const getEnvValue = (key: string): string => {
  if (typeof window !== "undefined") {
    const windowEnv = (window as any).env?.[key];
    if (windowEnv) return String(windowEnv);
  }

  if (typeof globalThis !== "undefined") {
    const globalEnv = (globalThis as any).env?.[key];
    if (globalEnv) return String(globalEnv);
  }

  if (typeof process !== "undefined" && process.env?.[key]) {
    return String(process.env[key]);
  }

  return "";
};

// Retrieve Supabase URL and Anon/Publishable Key from environment variables.
const supabaseUrl =
  getEnvValue("VITE_SUPABASE_URL") ||
  getEnvValue("SUPABASE_URL") ||
  "https://qobtybbklcqmdwsrwito.supabase.co";

const supabaseAnonKey =
  getEnvValue("VITE_SUPABASE_PUBLISHABLE_KEY") ||
  getEnvValue("VITE_SUPABASE_ANON_KEY") ||
  getEnvValue("SUPABASE_PUBLISHABLE_KEY") ||
  getEnvValue("SUPABASE_ANON_KEY") ||
  "";

// Initialize the standard Supabase client for client-side operations.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
