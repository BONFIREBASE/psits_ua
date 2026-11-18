import { NextResponse } from 'next/server'
import { getActiveMaintenanceConfig } from '@/lib/maintenance'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const config = await getActiveMaintenanceConfig()
    return NextResponse.json({
      success: true,
      config: config || {
        is_enabled: false,
        scope: 'all',
        blocked_routes: [],
        title: 'System Under Scheduled Maintenance',
        message: 'We are performing scheduled updates to improve our services.',
        estimated_return: null,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to retrieve maintenance status' },
      { status: 500 }
    )
  }
}
