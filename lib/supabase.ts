import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/* ─── Base Clients ─── */

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey
);

/* ─── 1. Posts / Blog ─── */

export interface PostRow {
  id: string;
  slug: string;
  title: string;
  category: 'Event Recap' | 'Campus Event' | 'Recruitment' | 'Official Advisory';
  date: string;
  excerpt: string;
  full_content: string;
  image_url: string | null;
  highlight_quote: string | null;
  quote_author: string | null;
  post_url: string | null;
  tags: string[];
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export async function getPosts(): Promise<PostRow[]> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data as PostRow[]) || [];
  } catch {
    return [];
  }
}

export function postRowToSocialDispatch(row: PostRow) {
  return {
    id: row.id,
    imageUrl: row.image_url || undefined,
    date: row.date,
    category: row.category,
    title: row.title,
    highlightQuote: row.highlight_quote || undefined,
    quoteAuthor: row.quote_author || undefined,
    excerpt: row.excerpt,
    fullContent: row.full_content,
    postUrl: row.post_url || '',
    tags: row.tags || [],
    featured: row.featured,
    credits: {
      writer: row.quote_author || undefined,
    },
  };
}

/* ─── 2. Documents (Resolutions, Memos, Minutes) ─── */

export interface DocumentRow {
  id: string;
  category: 'Resolution' | 'Memo' | 'Minutes';
  reference_no: string;
  title: string;
  date: string;
  description: string;
  status: 'Draft' | 'Approved' | 'Published';
  file_url: string | null;
  file_name: string | null;
  created_at: string;
}

export async function getDocuments(): Promise<DocumentRow[]> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data as DocumentRow[]) || [];
  } catch {
    return [];
  }
}

/* ─── 3. Treasury Records ─── */

export interface TreasuryRow {
  id: string;
  title: string;
  period: string;
  description: string;
  status: 'Draft' | 'Published';
  amount: number;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
}

export async function getTreasuryRecords(): Promise<TreasuryRow[]> {
  try {
    const { data, error } = await supabase
      .from('treasury_records')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data as TreasuryRow[]) || [];
  } catch {
    return [];
  }
}

/* ─── 4. Attendance System ─── */

export interface MeetingRow {
  id: string;
  title: string;
  type: 'regular' | 'emergency';
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  description: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
}

export interface AttendanceRecordRow {
  id: string;
  meeting_id: string;
  officer_name: string;
  position: string;
  scanned_at: string;
  qr_token: string;
  status: 'present' | 'late' | 'absent';
  method: 'qr' | 'manual';
}

export async function getMeetings(): Promise<MeetingRow[]> {
  try {
    const { data, error } = await supabase
      .from('attendance_meetings')
      .select('*')
      .order('date', { ascending: false });
    if (error) return [];
    return (data as MeetingRow[]) || [];
  } catch {
    return [];
  }
}

export async function getAttendanceRecords(meetingId?: string): Promise<AttendanceRecordRow[]> {
  try {
    let query = supabase.from('attendance_records').select('*').order('scanned_at', { ascending: false });
    if (meetingId) {
      query = query.eq('meeting_id', meetingId);
    }
    const { data, error } = await query;
    if (error) return [];
    return (data as AttendanceRecordRow[]) || [];
  } catch {
    return [];
  }
}

/* ─── 5. Events ─── */

export interface EventRow {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
}

export async function getEvents(): Promise<EventRow[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data as EventRow[]) || [];
  } catch {
    return [];
  }
}

/* ─── 6. Officers ─── */

export interface OfficerRow {
  id: string;
  name: string;
  position: string;
  role_group: string;
  year_section: string;
  quote: string | null;
  image_url: string | null;
  is_pubmat: boolean;
  pubmat_role: string | null;
  email?: string | null;
  created_at: string;
}

export async function getOfficers(): Promise<OfficerRow[]> {
  try {
    const { data, error } = await supabase
      .from('officers')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) return [];
    return (data as OfficerRow[]) || [];
  } catch {
    return [];
  }
}

export async function findOfficerByEmail(email: string): Promise<OfficerRow | null> {
  try {
    const trimmed = email.trim().toLowerCase();
    const { data, error } = await supabase
      .from('officers')
      .select('*')
      .ilike('email', trimmed)
      .maybeSingle();
    if (error || !data) return null;
    return data as OfficerRow;
  } catch {
    return null;
  }
}

/* ─── 7. Projects ─── */

export interface ProjectRow {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  image_url: string | null;
  demo_url: string | null;
  github_url: string | null;
  status: string;
  created_at: string;
}

export async function getProjects(): Promise<ProjectRow[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data as ProjectRow[]) || [];
  } catch {
    return [];
  }
}

/* ─── 8. Audit Reports ─── */

export interface AuditReportRow {
  id: string;
  title: string;
  academic_year: string;
  semester: string;
  summary: string;
  status: string;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
}

export async function getAuditReports(): Promise<AuditReportRow[]> {
  try {
    const { data, error } = await supabase
      .from('audit_reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data as AuditReportRow[]) || [];
  } catch {
    return [];
  }
}
