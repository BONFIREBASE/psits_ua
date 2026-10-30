import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ students: [] });
    }

    // Sanitize query to avoid breaking postgrest syntax
    const cleanQ = q.replace(/[%_,]/g, ' ').trim();
    if (!cleanQ) {
      return NextResponse.json({ students: [] });
    }

    const { data, error } = await supabase
      .from('students')
      .select('id, student_no, full_name, year_section, program')
      .or(`full_name.ilike.%${cleanQ}%,student_no.ilike.%${cleanQ}%`)
      .eq('is_active', true)
      .limit(12);

    if (error) {
      console.error('Student search error:', error);
      return NextResponse.json({ students: [] }, { status: 500 });
    }

    return NextResponse.json(
      { students: data || [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err) {
    console.error('GET /api/students/search error:', err);
    return NextResponse.json({ students: [] }, { status: 500 });
  }
}
