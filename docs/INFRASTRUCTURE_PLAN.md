# PSITS-UA Infrastructure & Architecture Plan

**Philippine Society of Information Technology Students — University of Antique**  
*Official Digital Portal, Student Governance, Blog & High-Concurrency Voting Platform*

---

## 1. Executive Summary

This document specifies the complete, production-grade, **$0.00/month (Free-Tier)** cloud architecture designed for the PSITS-UA portal. It guarantees high availability and zero service degradation for **600+ BSIT students** today, while providing the concurrency and ACID transactional integrity needed for future high-volume student elections and media-rich organization blogs.

---

## 2. Core Architecture Blueprint (3-Tier Hybrid)

```text
                     ┌─────────────────────────────────────────────────────────┐
                     │                   Student / Voter Device                │
                     └────────────────────────────┬────────────────────────────┘
                                                  │ HTTPS
                                                  ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: EDGE SECURITY & DNS (Cloudflare — Free Tier)                                                   │
│ • Anycast DNS & Edge Reverse Proxy (Proxied CNAME to Vercel)                                           │
│ • Free DDoS Mitigation & Layer 7 Web Application Firewall (WAF)                                        │
│ • Cloudflare Turnstile (Privacy-preserving, frictionless CAPTCHA on vote forms)                       │
│ • Edge Asset Caching (Zero egress cost for static files & blog images)                                 │
└─────────────────────────────────────────────────┬──────────────────────────────────────────────────────┘
                                                  │ Clean Traffic (Proxied)
                                                  ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 2: APPLICATION RUNTIME & SERVERLESS COMPUTE (Vercel — Hobby Free Tier)                            │
│ • Next.js 16 (App Router) + React 19 + Server Actions                                                  │
│ • Zero-configuration deployment with instant rollback support                                         │
│ • 100 GB/month bandwidth allowance (<5 GB expected for 600 students)                                  │
│ • Ephemeral compute executes auth verifications, server-side rendering, and API routes                 │
└─────────────────────────────────────────────────┬──────────────────────────────────────────────────────┘
                                                  │ Transactional Connection Pooler (Port 6543)
                                                  ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 3: DATABASE, AUTH & OBJECT STORAGE (Supabase — Free Tier)                                         │
│ • Managed PostgreSQL with ACID transaction guarantees & unique constraints                             │
│ • Supavisor Connection Pooler (prevents serverless DB exhaustion during voting rushes)                 │
│ • Google OAuth restricted strictly to the institutional domain: `@antiquespride.edu.ph`               │
│ • Supabase Storage (1 GB free) or Cloudflare R2 (10 GB free, $0 egress) for blog media               │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Capacity & Quota Matrix (Free Tier vs. Actual Demand)

| Resource | Free Tier Quota | 600 Student Demand | Safety Margin |
| :--- | :--- | :--- | :--- |
| **User Authentication** | 50,000 Monthly Active Users | 600 active students | **83x Headroom** |
| **Relational Database** | 500 MB PostgreSQL storage | ~10–15 MB (profiles + 5k votes + blog) | **97% Free Headroom** |
| **Concurrent DB Connections** | Up to 200 via Supavisor Pooler | ~20–50 concurrent write connections | **4x Headroom** |
| **Media / Image Storage** | 1 GB (Supabase) / 10 GB (R2) | ~15 MB (100 posts @ 150 KB WebP) | **98.5% Free Headroom** |
| **Bandwidth (Egress)** | 100 GB / month (Vercel) | 3 to 8 GB / month | **92% Free Headroom** |
| **Monthly Operating Cost** | **$0.00 / month** | **$0.00 / month** | **100% Free** |

---

## 4. High-Concurrency Voting System Specification

Online campus voting systems encounter extreme "thundering herd" concurrency (hundreds of students submitting votes simultaneously within short assembly windows).

### 4.1. Non-Negotiable Integrity Rules

1. **Zero Double-Voting**: A student must never be allowed to vote twice, even if two browser tabs or mobile requests submit at the exact same millisecond.
2. **Ballot Secrecy & Auditability**: The audit log proves a student voted without coupling their identity directly to the candidate selections.
3. **Atomic Execution**: Either all selections on a ballot save successfully or none do.

### 4.2. Database Schema & Concurrency Strategy

```sql
-- Voter Participation Ledger (Guarantees one vote per student per election)
CREATE TABLE election_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES elections(id),
    student_id VARCHAR(64) NOT NULL,
    voted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_voter_per_election UNIQUE (election_id, student_id)
);

