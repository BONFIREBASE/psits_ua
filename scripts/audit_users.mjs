import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  console.log('Querying Supabase Auth Users...');
  const { data: usersData, error: uErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (uErr) {
    console.error('Error fetching users:', uErr);
    return;
  }

  const users = usersData.users;
  console.log(`Found ${users.length} total auth users.\n`);

  for (const u of users) {
    const meta = u.user_metadata || {};
    const email = (u.email || '').toLowerCase().trim();
    const googleName = meta.full_name || meta.name || '';
    const username = meta.community_username || '(no handle)';
    const studentNo = meta.student_no || '';

    // Check student table by email prefix
    const idMatch = email.match(/^(\d{4})s(\d{5})@antiquespride\.edu\.ph$/i);
    const possibleNos = idMatch
      ? [`${idMatch[1]}-S${idMatch[2]}`, `${idMatch[1]}s${idMatch[2]}`, `${idMatch[1]}-s${idMatch[2]}`, email.split('@')[0]]
      : [email.split('@')[0]];

    const { data: studentsByNo } = await supabaseAdmin
      .from('students')
      .select('student_no, full_name, year_section, is_active')
      .in('student_no', possibleNos);

    // Search by student name in students table
    let studentsByName = [];
    if (googleName) {
      const parts = googleName.split(/\s+/).filter(p => p.length >= 3);
      if (parts.length > 0) {
        const { data: byName } = await supabaseAdmin
          .from('students')
          .select('student_no, full_name, year_section, is_active')
          .ilike('full_name', `%${parts[0]}%`)
          .limit(10);
        studentsByName = byName || [];
      }
    }

    console.log('==================================================');
    console.log(`Email: ${email}`);
    console.log(`Handle: @${username}`);
    console.log(`Google Name: "${googleName}"`);
    console.log(`Meta student_no: "${studentNo}"`);
    console.log(`Matched by student_no:`, JSON.stringify(studentsByNo));
    console.log(`Matched by name search:`, JSON.stringify(studentsByName));
  }
}

main();
