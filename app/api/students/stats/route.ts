import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCache, setCache } from '@/lib/ratelimit'

interface StudentStatsPayload {
  totalStudents: number
  totalSections: number
}

const STATS_CACHE_KEY = 'psits:cache:student_stats'
const STATS_CACHE_TTL = 300 // 5 minutes

/**
 * GET /api/students/stats
 * Public endpoint returning aggregate student population stats.
 * Cached in Upstash Redis for sub-millisecond response times.
 */
export async function GET() {
  try {
    // 1. Check Upstash Redis cache first
    const cached = await getCache<StudentStatsPayload>(STATS_CACHE_KEY)
    if (cached) {
      return NextResponse.json(cached)
    }

    // 2. Query active student count from database
    const { count: totalStudents, error: countError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (countError) {
      return NextResponse.json({
        totalStudents: 0,
        totalSections: 0,
      })
    }

    // 3. Query distinct sections
    const { data: sectionData, error: sectionError } = await supabase
      .from('students')
      .select('year_section')
      .eq('is_active', true)

    let totalSections = 0
    if (!sectionError && sectionData) {
      const uniqueSections = new Set(sectionData.map((r) => r.year_section))
      totalSections = uniqueSections.size
    }

    const payload: StudentStatsPayload = {
      totalStudents: totalStudents || 0,
      totalSections,
    }

    // 4. Save to Upstash Redis cache
    await setCache(STATS_CACHE_KEY, payload, STATS_CACHE_TTL)

    return NextResponse.json(payload)
  } catch {
    return NextResponse.json({
      totalStudents: 0,
      totalSections: 0,
    })
  }
}