-- Anonymous Vote Tally (Decoupled from student identity for ballot secrecy)
CREATE TABLE candidate_tallies (
    election_id UUID NOT NULL REFERENCES elections(id),
    position_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    vote_count BIGINT DEFAULT 0,
    PRIMARY KEY (election_id, position_id, candidate_id)
);
```

### 4.3. Atomic Submission Transaction (Server Action)

```sql
-- Single atomic execution: If student has already voted, conflict fails immediately.
BEGIN;
  INSERT INTO election_votes (election_id, student_id)
  VALUES ($1, $2)
  ON CONFLICT (election_id, student_id) DO NOTHING;

  -- Verify participation row was inserted; if 0 rows affected, reject as duplicate.
  -- Then increment candidate tally:
  UPDATE candidate_tallies
  SET vote_count = vote_count + 1
  WHERE election_id = $1 AND candidate_id = $3;
COMMIT;
```

---

## 5. Blog & Media Hosting Architecture

### 5.1. Storage Constraints

- Vercel's production runtime filesystem is ephemeral and read-only. Uploaded files cannot be written to `/public` at runtime.
- All dynamic uploads from `/management/blog/new` must stream directly to cloud object storage.

### 5.2. Strategy

1. **Text & Metadata**: Stored directly in PostgreSQL (`posts` table containing markdown, title, author, publish date, category).
2. **Media Optimization**:
   - Client-side pre-upload compression converts images to `.webp` (target max dimensions: 1600px width, ~150 KB).
   - Direct-to-bucket upload via presigned URL to **Supabase Storage** (bucket: `blog-media`, public read-only, authenticated officer write-only).
   - For campus-wide galleries exceeding 1 GB: Swap bucket endpoint to **Cloudflare R2** (10 GB free, $0 egress).

---

## 6. Authentication & Security Model

### 6.1. Single Sign-On (SSO)

- Institutional Google OAuth (`@antiquespride.edu.ph` / `@ua.edu.ph`).
- Restrict registration domain directly in Supabase Auth settings or in Server Action verification.
- Officers and administrators assigned roles (`admin`, `officer`, `student`) in a `profiles` table guarded by PostgreSQL Row Level Security (RLS).

### 6.2. Bot & Attack Mitigation

- **Cloudflare Turnstile**: Embedded on ballot submission and login forms.
- **Vercel Server Actions**: Validate session tokens server-side before interacting with the database.
- **Connection String**: Connect from Vercel using Supabase Transaction Mode Pooler (`postgresql://...:6543/postgres?pgbouncer=true`).

---

## 7. Maintenance & Inactivity Prevention

### Supabase Free-Tier Auto-Pause Safeguard

- *Context*: Free Supabase databases pause after 7 days without inbound API traffic.
- *Mitigation*:
  1. Regular student and officer traffic across the portal keeps the database warm.
  2. Free health check / heartbeat via GitHub Actions workflow (scheduled cron running every 4 days) pinging `/api/health`.

---

## 8. Rollout Phases

1. **Phase 1 (Immediate)**: Initialize Supabase project, establish schema migrations, and configure domain-restricted Auth for the Management Portal (`app/management`).
2. **Phase 2 (Content & Media)**: Wire `app/management/blog/new` to Supabase Storage and PostgreSQL with client-side WebP compression.
3. **Phase 3 (Voting Engine)**: Implement election data model, atomic voting Server Actions, Turnstile verification, and real-time live election tally monitors.
