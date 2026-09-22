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
  credits?: Record<string, string> | null;
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
  const rowCredits = (row.credits as Record<string, string>) || {};
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
      writer: rowCredits.writer || row.quote_author || undefined,
      photographer: rowCredits.photographer || undefined,
      pubmat: rowCredits.pubmat || undefined,
      videographer: rowCredits.videographer || undefined,
      prepared_by: rowCredits.prepared_by || rowCredits.preparedby || undefined,
      ...rowCredits,
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

export const ROLE_GROUP_ORDER: Record<string, number> = {
  'Executive': 1,
  'Secretariat & Finance': 2,
  'Operations & PR': 3,
  'Year Representatives': 4,
};

export function getOfficerPositionRank(position: string): number {
  const norm = (position || '').toLowerCase().replace(/[\(\)\.]/g, ' ').replace(/\s+/g, ' ').trim();
  if (norm === 'president') return 1;
  if (norm === 'vice president') return 2;
  if (norm === 'secretary') return 10;
  if (norm === 'assistant secretary') return 11;
  if (norm === 'treasurer') return 12;
  if (norm === 'assistant treasurer') return 13;
  if (norm === 'auditor') return 14;
  if (norm === 'assistant auditor') return 15;
  if (norm.includes('public information officer 1') || norm.includes('pio 1')) return 20;
  if (norm.includes('public information officer 2') || norm.includes('pio 2')) return 21;
  if (norm.includes('business manager 1') || norm.includes('bm 1')) return 22;
  if (norm.includes('business manager 2') || norm.includes('bm 2')) return 23;
  if (norm.includes('1st year')) return 30;
  if (norm.includes('2nd year')) return 31;
  if (norm.includes('3rd year')) return 32;
  if (norm.includes('4th year')) return 33;
  return 99;
}

export function getPubmatRoleRank(roleOrPos: string): number {
  const norm = (roleOrPos || '').toLowerCase();
  const isLead = norm.includes('lead') || norm.includes('head');
  let categoryRank = 50;
  if (norm.includes('writer')) categoryRank = 10;
  else if (norm.includes('graphic') || norm.includes('designer')) categoryRank = 20;
  else if (norm.includes('photo') || norm.includes('video')) categoryRank = 30;
  else if (norm.includes('dev') || norm.includes('program')) categoryRank = 40;
  return (isLead ? 0 : 100) + categoryRank;
}

export function sortOfficersByHierarchy<T extends {
  name: string;
  position: string;
  role_group?: string;
  roleGroup?: string;
  is_pubmat?: boolean;
  isPubmat?: boolean;
  pubmat_role?: string | null;
  pubmatRole?: string | null;
}>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const aIsPubmat = !!(a.is_pubmat ?? a.isPubmat);
    const bIsPubmat = !!(b.is_pubmat ?? b.isPubmat);

    // If both are pubmat, sort by pubmat rank then name
    if (aIsPubmat && bIsPubmat) {
      const aPubRole = a.pubmat_role || a.pubmatRole || a.position;
      const bPubRole = b.pubmat_role || b.pubmatRole || b.position;
      const rankA = getPubmatRoleRank(aPubRole);
      const rankB = getPubmatRoleRank(bPubRole);
      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name);
    }

    // If one is pubmat and one is not
    if (aIsPubmat !== bIsPubmat) {
      return aIsPubmat ? 1 : -1;
    }

    // Role group hierarchy
    const groupA = a.role_group || a.roleGroup || '';
    const groupB = b.role_group || b.roleGroup || '';
    const groupRankA = ROLE_GROUP_ORDER[groupA] ?? 99;
    const groupRankB = ROLE_GROUP_ORDER[groupB] ?? 99;

    if (groupRankA !== groupRankB) {
      return groupRankA - groupRankB;
    }

    // Position rank within the same role group
    const posRankA = getOfficerPositionRank(a.position);
    const posRankB = getOfficerPositionRank(b.position);

    if (posRankA !== posRankB) {
      return posRankA - posRankB;
    }

    return a.name.localeCompare(b.name);
  });
}

export async function getOfficers(): Promise<OfficerRow[]> {
  try {
    const { data, error } = await supabase
      .from('officers')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) return [];
    const rows = (data as OfficerRow[]) || [];
    return sortOfficersByHierarchy(rows);
  } catch {
    return [];
  }
}

export async function getPubmatMembers(): Promise<OfficerRow[]> {
  try {
    const { data, error } = await supabase
      .from('officers')
      .select('*')
      .eq('is_pubmat', true)
      .order('name', { ascending: true });
    if (error) return [];
    const rows = (data as OfficerRow[]) || [];
    return sortOfficersByHierarchy(rows);
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

/* ─── 9. Banners ─── */

export interface BannerRow {
  id: string;
  title: string;
  subtitle: string;
  type: 'announcement' | 'meeting' | 'recruitment' | 'forms' | 'general';
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  secondary_link_url?: string | null;
  secondary_link_text?: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export async function getBanners(): Promise<BannerRow[]> {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data as BannerRow[]) || [];
  } catch {
    return [];
  }
}

export async function getActiveBanners(): Promise<BannerRow[]> {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data as BannerRow[]) || [];
  } catch {
    return [];
  }
}
