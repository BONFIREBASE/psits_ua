<div align="center">

# Philippine Society of Information Technology Students
### University of Antique Chapter (PSITS-UA)
**Official Digital Portal & Student Governance Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](https://opensource.org/licenses/MIT)
[![Framework: Next.js 16](https://img.shields.io/badge/Framework-Next.js%2016-black.svg?logo=next.js)](https://nextjs.org/)
[![Styling: Tailwind CSS v4](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Maintained by: Bonfire Base Studio](https://img.shields.io/badge/Pro%20Bono-Bonfire%20Base%20Studio-F5A623.svg)](https://bonfire.base69.studio)

</div>

---

## 🏛️ About the Organization

The **Philippine Society of Information Technology Students — University of Antique (PSITS-UA)** is the official accredited student organization under the **College of Computing and Information Sciences (CCIS)** at the University of Antique Main Campus.

- **Historical Foundation**: Founded on **January 8, 1993** as the *Computer Society* under the initiative of **Mrs. Nelly E. Mistio** and approved by the College President of the Polytechnic State College of Antique (PSCA).
- **Charter Amendment**: Officially amended to **PSITS-UA** during Academic Year **2016–2017**, establishing an exclusive organization for all Bachelor of Science in Information Technology (BSIT) students.
- **Motto**: *"Students Together in Information Technology."*

---

## 💡 Pro Bono Engineering Attribution

This platform was designed, engineered, and delivered as a **pro bono public service initiative** for the student body of the University of Antique by:

### **Bonfire Base Studio**
> *Crafting bespoke, high-performance digital software and modern web experiences.*

- **Official Website**: [https://bonfire.base69.studio](https://bonfire.base69.studio)
- **Direct Support & Inquiries**: [support@base69.studio](mailto:support@base69.studio)
- **Contribution Type**: Full-stack architecture, UI/UX design system, and technical implementation (Pro Bono).

---

## 🚀 Key Features

- **Constitution & By-Laws (CBL) Reader**:
  - Interactive governance viewer codifying Articles I through VI and the By-Laws.
  - Verbatim preamble, founding provenance, membership policies (₱25.00 semestral fee), fines, and election schedules.
- **Calendar of Activities (COA)**:
  - Editorial Kanban-Bento board for Academic Year 2026–2027.
  - Term 01 (1st Semester 2026) & Term 02 (2nd Semester 2027) schedule covering 15 official assemblies, hackathons, demo days, and bootcamps.
  - Segmented category filters with contextual Lucide micro-icons.
- **Leadership & Faculty Directory**:
  - Highlights BSIT Program Head & PSITS Adviser **Carl Spence Percy, MIT**.
  - Complete 16-member student executive roster grouped by governance functions (Executive, Secretariat & Finance, Operations & PR, and Year Representatives).
- **Zero-Glow Editorial Dark Minimalism**:
  - Designed with high-contrast typography, matte surfaces, and hairline grid dividers for optimum legibility across all screen sizes and display types.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16 (Turbopack, React 19, App Router)](https://nextjs.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with custom `@theme inline` tokens |
| **Icons & Micro-Animations** | [Lucide React](https://lucide.dev/), [React UseAnimations](https://useanimations.github.io/react-useanimations/), [Lordicon](https://lordicon.com/) |
| **Typography** | `Syne` (Display headings), `Inter` (Body typography), System Monospace (Metadata) |
| **Language** | TypeScript (Strict mode enabled) |

---

## 📦 Project Structure

```
psits-ua/
├── app/                        # Next.js App Router
│   ├── globals.css             # Tailwind v4 theme tokens & resets
│   ├── layout.tsx              # Root layout with Navbar & Footer
│   ├── page.tsx                # Hero section & core feature overview
│   ├── about/page.tsx          # Official Constitution & By-Laws (CBL)
│   ├── events/page.tsx         # Calendar of Activities (COA) Kanban board
│   ├── officers/page.tsx       # Leadership & Adviser directory
│   └── contact/page.tsx        # Inquiries & student outreach portal
├── components/                 # Reusable UI components
│   ├── Navbar.tsx              # Top navigation with animated hamburger
│   ├── Footer.tsx              # Footer with quick links & social icons
│   ├── ConstitutionViewer.tsx  # Interactive CBL accordion reader
│   ├── OfficerCard.tsx         # Typography-first leadership cell
│   └── LordIcon.tsx            # SSR-safe animated web-component wrapper
├── data/                       # Codified institutional datasets
│   ├── constitution.ts         # Verbatim CBL legal articles & history
│   ├── events.ts               # Official 15-event Calendar of Activities
│   └── officers.ts             # 16 executive officers & faculty adviser data
└── public/
    └── assets/logo/            # Official University & PSITS shield assets
```

---

## 💻 Getting Started Locally

### Prerequisites
- Node.js 18.18.0 or newer
- npm, pnpm, or bun

### Installation

1. Clone or download the repository:
   ```bash
   git clone https://github.com/bonfire-base/psits-ua.git
   cd psits-ua
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Production Build

To test production compilation and static page generation:
```bash
npm run build
npm run start
```

---

## 📄 License

This project is licensed under the **MIT License** — free for community, academic, and non-commercial development. See the [LICENSE](./LICENSE) file for complete legal terms.

```
Copyright (c) 2026 Bonfire Base Studio & Philippine Society of Information Technology Students — UA
```

---

<div align="center">
  <sub>Built with precision and care for the CCIS student community by <a href="https://bonfire.base69.studio">Bonfire Base Studio</a>.</sub>
</div>
