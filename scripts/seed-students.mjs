import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env.local if not present
const envPath = path.join(rootDir, '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const filePath = path.join('C:', 'Users', 'BONFIRE BASE', 'Downloads', 'University_of_Antique_Master_Class_List.xlsx');

function normalizeStudentName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseSection(sheetName) {
  // "BS INFO 3-A" -> { yearLevel: 3, section: "A" }
  const match = sheetName.match(/BS INFO (\d)-([A-E])/i);
  if (!match) return null;
  return { yearLevel: parseInt(match[1], 10), section: match[2].toUpperCase() };
}

async function main() {
  console.log('Reading Excel file...');
  const wb = XLSX.readFile(filePath);

  // Collect unique students from individual section sheets (not Master List)
  // The section sheets give us year_level and section info
  const studentsMap = new Map();

  for (const sheetName of wb.SheetNames) {
    if (sheetName === 'Master List') continue;

    const sectionInfo = parseSection(sheetName);
    if (!sectionInfo) {
      console.log(`  Skipping sheet: ${sheetName} (not a section sheet)`);
      continue;
    }

    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const studentNo = row[1] ? String(row[1]).trim() : null;
      const fullName = row[2] ? String(row[2]).trim() : null;

      if (!studentNo || !fullName) continue;

      // Only keep first occurrence (first section listed)
      if (!studentsMap.has(studentNo)) {
        studentsMap.set(studentNo, {
          student_no: studentNo,
          full_name: fullName,
          full_name_normalized: normalizeStudentName(fullName),
          year_level: sectionInfo.yearLevel,
          section: sectionInfo.section,
          year_section: `BSIT ${sectionInfo.yearLevel}-${sectionInfo.section}`,
          program: 'BSIT',
          is_active: true,
        });
      }
    }
  }

  const students = Array.from(studentsMap.values());
  console.log(`Parsed ${students.length} unique students from ${wb.SheetNames.length - 1} section sheets.`);

  // Year level breakdown
  const breakdown = {};
  students.forEach(s => {
    const key = `Year ${s.year_level}`;
    breakdown[key] = (breakdown[key] || 0) + 1;
  });
  console.log('Year level breakdown:', breakdown);

  // Upsert to Supabase in batches of 50
  const BATCH_SIZE = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('students')
      .upsert(batch, { onConflict: 'student_no', ignoreDuplicates: false })
      .select('id');

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      errors += batch.length;
    } else {
      inserted += data ? data.length : batch.length;
      process.stdout.write(`  Upserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(students.length / BATCH_SIZE)} (${inserted} total)\r`);
    }
  }

  console.log(`\n\nSeed complete!`);
  console.log(`  Total upserted: ${inserted}`);
  if (errors > 0) console.log(`  Errors: ${errors}`);

  // Verify count
  const { count } = await supabase.from('students').select('*', { count: 'exact', head: true });
  console.log(`  Verified total in database: ${count}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
