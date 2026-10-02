# PSITS-UA Database Security Audit

## 📊 Tables Inventory

Your Supabase project has **16 tables** across the following categories:

### 1. Core Management (8 tables)
- `documents` - Resolutions, memos, minutes
- `treasury_records` - Income, expenses, financial records
- `attendance_meetings` - Meeting schedule and info
- `attendance_records` - QR scan logs
- `events` - Calendar and event listings
- `officers` - Current officer roster
- `projects` - Project showcase
- `audit_reports` - Semester audit reports

### 2. Membership & Dues (3 tables)
- `membership_dues` - Payment records per semester
- `students` - Master student list (501 students)
- `dues_term_config` - Active academic year/semester

### 3. Content & Media (4 tables)
- `posts` - Blog posts and announcements
- `banners` - Homepage rotating banners
- `archive_photos` - Historical photo gallery
- `polo_submissions` - Shirt design contest entries

### 4. Authentication (1 table)
- `sessions` - User login sessions

---

## 🔒 Current Security Status

### ❌ CRITICAL ISSUES FOUND

**Issue #1: Overly Permissive Service Role Policies**
- **All tables** have a blanket "Service Role Full Access" policy
- This bypasses all security rules
- Risk: If service role key is compromised, entire database is exposed

**Issue #2: No Differentiation Between User Roles**
- No distinction between admin, officer, and regular member
- All authenticated users have same permissions
- Risk: Any logged-in user can modify any data

**Issue #3: Sensitive Data Publicly Accessible**
- **Problem tables:**
  - `students` - Full names and student IDs visible to anyone
  - `membership_dues` - Who paid/didn't pay is public
  - `sessions` - Authentication tokens accessible
  - `treasury_records` - All financial data public (even drafts)
  - `documents` - Draft documents visible to public

---

## ✅ Recommended Security Model

### Access Level Matrix

| Table | Public (anon) | Authenticated | Service Role |
|-------|---------------|---------------|--------------|
| **documents** | Published only | Full CRUD | Bypass |
| **treasury_records** | Published only | Full CRUD | Bypass |
| **attendance_meetings** | Completed only | Full CRUD | Bypass |
| **attendance_records** | Read all | Full CRUD | Bypass |
| **events** | Read all | Full CRUD | Bypass |
| **officers** | Read all | Full CRUD | Bypass |
| **projects** | Read all | Full CRUD | Bypass |
| **audit_reports** | Approved only | Full CRUD | Bypass |
| **membership_dues** | Read (masked) | Full CRUD | Bypass |
| **students** | Active only | Full CRUD | Bypass |
| **posts** | Read all | Full CRUD | Bypass |
| **banners** | Read all | Full CRUD | Bypass |
| **polo_submissions** | Approved only + own | Insert own, Update own | Bypass |
| **sessions** | None | Own session only | Bypass |
| **archive_photos** | Read all | Full CRUD | Bypass |
| **dues_term_config** | Read only | Update only | Bypass |

---

## 🛠️ Implementation Guide

### Step 1: Apply the Secure RLS Migration

I've created a comprehensive migration file at:
```
supabase/migrations/20261002_secure_rls_policies.sql
```

**To apply:**
1. Open Supabase Dashboard → SQL Editor
2. Copy the ENTIRE content of `20261002_secure_rls_policies.sql`
3. Paste and click **RUN**

This migration will:
- ✅ Remove overly permissive policies
- ✅ Add granular, table-specific policies
- ✅ Restrict public access appropriately
- ✅ Maintain necessary functionality

### Step 2: Test Each Table

After applying migration, test:

```sql
-- Test as anonymous user (public)
SELECT * FROM documents WHERE status = 'Draft';
-- Should return 0 rows (drafts hidden)

SELECT * FROM documents WHERE status = 'Published';
-- Should return published docs

-- Test as authenticated user (officer login required)
INSERT INTO events (title, date, time, location, category, description)
VALUES ('Test Event', '2026-10-15', '14:00', 'Room 301', 'Meeting', 'Test');
-- Should succeed if authenticated

-- Test sensitive data
SELECT * FROM sessions;
-- Should only return your own session if authenticated
-- Should return nothing if anonymous
```

### Step 3: Environment Variable Check

Ensure your `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key     # Public, limited access
SUPABASE_SERVICE_ROLE_KEY=your_service_key      # Backend only, full access
```

