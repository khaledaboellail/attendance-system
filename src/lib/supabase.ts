import { createClient } from '@supabase/supabase-js';

// استخدم NEXT_PUBLIC keys للقراءة فقط في client إذا حبيت
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Service Role Client (server-side فقط)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
