/**
 * Real-time greeting generator for KasUbAy ant mascot
 * Selects time-contextual greetings based on user's current local hour and calendar day
 * Combines user-requested phrasing with friendly Tagalog campus rotations
 */

const MORNING_GREETINGS = [
  'Good morning!',
  'Magandang umaga po!',
  'Good morning ser!',
  'Umaga na, kape muna!',
  'Gising na, Kasubay!',
]

const AFTERNOON_GREETINGS = [
  'Good afternoon ser!',
  'Magandang hapon po!',
  'Good afternoon!',
  'Kain na po lunch / merienda!',
  'Init ah, hydration muna, bossing!',
]

const EVENING_GREETINGS = [
  'Good eve po!',
  'Magandang gabi!',
  'Good evening ser!',
  'Pahinga na po konti!',
  'Dinner time na po ba, bossing?',
]

/**
 * Checks if the upcoming daylight session is a weekend (Saturday or Sunday)
 * Takes into account late-night hours (12:00 AM - 4:59 AM)
 */
function isTomorrowWeekend(): boolean {
  const now = new Date()
  const day = now.getDay() // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  const hour = now.getHours()

  // If late night between 12:00 AM - 4:59 AM, check current calendar day
  if (hour < 5) {
    return day === 0 || day === 6 // Saturday or Sunday daytime
  }

  // If 5:00 AM onwards (e.g. 10:00 PM, 11:00 PM), check next day
  return day === 5 || day === 6 // Friday night (tomorrow is Sat) or Sat night (tomorrow is Sun)
}

function getLateNightPool(): string[] {
  const weekend = isTomorrowWeekend()

  const pool = [
    'Good eve po, late night grind?',
    'Gabi na ser, tulog na po!',
    'Puyat pa si bossing ah!',
    'Padayon lang, pero pahinga din!',
  ]

  if (weekend) {
    pool.push(
      'Weekend naman, pero pahuway din!',
      'Chill grind ngayong weekend, bossing!',
      'Weekend na, bawi ng tulog!'
    )
  } else {
    // Weekday night only: has school the following morning
    pool.push('Matulog na po, may pasok pa bukas!')
  }

  return pool
}

export function getTimeGreeting(exclude?: string | null): string {
  const hour = new Date().getHours()

  let pool: string[]
  if (hour >= 5 && hour < 12) {
    // 5:00 AM – 11:59 AM
    pool = MORNING_GREETINGS
  } else if (hour >= 12 && hour < 18) {
    // 12:00 PM – 5:59 PM
    pool = AFTERNOON_GREETINGS
  } else if (hour >= 18 && hour < 22) {
    // 6:00 PM – 9:59 PM
    pool = EVENING_GREETINGS
  } else {
    // 10:00 PM – 4:59 AM (Late Night / Midnight)
    pool = getLateNightPool()
  }

  const filtered = pool.filter((msg) => msg !== exclude)
  const candidatePool = filtered.length > 0 ? filtered : pool
  return candidatePool[Math.floor(Math.random() * candidatePool.length)]
}
