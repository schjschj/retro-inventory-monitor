import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  const cleanUrl = String(supabaseUrl).trim();
  return (
    (cleanUrl.startsWith('https://') || cleanUrl.startsWith('http://')) &&
    cleanUrl !== 'https://your-project-id.supabase.co' &&
    !cleanUrl.includes('placeholder') &&
    !cleanUrl.includes('•••') &&
    !cleanUrl.includes('••••')
  );
};

let client = null;
if (isSupabaseConfigured()) {
  try {
    client = createClient(supabaseUrl.trim(), supabaseAnonKey.trim(), {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    client = null;
  }
}

export const supabase = client;
