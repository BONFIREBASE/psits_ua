import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tcegaknsectohxpilrdp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjZWdha25zZWN0b2h4cGlscmRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUwNjQyMywiZXhwIjoyMTA1MDgyNDIzfQ.OrfBYcz_QVBg9l-APgWt7JtRGbakHLhTt5QFobdSIhI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log('--- Listing Supabase Auth Users ---');
  const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 100 });
  if (error) console.error(error);
  
  for (const u of users) {
    console.log({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      metadata: u.user_metadata,
    });
  }

  console.log('\n--- Searching students table for "RAN" or "LI" or "JOSHUA" or "NARCEÑA" ---');
  const { data: students } = await supabase
    .from('students')
    .select('student_no, full_name, year_section, is_active')
    .or('full_name.ilike.%Li%,full_name.ilike.%Joshua%,full_name.ilike.%Narceña%,full_name.ilike.%Ran%');
  
  console.log('Students found:', students);
}

inspect().catch(console.error);
