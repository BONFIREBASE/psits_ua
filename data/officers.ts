export type Adviser = {
  name: string
  credentials: string
  title: string
  department: string
  institution: string
  image?: string
}

export type Officer = {
  name: string
  position: string
  roleGroup: 'Executive' | 'Secretariat & Finance' | 'Operations & PR' | 'Year Representatives'
  department: string
  image?: string
  quote?: string
}

export type Dean = {
  name: string
  credentials: string
  title: string
  college: string
  institution: string
  image?: string
}

export const dean: Dean = {
  name: "Dr. John C. Amar",
  credentials: "DM",
  title: "Dean",
  college: "College of Computing and Information Sciences",
  institution: "University of Antique — Main Campus",
  image: "/assets/dean.png",
}

export const adviser: Adviser = {
  name: "Carl Spence Percy",
  credentials: "MIT",
  title: "BSIT Program Head / PSITS Adviser",
  department: "College of Computing and Information Sciences",
  institution: "University of Antique — Main Campus",
}

export const officers: Officer[] = [
  {
    name: "Li Joshua Ramos",
    position: "Auditor",
    roleGroup: "Operations & PR",
    department: "BSIT · CCIS",
    image: "https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/officers/1791538650919-8026.jpg",
  },
  {
    name: "Bon Jury Pecaoco",
    position: "Vice President",
    roleGroup: "Executive",
    department: "BSIT · CCIS",
    image: "https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/officers/1790687450485-Messenger_creation_576040F2-BEFF-48AD-8134-C42FEA769DCA.jpeg",
  },
  {
    name: "Charyl Naldo",
    position: "Treasurer",
    roleGroup: "Secretariat & Finance",
    department: "BSIT · CCIS",
  },
  {
    name: "Angel Nicole Albuera",
    position: "Business Manager 2",
    roleGroup: "Operations & PR",
    department: "BSIT · CCIS",
  },
  {
    name: "Arvin Balquin",
    position: "President",
    roleGroup: "Executive",
    department: "BSIT · CCIS",
    image: "https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/officers/1790027003096-PUBMATS__4_.jpg",
  },
  {
    name: "Elijah Arevalo",
    position: "Business Manager 1",
    roleGroup: "Operations & PR",
    department: "BSIT · CCIS",
  },
  {
    name: "Louise Jan Carlo Tabaldo",
    position: "Public Information Officer (P.I.O.)",
    roleGroup: "Operations & PR",
    department: "BSIT · CCIS",
    image: "https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/officers/1790038987209-786157234_1072917365326702_8204764968442477849_n.jpg",
  },
  {
    name: "Ace Vergel Hiva",
    position: "Assistant Auditor",
    roleGroup: "Secretariat & Finance",
    department: "BSIT · CCIS",
  },
  {
    name: "Rona Mae Sangcap",
    position: "2nd Year Representative",
    roleGroup: "Year Representatives",
    department: "BSIT · 2nd Year",
  },
  {
    name: "Gee. V. P. Parohinog",
    position: "4th Year Representative",
    roleGroup: "Year Representatives",
    department: "BSIT · 4th Year",
  },
  {
    name: "Paulen Monique Operiano",
    position: "Assistant Treasurer",
    roleGroup: "Secretariat & Finance",
    department: "BSIT · CCIS",
  },
  {
    name: "Jin Sung Jung",
    position: "Secretary",
    roleGroup: "Secretariat & Finance",
    department: "BSIT · CCIS",
  },
  {
    name: "Adrianne Blancia",
    position: "1st Year Representative",
    roleGroup: "Year Representatives",
    department: "BSIT · 1st Year",
  },
  {
    name: "Christine Sumande",
    position: "Assistant Secretary",
    roleGroup: "Secretariat & Finance",
    department: "BSIT · CCIS",
  },
  {
    name: "Selwyn Matalubos",
    position: "3rd Year Representative",
    roleGroup: "Year Representatives",
    department: "BSIT · 3rd Year",
  },
]

export type PubmatMember = {
  name: string
  role: string
  isLead?: boolean
  image?: string
}

export const pubmatTeam: PubmatMember[] = [
  {
    name: "Blessy Bielle P. Odango",
    role: "Graphic Designer",
    isLead: false,
  },
  {
    name: "Mark Gelo S. Wieldt",
    role: "Graphic Designer",
    isLead: false,
  },
  {
    name: "Rheinheart Masuay",
    role: "Graphic Designer",
    isLead: false,
  },
  {
    name: "Jairoh Noe Bachicha Bremon",
    role: "Photographer",
    isLead: false,
  },
  {
    name: "Clarence Morales",
    role: "Photographer",
    isLead: false,
  },
  {
    name: "Precious Rhyza S. Ricasio",
    role: "Photographer / Videographer / Editor",
    isLead: false,
  },
  {
    name: "Ellen June Cardinal",
    role: "Photographer",
    isLead: false,
  },
  {
    name: "Elijah Arevalo",
    role: "Lead Photographer",
    isLead: true,
  },
  {
    name: "Arvin Balquin",
    role: "Graphic Designer",
    isLead: false,
  },
  {
    name: "Ma. Echel Vicencio",
    role: "Writer",
    isLead: false,
  },
  {
    name: "Bon Jury Pecaoco",
    role: "Lead Developer",
    isLead: true,
  },
  {
    name: "Paulen Operiano",
    role: "Writer",
    isLead: false,
  },
  {
    name: "Li Joshua Ramos",
    role: "Photographer",
    isLead: false,
  },
  {
    name: "Warren Jake Alera",
    role: "IT Support",
    isLead: false,
  },
]
