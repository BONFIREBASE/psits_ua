export type Activity = {
  id: string
  month: string
  activity: string
  involved: string
  venue: string
  semester: '1st Semester (2026)' | '2nd Semester (2027)'
  category: 'Governance' | 'Competition' | 'Social' | 'Academic' | 'Career'
  featured?: boolean
}

export const calendarActivities: Activity[] = [
  {
    id: 'coa-1',
    month: 'August 2026',
    activity: 'Presentation and Ratification of the Proposed Constitution and By Laws',
    involved: 'CCIS IT Students',
    venue: 'CCIS Lobby',
    semester: '1st Semester (2026)',
    category: 'Governance',
    featured: false,
  },
  {
    id: 'coa-2',
    month: 'September 2026',
    activity: 'Regular meeting and plan for the Acquaintance Party',
    involved: 'PSITS Officers and Advisers',
    venue: 'CCIS Students Council Office',
    semester: '1st Semester (2026)',
    category: 'Governance',
    featured: false,
  },
  {
    id: 'coa-3',
    month: 'September 2026',
    activity: 'Hackathon / Programming Contest',
    involved: 'CCIS IT Students',
    venue: 'CCS Lobby',
    semester: '1st Semester (2026)',
    category: 'Competition',
    featured: true,
  },
  {
    id: 'coa-4',
    month: 'October 2026',
    activity: 'POLO SHIRT CONTEST',
    involved: 'ALL BSIT STUDENTS',
    venue: 'CCIS Student Council Office',
    semester: '1st Semester (2026)',
    category: 'Social',
    featured: false,
  },
  {
    id: 'coa-5',
    month: 'November 2026',
    activity: 'Regular meeting for preparation of End year party',
    involved: 'PSITS Officers and Advisers',
    venue: 'CCIS Student Council Office',
    semester: '1st Semester (2026)',
    category: 'Governance',
    featured: false,
  },
  {
    id: 'coa-6',
    month: 'November 2026',
    activity: 'IT Conference / Tech Expo Participation',
    involved: 'All IT Students of CCIS',
    venue: 'CCIS Lobby',
    semester: '1st Semester (2026)',
    category: 'Academic',
    featured: true,
  },
  {
    id: 'coa-7',
    month: 'December 2026',
    activity: 'End Year Party',
    involved: 'All IT Students of CCIS',
    venue: 'UA Covered Gym',
    semester: '1st Semester (2026)',
    category: 'Social',
    featured: false,
  },
  {
    id: 'coa-8',
    month: 'December 2026',
    activity: 'Career Guidance',
    involved: 'All IT Students of CCIS',
    venue: 'UA Covered Gym',
    semester: '1st Semester (2026)',
    category: 'Career',
    featured: false,
  },

  {
    id: 'coa-9',
    month: 'January 2027',
    activity: 'IT Bootcamp (Advanced Programming / Database)',
    involved: '1st and 2nd year IT students of CCIS',
    venue: 'CCIS Lobby',
    semester: '2nd Semester (2027)',
    category: 'Academic',
    featured: true,
  },
  {
    id: 'coa-10',
    month: 'February 2027',
    activity: 'Internship Placements / Job Fair',
    involved: '3rd year and 4th year',
    venue: 'CCIS Lobby',
    semester: '2nd Semester (2027)',
    category: 'Career',
    featured: true,
  },
  {
    id: 'coa-11',
    month: 'March 2027',
    activity: 'Capstone Project Demo Day',
    involved: 'All IT Students of CCIS',
    venue: 'CCIS Lobby',
    semester: '2nd Semester (2027)',
    category: 'Academic',
    featured: true,
  },
  {
    id: 'coa-12',
    month: 'April 2027',
    activity: 'Summer Coding Bootcamp',
    involved: '1st and 2nd year IT students of CCIS',
    venue: 'CCIS Lobby',
    semester: '2nd Semester (2027)',
    category: 'Academic',
    featured: true,
  },
  {
    id: 'coa-13',
    month: 'May 2027',
    activity: 'Regular Meeting',
    involved: 'PSITS Officers and Advisers',
    venue: 'CCIS Student Council Office',
    semester: '2nd Semester (2027)',
    category: 'Governance',
    featured: false,
  },
  {
    id: 'coa-14',
    month: 'June 2027',
    activity: 'Regular Meeting',
    involved: 'PSITS Officers and Advisers',
    venue: 'CCIS Student Council Office',
    semester: '2nd Semester (2027)',
    category: 'Governance',
    featured: false,
  },
  {
    id: 'coa-15',
    month: 'July 2027',
    activity: 'Regular Meeting',
    involved: 'PSITS Officers and Advisers',
    venue: 'CCIS Student Council Office',
    semester: '2nd Semester (2027)',
    category: 'Governance',
    featured: false,
  },
]

export type Event = {
  title: string
  date: string
  location: string
  description: string
  status: 'upcoming' | 'past'
  tag?: string
}

export const events: Event[] = calendarActivities.map((act) => ({
  title: act.activity,
  date: act.month,
  location: act.venue,
  description: `Target Participants: ${act.involved}`,
  status: 'upcoming',
  tag: act.category,
}))
