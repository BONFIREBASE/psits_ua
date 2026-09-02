export type Adviser = {
  name: string
  credentials: string
  title: string
  department: string
  institution: string
}

export type Officer = {
  name: string
  position: string
  roleGroup: 'Executive' | 'Secretariat & Finance' | 'Operations & PR' | 'Year Representatives'
  department: string
}

export const adviser: Adviser = {
  name: 'Carl Spence Percy',
  credentials: 'MIT',
  title: 'BSIT Program Head / PSITS Adviser',
  department: 'College of Computing and Information Sciences',
  institution: 'University of Antique — Main Campus',
}

export const officers: Officer[] = [
  // ── Executive Leadership ──
  {
    name: 'Arvin James Balquin',
    position: 'President',
    roleGroup: 'Executive',
    department: 'BSIT · CCIS',
  },
  {
    name: 'Jared Patrick Evangelio',
    position: 'Vice President',
    roleGroup: 'Executive',
    department: 'BSIT · CCIS',
  },

  // ── Secretariat & Finance ──
  {
    name: 'Kimberly Ann Erispe',
    position: 'Secretary',
    roleGroup: 'Secretariat & Finance',
    department: 'BSIT · CCIS',
  },
  {
    name: 'Jin Sung Jung',
    position: 'Assistant Secretary',
    roleGroup: 'Secretariat & Finance',
    department: 'BSIT · CCIS',
  },
  {
    name: 'Charyl Naldo',
    position: 'Treasurer',
    roleGroup: 'Secretariat & Finance',
    department: 'BSIT · CCIS',
  },
  {
    name: 'John Vincent Peniero',
    position: 'Assistant Treasurer',
    roleGroup: 'Secretariat & Finance',
    department: 'BSIT · CCIS',
  },
  {
    name: 'Johnric Ysulat',
    position: 'Auditor',
    roleGroup: 'Secretariat & Finance',
    department: 'BSIT · CCIS',
  },
  {
    name: 'Vhonn Gabriel Habulin',
    position: 'Assistant Auditor',
    roleGroup: 'Secretariat & Finance',
    department: 'BSIT · CCIS',
  },

  // ── Operations & PR ──
  {
    name: 'Louise Jan Carlo Tabaldo',
    position: 'Public Information Officer 1 (P.I.O.)',
    roleGroup: 'Operations & PR',
    department: 'BSIT · CCIS',
  },
  {
    name: 'Bon Jury Pecaoco',
    position: 'Public Information Officer 2 (P.I.O.)',
    roleGroup: 'Operations & PR',
    department: 'BSIT · CCIS',
  },
  {
    name: 'Elijah Arevalo',
    position: 'Business Manager 1',
    roleGroup: 'Operations & PR',
    department: 'BSIT · CCIS',
  },
  {
    name: 'Angel Nicole Albuera',
    position: 'Business Manager 2',
    roleGroup: 'Operations & PR',
    department: 'BSIT · CCIS',
  },

  // ── Year Level Representatives ──
  {
    name: 'Christine Sumande',
    position: '1st Year Representative',
    roleGroup: 'Year Representatives',
    department: 'BSIT · 1st Year',
  },
  {
    name: 'Rona Mae Sangcap',
    position: '2nd Year Representative',
    roleGroup: 'Year Representatives',
    department: 'BSIT · 2nd Year',
  },
  {
    name: 'Ramel Azar Jr.',
    position: '3rd Year Representative',
    roleGroup: 'Year Representatives',
    department: 'BSIT · 3rd Year',
  },
  {
    name: 'Carmelo Dapar II',
    position: '4th Year Representative',
    roleGroup: 'Year Representatives',
    department: 'BSIT · 4th Year',
  },
]
