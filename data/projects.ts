export type ProjectCategory = 'All' | 'Capstone' | 'Open Source' | 'Campus Utility' | 'Hackathon'

export type ProjectStatus = 'Active' | 'In Development' | 'Completed'

export interface Project {
  id: string
  title: string
  category: 'Capstone' | 'Open Source' | 'Campus Utility' | 'Hackathon'
  description: string
  problemStatement?: string
  tags: string[]
  team: string
  year: string
  status: ProjectStatus
  featured?: boolean
  githubUrl?: string
  liveUrl?: string
}

export const projectsData: Project[] = [
  {
    id: 'proj-1',
    title: 'PSITS-UA Digital Portal',
    category: 'Open Source',
    description:
      'Official web portal and student governance infrastructure for PSITS-UA, codifying the Constitution & By-Laws (CBL), Calendar of Activities (COA), and leadership records.',
    problemStatement:
      'Replaced disparate paper records and decentralized social media notices with a persistent, single source of governance truth.',
    tags: ['Next.js 16', 'React 19', 'Tailwind CSS v4', 'TypeScript'],
    team: 'Bonfire Base Studio & PSITS Tech Team',
    year: '2026',
    status: 'Active',
    featured: true,
    githubUrl: 'https://github.com/bonfire404/psits_ua',
    liveUrl: 'https://psits.antiquespride.edu.ph',
  },
  {
    id: 'proj-2',
    title: 'Kasimanwa Health: RHU Telemetry',
    category: 'Capstone',
    description:
      'Localized community health record management and offline-first immunization tracking system engineered for Rural Health Units (RHU) in Antique province.',
    problemStatement:
      'Solves network latency in remote barangays through local SQLite synchronization with cloud servers during connected periods.',
    tags: ['Flutter', 'Node.js', 'PostgreSQL', 'Offline-First'],
    team: 'BSIT Senior Capstone Team 01',
    year: '2026',
    status: 'In Development',
    featured: true,
  },
  {
    id: 'proj-3',
    title: 'Antikanon: Artisan & Weaver Market',
    category: 'Capstone',
    description:
      'Direct-to-consumer e-commerce and logistics tracking platform designed to showcase and empower local Patadyong weavers and traditional craftsmen across Antique.',
    problemStatement:
      'Eliminates exploitative middlemen by providing fair pricing algorithms and verifiable proof of authenticity for heritage textiles.',
    tags: ['React', 'Supabase', 'Express', 'Tailwind CSS'],
    team: 'CCIS Capstone Group 04',
    year: '2025',
    status: 'Completed',
    featured: false,
  },
  {
    id: 'proj-4',
    title: 'UA Interactive Campus Navigator',
    category: 'Campus Utility',
    description:
      'Interactive vector campus map, lecture hall locator, and department directory built to guide freshmen, transferees, and university guests through UA Sibalom.',
    problemStatement:
      'Eliminates confusion across multi-building campuses with step-by-step corridor wayfinding and accessibility ramps mapping.',
    tags: ['Next.js', 'Leaflet.js', 'GeoJSON', 'TypeScript'],
    team: 'PSITS Tech Committee',
    year: '2026',
    status: 'Active',
    featured: true,
  },
  {
    id: 'proj-5',
    title: 'Antique Coastal Flood & Tide Sentinel',
    category: 'Hackathon',
    description:
      'Solar-powered IoT telemetry probe network providing real-time water levels and early flood warnings to coastal disaster risk management councils.',
    problemStatement:
      'Mitigates storm surge damage by delivering instant LoRa-to-cellular SMS alerts directly to barangay emergency responders.',
    tags: ['ESP32', 'LoRaWAN', 'Python', 'FastAPI', 'C++'],
    team: 'HackAntique 2025 Champions',
    year: '2025',
    status: 'Completed',
    featured: false,
  },
  {
    id: 'proj-6',
    title: 'CCIS Laboratory Terminal & Asset Manager',
    category: 'Campus Utility',
    description:
      'Workstation uptime tracking, peripheral inventory, and terminal reservation portal featuring dynamic QR code scanning for CCIS computer laboratories.',
    problemStatement:
      'Reduces laboratory equipment loss and streamlines student PC allocation during peak exam and programming laboratory periods.',
    tags: ['TypeScript', 'Next.js', 'Prisma', 'Tailwind CSS'],
    team: 'CCIS Student Developers',
    year: '2026',
    status: 'In Development',
    featured: false,
  },
]
