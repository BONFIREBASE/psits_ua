export interface ConstitutionSection {
  number?: string
  title?: string
  content: string | string[]
}

export interface ConstitutionArticle {
  id: string
  article: string
  title: string
  tag?: string
  sections: ConstitutionSection[]
}

export const constitutionData = {
  history: {
    title: 'Origins & Heritage',
    foundedDate: 'January 8, 1993',
    founder: 'Mrs. Nelly E. Mistio',
    institution: 'Polytechnic State College of Antique (PSCA)',
    amendmentYear: 'A.Y. 2016–2017',
    narrative:
      'The University of Antique Computer Society was founded through the efforts of Mrs. Nelly E. Mistio and was approved by the College President of the Polytechnic State College of Antique last January 8, 1993. It was then classified as an Interest Group. With the approval of the majority of its members, the Computer Society is still an Interest Organization whose members are exclusive to the students of the College of Computer Studies. The Computer Society was amended to Philippine Society of Information Technology Students – UA and is exclusive to Information Technology students only. The amendment of the name was effective on academic year 2016–2017 with the approval of its officers and its members.',
  },
  preamble: {
    title: 'The Official Preamble',
    text:
      'We, the members of PHILIPPINE SOCIETY OF INFORMATION TECHNOLOGY STUDENTS – UA of the University of Antique, imploring the aid of God Almighty in order to establish a wholesome society that shall embody our ideals, promote, conserve, and develop the patrimony of our school and serve to ourselves and our prosperity, the blessing of our national unity therefor promulgate this constitution.',
  },
  quickFacts: [
    { label: 'Founded', value: 'January 8, 1993' },
    { label: 'Membership', value: 'Mandatory (All BSIT)' },
    { label: 'Semestral Fee', value: 'Php 25.00 / sem' },
    { label: 'Monthly Meeting', value: 'Last week of month' },
    { label: 'Absence Fine', value: 'Php 100.00 / unexcused' },
    { label: 'Annual Elections', value: 'Not later than 1st Mon of July' },
    { label: 'Amendment Threshold', value: '3/4 vote of members' },
  ],
  articles: [
    {
      id: 'article-1',
      article: 'ARTICLE I',
      title: 'NAME',
      tag: 'Identity',
      sections: [
        {
          number: 'Section 1',
          content: 'Philippine Society of Information Technology Students (PSITS-UA).',
        },
      ],
    },
    {
      id: 'article-2',
      article: 'ARTICLE II',
      title: 'PURPOSE',
      tag: 'Mandate',
      sections: [
        {
          number: 'Section 1',
          content:
            'To develop the skills of the students who are taking the Information course under the College of Computer Studies.',
        },
        {
          number: 'Section 2',
          content:
            'To create a pool of IT and enthusiasts who can extend the computer services of the school.',
        },
        {
          number: 'Section 3',
          content:
            'To develop a social awareness, responsibility, and discipline among its members.',
        },
        {
          number: 'Section 4',
          content: 'To develop wholesome social relationships among its members.',
        },
        {
          number: 'Section 5',
          content: 'To develop the leadership of the members.',
        },
        {
          number: 'Section 6',
          content: 'To conserve and develop desirable social, moral, and spiritual values.',
        },
        {
          number: 'Section 7',
          content:
            'To serve as an instrument for social, political, and economic growth of the community within the service area of the college.',
        },
      ],
    },
    {
      id: 'article-3',
      article: 'ARTICLE III',
      title: 'MEMBERSHIP',
      tag: 'Policy & Fees',
      sections: [
        {
          number: 'Section 1',
          content:
            'The member for Philippine Society of Information Technology Students organization is mandatory for all students enrolled in the IT program.',
        },
        {
          number: 'Section 2',
          content:
            'A membership fee of Twenty-Five Pesos (Php 25.00) will be collected to each member every semester.',
        },
      ],
    },
    {
      id: 'article-4',
      article: 'ARTICLE IV',
      title: 'OFFICERS',
      tag: 'Governance',
      sections: [
        {
          number: 'Section 1',
          content:
            'Officers shall consist of President, Vice President, Secretaries, Assistant Secretary, Treasurer, Assistant Treasurer, Auditor, Assistant Auditor, P.I.O. (Public Information Officer), Business Manager 1, Business Manager 2, 1st Year Representative, 2nd Year Representative, 3rd Year Representative, and 4th Year Representative.',
        },
      ],
    },
    {
      id: 'article-5',
      article: 'ARTICLE V',
      title: 'MEETINGS & ELECTIONS',
      tag: 'Operations',
      sections: [
        {
          number: 'Section 1',
          content:
            'The officers will have their regular meeting every last week of the month to evaluate their performance throughout the operation of the organization.',
        },
        {
          number: 'Section 2',
          content:
            'Special meeting shall be called if emergency or urgent matter demands.',
        },
        {
          number: 'Section 3',
          content:
            'Failure to attend the meeting without reasonable cause will be subject to penalty of Php 100.00.',
        },
        {
          number: 'Section 4',
          content:
            'Election of officers shall be held not later than the first Monday of July.',
        },
      ],
    },
    {
      id: 'article-6',
      article: 'ARTICLE VI',
      title: 'RATIFICATION AND AMENDMENTS',
      tag: 'Legislation',
      sections: [
        {
          number: 'Section 1',
          content:
            'The ratification of the foregoing proposed Constitution and By-Laws should be submitted to the entire body through a plebiscite after its approval by the officer of the organization.',
        },
        {
          number: 'Section 2',
          content:
            'The date of the plebiscite shall be recommended by the adviser and approved by the whole organization.',
        },
        {
          number: 'Section 3',
          content:
            'The effectiveness and adaptation of this Constitution and By-Laws shall immediately after its ratification.',
        },
        {
          number: 'Section 4',
          content:
            'Any amendments or revisions of these by-laws must be agreed upon a vote of the three-fourth (3/4) of its members.',
        },
      ],
    },
    {
      id: 'by-laws-1',
      article: 'THE BY-LAWS: ARTICLE I',
      title: 'DUTIES OF OFFICERS & MEMBERS',
      tag: 'Code of Conduct',
      sections: [
        {
          number: 'Section 1',
          content: [
            'To be loyal to the organization.',
            'To serve as a good model to the students.',
            'To uphold and obey the laws of the organization.',
            'To perform his task and cooperate with duly constituted officers.',
            'To attend all meeting and participate actively in the activities of the organization.',
            'To contribute to the development and welfare of the organization.',
            'Every member shall endeavor to work for the advancement of the organization, campaign for membership, presume its good name and extend assistance with his capabilities to perform whenever the need arises.',
          ],
        },
      ],
    },
  ] as ConstitutionArticle[],
}
