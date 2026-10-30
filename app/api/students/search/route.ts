import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const section = (searchParams.get('section') || '').trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ students: [] });
    }

    // Sanitize query to avoid breaking postgrest syntax
    const cleanQ = q.replace(/[%_,]/g, ' ').trim();
    if (!cleanQ) {
      return NextResponse.json({ students: [] });
    }

    // Omit student_no to protect student privacy and avoid identity theft
    let query = supabase
      .from('students')
      .select('id, full_name, year_section, program')
      .ilike('full_name', `%${cleanQ}%`)
      .eq('is_active', true);

    if (section) {
      query = query.eq('year_section', section);
    }

    const { data, error } = await query.limit(12);

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