**CRITICAL:** Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code!

---

## 🔐 Security Best Practices Applied

### 1. Principle of Least Privilege
- Public users can only read what they need
- Draft/unpublished content is hidden
- Sensitive data masked or restricted

### 2. Defense in Depth
- RLS at database level
- Application-layer masking (e.g., student names in public dues)
- Authentication required for modifications

### 3. Audit Trail
- All tables have `created_at` timestamps
- Many have `recorded_by` or `created_by` fields
- Session table tracks authentication

### 4. Data Privacy
**Personal Data Protection:**
- `students` table: Only active students visible publicly
- `membership_dues`: Names masked in public API via `maskStudentName()`
- `sessions`: Private, own session only
- `attendance_records`: Consider restricting further if needed

---

## 🎯 Specific Table Security Notes

### High Security (Restricted Public Access)

**`sessions`** 🔴 **CRITICAL**
- Current: Public can read everything ❌
- Fixed: Only own session, authenticated only ✅
- Contains authentication tokens

**`students`** 🟡 **SENSITIVE**
- Current: All student data public ❌
- Fixed: Active students only, full names visible ⚠️
- Consider: Additional masking if needed

**`membership_dues`** 🟡 **FINANCIAL**
- Current: All payment records public ❌
- Fixed: Public read but masked in app layer ✅
- Names masked via `getPublicDuesSummaryAction()`

**`treasury_records`** 🟡 **FINANCIAL**
- Current: All records including drafts public ❌
- Fixed: Published only ✅

### Medium Security (Filtered Public Access)

**`documents`** 🟢
- Fixed: Published only visible to public ✅
- Drafts require authentication

**`audit_reports`** 🟢
- Fixed: Approved/Archived only ✅
- Drafts hidden from public

**`polo_submissions`** 🟢
- Fixed: Approved/shortlisted public ✅
- Students can view own submissions
- Officers can manage all

### Low Security (Full Public Read)

These are intentionally public:
- `events` - Public calendar
- `officers` - Public roster
- `projects` - Showcase
- `posts` - Blog/announcements
- `banners` - Homepage
- `archive_photos` - Gallery

---

## ⚠️ Known Limitations & Future Improvements

### Current Limitations

1. **No Role-Based Access Control (RBAC)**
   - All authenticated users have same permissions
   - Can't differentiate admin from regular officer

2. **Student Data Still Public**
   - Active student list is readable by anyone
   - May violate privacy in some jurisdictions

3. **No Rate Limiting at DB Level**
   - Public endpoints can be hammered
   - Implement application-level rate limiting

### Recommended Improvements

**Phase 2 Security Enhancements:**

```sql
-- Add user roles table
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY,
  role TEXT CHECK (role IN ('admin', 'officer', 'member')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Then modify policies to check role:
CREATE POLICY "Only admins can delete events"
  ON events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
```

**Phase 3: Audit Logging**

```sql
-- Track all modifications
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT,
  action TEXT,
  user_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 📋 Security Checklist

Before going to production:

- [ ] Apply `20261002_secure_rls_policies.sql` migration
- [ ] Test all tables as anonymous user
- [ ] Test all tables as authenticated user
- [ ] Verify sensitive data (sessions, students) properly restricted
- [ ] Confirm service role key is NOT in client-side code
- [ ] Test public endpoints (posts, events, officers)
- [ ] Test management functions (dues, documents, treasury)
- [ ] Review `.env.local` and `.env.production`
- [ ] Set up monitoring/alerting for suspicious queries
- [ ] Document which users have admin access
- [ ] Schedule quarterly security audits

---

## 🚨 Emergency Response

**If service role key is compromised:**

1. **Immediately** regenerate service role key in Supabase Dashboard
2. Update `.env.local` and production environment
3. Redeploy application
4. Review audit logs for suspicious activity
5. Check all tables for unauthorized modifications
6. Notify affected users if data was accessed

**If unauthorized data access detected:**

1. Review Supabase logs (Dashboard → Logs)
2. Identify compromised accounts
3. Force password reset for affected users
4. Review and strengthen RLS policies
5. Consider temporary read-only mode
6. Document incident for future prevention

---

## 📚 Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Security Level:** ⚠️ **MEDIUM** (After applying migration)

**Next Review:** Every semester or after major changes

**Maintained By:** PSITS-UA Development Team
