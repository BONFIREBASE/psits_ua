export interface SocialDispatch {
  id: string
  imageUrl?: string
  date: string
  venue?: string
  category: 'Event Recap' | 'Campus Event' | 'Recruitment' | 'Official Advisory'
  title: string
  highlightQuote?: string
  quoteAuthor?: string
  excerpt: string
  fullContent: string
  involvedColleges?: string[]
  credits: {
    writer?: string
    photographer?: string
    pubmat?: string
    videographer?: string
    prepared_by?: string
    [key: string]: string | undefined
  }
  postUrl: string
  applyUrl?: string
  deadline?: string
  tags: string[]
  featured?: boolean
}

export const socialDispatches: SocialDispatch[] = [
  {
    id: 'fb-1DGqiMHKhc',
    imageUrl: '/assets/suicide_prevention.jpg',
    date: 'September 5, 2026',
    category: 'Official Advisory',
    title: 'Suicide Prevention Month: You Are Not a Burden',
    highlightQuote: 'The Lord is near to the brokenhearted. — Psalm 34:18',
    excerpt:
      'Before you scroll past this — read this one line first: You Are Not a Burden. September is Suicide Prevention Month, and if no one has told you today, let this be your reminder: You are not alone. Reach out, speak up, stay alive.',
    fullContent: `Before you scroll past this — read this one line first: You Are Not a Burden.

September is Suicide Prevention Month, and if no one has told you today, let this be your reminder:
• You are not alone. Reach out, speak up, stay alive.
• It's okay to not be okay. It's not okay to stay silent.
• Your story isn't over yet.

"The Lord is near to the brokenhearted." — Psalm 34:18

September is recognized as Suicide Awareness Month. If you or someone you know is carrying a heavy burden, compassionate support is always available:

Emergency Support & Crisis Hotlines:
• National Center for Mental Health (DOH): 1553 (Toll-Free) | (02) 989-8727 | 0917-899-8727 | 0908-639-2672
• Hopeline PH: (02) 8804-4673 | 0917-558-4673 | 0918-873-4673
• Municipal Health Office (San Jose): 036-641-0791 | mhosanjose06@gmail.com
• University of Antique Guidance Unit: guidance@antiquespride.edu.ph

You are not alone. You are loved. You are valued. And you matter.`,
    credits: {
      writer: 'Ma. Echel Vicencio',
      pubmat: 'Aizelle Binoy',
    },
    postUrl: 'https://www.facebook.com/share/p/1DGqiMHKhc/',
    tags: [
      '#SuicidePreventionMonth',
      '#StartTheConversation',
      '#ChangingTheNarrativeOnSuicide',
      '#MentalHealthAwareness',
      '#PSITSUA',
    ],
    featured: true,
  },

  {
    id: 'fb-1B2Gumht2T',
    imageUrl: '/assets/butlak.jpg',
    date: 'September 2, 2026',
    venue: 'UA Tripunan Hall',
    category: 'Event Recap',
    title: 'bUtlAk 2026: Second Batch Annual Student Orientation Program',
    highlightQuote: 'Hanggang saan mo lalakarin ang pangarap mo?',
    quoteAuthor: 'Student Affairs and Services (SAS) Head',
    excerpt:
      'New kasUbAy students filled the University of Antique (UA) Tripunan Hall as bUtlAk 2026 held its second batch of the annual student orientation program, warmly welcoming freshmen across participating colleges.',
    fullContent:
      'The program commenced with inspiring remarks from the head of Student Affairs and Services (SAS) alongside faculty members to provide guidance, awareness, and institutional support to the new kasUbAy. Capturing moments of unity, presence, and shared purpose across the university.',
    involvedColleges: [
      'College of Computing and Information Sciences (CCIS)',
      'College of Management and Governance (CMG)',
      'College of Maritime Studies (CMS)',
    ],
    credits: {
      writer: 'Ma. Echel Vicencio',
      photographer: 'Aizelle Binoy',
    },
    postUrl: 'https://www.facebook.com/share/p/1B2Gumht2T/',
    tags: ['#bUtlAk2026', '#KasUbAy', '#PSITSUA', '#CCIS', '#Orientation'],
    featured: true,
  },

  {
    id: 'fb-pubmat-recruitment',
    imageUrl: '/assets/publication_recruitment.jpg',
    date: 'September 1, 2026',
    category: 'Recruitment',
    title: 'PSITS-UA Pubmat Team: Now Accepting Applications',
    excerpt:
      'The Philippine Society of Information Technology Students – UA is officially opening applications for the PUBMAT TEAM! If you\'re passionate about photography, videography, writing, broadcasting, and graphic design — this is your chance to join.',
    fullContent:
      'Create. Collaborate. Inspire. Make an impact with your creativity! Whether you have skills in Adobe Illustrator, Photoshop, Canva, CapCut, or broadcasting, the PSITS-UA Pubmat Team wants you. Showcase your talents and help create meaningful content for the organization.',
    credits: {
      pubmat: 'Elijah Arevalo',
    },
    postUrl: 'https://www.facebook.com/permalink.php?story_fbid=pfbid0Jam6QkrB4pExDcZcvpYahRiNYkZMxQtcLJTAdhb8f7JYQAtrJqEJJwyxpEVWdrKol&id=100086983023496',
    applyUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSd005fH-_fxNnf3qREIODWMGWVGi4K0svkFO3cA2qr0Nswc0w/viewform',
    deadline: 'September 14, 2026',
    tags: ['#PSITS', '#pubmat', '#IT', '#UniversityofAntique', '#UA', '#CCIS'],
    featured: true,
  },

  {
    id: 'fb-photobooth',
    imageUrl: 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/projects/sugalaw.jpg',
    date: 'August 24, 2026',
    venue: 'In front of TiripUnAn Hall',
    category: 'Campus Event',
    title: 'Sugalaw PSITS Photobooth: Capture Your Best Moments',
    excerpt:
      'Get ready to level up your memories! The PSITS Photobooth is opening its doors. Whether you\'re coming with your squad, friends from other departments, or flying solo — drop by and take home pixel-perfect keepsakes.',
    fullContent:
      'Catch us live at TiripUnAn Hall! Morning session from 9:00 AM to 12:00 PM, and afternoon session from 1:00 PM to 4:00 PM. Bring your brightest energy and your best gaming faces! We have the camera ready, we just need YOU.',
    credits: {
      pubmat: 'Arvin Balquin',
    },
    postUrl: 'https://www.facebook.com/permalink.php?story_fbid=pfbid022pzu1p5hxva4affPjag7srv5pGweRnA1JJJscknxyqKb6aobMLWgeDTnrDH7sFHAl&id=100086983023496',
    tags: ['#PSITS', '#photobooth', '#photography', '#sUgalAw'],
    featured: true,
  },
]

export const spotlightDispatch = socialDispatches[0]
