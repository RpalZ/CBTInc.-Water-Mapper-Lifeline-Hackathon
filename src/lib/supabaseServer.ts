import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseSecretKey = process.env.NEXT_SUPABASE_SECRET_KEY as string;

export const supabaseAdmin = createClient(supabaseURL, supabaseSecretKey, {
    auth : {
        persistSession: false,
        autoRefreshToken: false
    }
})