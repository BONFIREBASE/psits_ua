import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectBanners() {
  const { data, error } = await supabase.from('banners').select('*');
  if (error) console.error(error);
  else console.log('Banners:', JSON.stringify(data, null, 2));
}

inspectBanners();
