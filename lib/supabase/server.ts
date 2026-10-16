import {createClient} from '@supabase/supabase-js';

function requiredEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

/**
 * Creates the server-side Supabase client used for normal application queries.
 * Keep this module out of client components; it reads environment variables at runtime.
 */
export function createSupabaseServerClient() {
  return createClient(
    requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {auth: {autoRefreshToken: false, persistSession: false}},
  );
}
