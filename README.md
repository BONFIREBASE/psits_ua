# Philippine Society of Information Technology Students — University of Antique (PSITS-UA)
### Official Digital Portal & Student Governance Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](https://opensource.org/licenses/MIT)
[![Framework: Next.js 16](https://img.shields.io/badge/Framework-Next.js%2016-black.svg?logo=next.js)](https://nextjs.org/)
[![Styling: Tailwind CSS v4](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Maintained by: Bonfire Base Studio](https://img.shields.io/badge/Pro%20Bono-Bonfire%20Base%20Studio-F5A623.svg)](https://bonfire.base69.studio)
[![Project Status: In Progress](https://img.shields.io/badge/Status-In%20Progress-blue.svg)](https://github.com/bonfire404/psits_ua)
[![Contributions: Welcome](https://img.shields.io/badge/Contributions-Welcome-success.svg)](https://github.com/bonfire404/psits_ua)

---

## Overview

The **Philippine Society of Information Technology Students — University of Antique (PSITS-UA)** is the official recognized student organization under the **College of Computing and Information Sciences (CCIS)** at the University of Antique Main Campus (Sibalom, Antique, Philippines).

- **Historical Foundation**: Established on **January 8, 1993** as the *Computer Society* through the initiative of **Mrs. Nelly E. Mistio** and formally sanctioned by the College President of the Polytechnic State College of Antique (PSCA).
- **Charter Amendment**: Formally reconstituted as **PSITS-UA** during Academic Year **2016–2017**, establishing an exclusive governance body for all Bachelor of Science in Information Technology (BSIT) undergraduates.
- **Official Motto**: *"Students Together in Information Technology."*

---

## Project Status

This system is currently under **active development (Work in Progress)**. Core informational modules including the Constitution & By-Laws (CBL), Calendar of Activities (COA), and Officers Directory are codified and live. Additional capabilities, including student service integration, event registrations, and administrative tooling, are continuously being designed and integrated.

---

## Engineering Attribution

This platform was designed, engineered, and delivered as a **pro bono public service project** for the student body and faculty of the University of Antique by:

**Bonfire Base Studio**  
Website: [https://bonfire.base69.studio](https://bonfire.base69.studio)  
Support & Inquiries: [support@base69.studio](mailto:support@base69.studio)  
Contribution: Full-stack system architecture, user interface design system, and technical delivery.

---

## Architecture & Core Modules

### 1. Constitution and By-Laws (CBL)
- Full codified text of Articles I through VI and the By-Laws.
- Official Preamble, founding provenance, semestral membership fees (PHP 25.00), meeting attendance policies, and statutory election timelines.
- Typography-first, high-contrast reading interface with zero artificial design bloat.

### 2. Calendar of Activities (COA)
- Codified schedule for Academic Year 2026–2027 split into Term 01 (1st Semester 2026) and Term 02 (2nd Semester 2027).
- Covers 15 official assemblies, technical hackathons, bootcamps, job fairs, and regular council meetings.
- Interactive category filters with segmented controls and contextual iconography.

### 3. Leadership & Administration Directory
- Features BSIT Program Head & PSITS Adviser **Carl Spence Percy, MIT**.
- Official roster of 16 student executive officers grouped by functional governance roles (Executive Leadership, Secretariat & Finance, Operations & PR, and Year Level Representatives).

### 4. Zero-Glow Minimalist Design System
- Built using an editorial dark minimalist aesthetic inspired by modern enterprise software standards.
- Strict adherence to WCAG AAA contrast ratios across OLED, IPS, and low-brightness displays.

---

## Technology Stack

- **Core Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Styling**: Tailwind CSS v4 with custom `@theme inline` design tokens
- **Iconography**: Lucide React, React UseAnimations
- **Typography**: Syne (Display headings), Inter (Body copy), Monospace (Metadata)
- **Language**: TypeScript (Strict Mode)

---

## Contributing

Contributions are **actively open** to IT students, alumni, faculty members, and community developers who want to help advance the PSITS-UA digital infrastructure.

We welcome:
- Feature proposals and student utility additions
- Bug fixes, performance improvements, and accessibility enhancements
- Documentation and governance record corrections
- UI/UX polish adhering to the established minimalist design system

### Contribution Workflow

1. Fork the repository on GitHub.
2. Create a dedicated feature or fix branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Implement your changes and verify that the build compiles cleanly:
   ```bash
   npm run build
   ```
4. Commit your work following standard atomic commit conventions:
   ```bash
   git commit -m "feat: description of contribution"
   ```
5. Push to your fork and submit a Pull Request against the `main` branch.

For questions, architectural discussions, or collaboration inquiries, contact the maintainers at `support@base69.studio`.

---

## Project Directory Structure

```
psits-ua/
├── app/                        # Next.js App Router routes
│   ├── globals.css             # Tailwind v4 theme specifications
│   ├── layout.tsx              # Root HTML layout and global navigation
│   ├── page.tsx                # Homepage and portal introduction
│   ├── about/page.tsx          # Constitution and By-Laws (CBL)
│   ├── events/page.tsx         # Calendar of Activities (COA)
│   ├── officers/page.tsx       # Officers and Adviser directory
│   └── contact/page.tsx        # Contact and inquiry form
├── components/                 # Reusable UI component library
│   ├── Navbar.tsx              # Primary site navigation bar
│   ├── Footer.tsx              # Standard site footer
│   ├── ConstitutionViewer.tsx  # Interactive CBL reader
│   └── OfficerCard.tsx         # Standardized leadership directory tile
├── data/                       # Verified institutional datasets
│   ├── constitution.ts         # Verbatim CBL articles and history
│   ├── events.ts               # Academic Year 2026–2027 activities
│   └── officers.ts             # Leadership and faculty data
└── public/
    └── assets/logo/            # Institutional seal and chapter logos
```

---

## Local Development Setup

### Prerequisites
- Node.js version 18.18.0 or higher
- npm, pnpm, or bun package managers

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/bonfire404/psits_ua.git
   cd psits_ua
   ```

2. Install project dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Navigate to `http://localhost:3000` in your web browser.

### Production Build & Verification

To generate the optimized static production bundle:
```bash
npm run build
npm run start
```

---

## License

This project is licensed under the **MIT License**. For complete license terms, refer to the [LICENSE](./LICENSE) file.

Copyright (c) 2026 Bonfire Base Studio & Philippine Society of Information Technology Students — University of Antique (PSITS-UA).
