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
 * Helper to get current hour and day anchored strictly to Philippine Standard Time (UTC+8 / Antique)
 */
function getPhilippineTime(): { hour: number; day: number } {
  const pht = new Date(Date.now() + 8 * 3600000)
  return {
    hour: pht.getUTCHours(),
    day: pht.getUTCDay(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  }
}

/**
 * Checks if the upcoming daylight session is a weekend (Saturday or Sunday)
 * Takes into account late-night hours (12:00 AM - 4:59 AM) in Philippine time
 */
function isTomorrowWeekend(): boolean {
  const { hour, day } = getPhilippineTime()

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
  const { hour } = getPhilippineTime()

  let pool: string[]
  if (hour >= 5 && hour < 12) {
    // 5:00 AM – 11:59 AM (Morning)
    pool = MORNING_GREETINGS
  } else if (hour >= 12 && hour < 18) {
    // 12:00 PM – 5:59 PM (Afternoon)
    pool = AFTERNOON_GREETINGS
  } else if (hour >= 18 && hour < 22) {
    // 6:00 PM – 9:59 PM (Evening)
    pool = EVENING_GREETINGS
  } else {
    // 10:00 PM – 4:59 AM (Late Night / Midnight)
    pool = getLateNightPool()
  }

  const filtered = pool.filter((msg) => msg !== exclude)
  const candidatePool = filtered.length > 0 ? filtered : pool
  return candidatePool[Math.floor(Math.random() * candidatePool.length)]
}

export function getDefaultTimeGreeting(): string {
  const { hour } = getPhilippineTime()

  if (hour >= 5 && hour < 12) {
    return MORNING_GREETINGS[0]
  } else if (hour >= 12 && hour < 18) {
    return AFTERNOON_GREETINGS[0]
  } else if (hour >= 18 && hour < 22) {
    return EVENING_GREETINGS[0]
  } else {
    return getLateNightPool()[0]
  }
}

