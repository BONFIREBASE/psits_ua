# Membership Dues Management System - Setup Guide

This guide explains how to set up and use the new student registry-based membership dues system.

## Overview

The system has been upgraded from manual entry to a toggle-based system using a master student list. Instead of manually adding each student's name and ID, you can now:

1. **Import** the master student list (605+ students) from Excel
2. **View** all students in an organized list
3. **Toggle** their payment status with a simple click
4. **Bulk operations** to mark multiple students as paid/unpaid at once

## Prerequisites

Before you begin, ensure you have:

- ✅ Supabase project with admin access
- ✅ Environment variables configured in `.env.local`
- ✅ The University of Antique Master Class List Excel file

## Step 1: Apply Database Migration

The `students` table needs to be created in your Supabase database.

### Option A: Using Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file at: `supabase/migrations/20261001_create_students.sql`
4. Copy and paste the entire SQL content into the SQL Editor
5. Click **Run** to execute the migration

### Option B: Using Supabase CLI

```bash
# If you have Supabase CLI installed
npx supabase db push
```

### Verify the Migration

To verify the table was created:
1. Go to **Table Editor** in Supabase Dashboard
2. Look for the `students` table
3. The table should have these columns:
   - `id` (UUID, primary key)
   - `student_no` (text, unique)
   - `full_name` (text)
   - `full_name_normalized` (text)
   - `year_level` (integer, 1-4)
   - `section` (text, A-E)
   - `year_section` (text, e.g., "BSIT 1-A")
   - `program` (text, default "BSIT")
   - `is_active` (boolean)
   - `created_at`, `updated_at` (timestamps)

## Step 2: Import Student Data

Now import the 640 students from the Excel file.

### Prepare the Excel File

The import script expects these columns (the script already handles the actual column names in your file):
- **Section**: Year and section (e.g., "BS INFO 1-A")
- **Student No.**: Student number (e.g., "2026-S02549")
- **Name**: Full name (e.g., "DELA CRUZ, JUAN PONCE")

Your Excel file at `C:\Users\BONFIRE BASE\Downloads\University_of_Antique_Master_Class_List.xlsx` is already in the correct format!

### Run the Import

```bash
npm run import-students
```

The script will:
1. ✅ Read the Excel file from `scripts/` directory
2. ✅ Parse all 640 student records
3. ✅ Validate data (year levels 1-4, sections A-E)
4. ✅ Import to Supabase in batches
5. ✅ Show section breakdown and statistics

### Expected Output

```
🎓 PSITS-UA Student Import Tool
============================================================
📖 Reading Excel file: ...
📊 Found 640 rows in Excel file
✅ Successfully parsed 640 students

🚀 Starting import of 640 students to Supabase...
   ✓ Batch 1: Imported 100 students
   ✓ Batch 2: Imported 100 students
   ...

📊 Import Summary:
   ✅ Imported: 640 students

📚 Section Breakdown:
   BSIT 1-A: 38 students
   BSIT 1-B: 41 students
   BSIT 1-C: 40 students
   ...
```

### Troubleshooting Import Issues

**Issue**: "Could not find the table 'public.students'"
- **Solution**: Run Step 1 first to create the students table

**Issue**: Duplicate student numbers
- **Solution**: The script uses `upsert`, so duplicates will update existing records

**Issue**: "Missing Supabase credentials"
- **Solution**: Ensure `.env.local` has:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  ```

## Step 3: Using the New System

### Access the Dues Management Page

1. Navigate to `/management/dues`
2. You'll see two view modes:
   - **Student Registry** (new) - Toggle-based system
   - **Manual Records** (legacy) - Old manual entry system

### Student Registry View Features

#### 📊 Dashboard Statistics
- **Total Students**: Shows all students in the registry
- **Paid Members**: Count and percentage of students who paid
- **Unpaid**: Number of students who haven't paid yet

#### 🔍 Search and Filters
- **Search**: By name, student number, or section
- **Year Level**: Filter by 1st, 2nd, 3rd, or 4th year
- **Section**: Filter by A, B, C, D, or E
- **Payment Status**: Show only paid or unpaid students

#### ✅ Individual Payment Toggle
- Click the payment button next to each student
- **Green "Paid"** button = Student has paid
- **Gray "Not Paid"** button = Student hasn't paid
- Instantly toggles payment status

#### 📋 Bulk Operations
1. **Select students**: Click checkboxes next to student names
2. **Select all**: Use the "Select All" checkbox at the top
3. **Bulk actions**:
   - **Mark as Paid**: Green button marks all selected as paid
   - **Mark as Unpaid**: Orange button removes payment records
   - **Clear**: Deselect all students

### Example Workflow

**Scenario**: Recording dues for BSIT 1-A students who paid today

1. Filter by **Year Level**: "1st Year"
2. Filter by **Section**: "Section A"
3. Click **Select All** to select all 38 students in 1-A
4. Click **Mark as Paid**
5. Done! All 38 students are now marked as paid

**Scenario**: One student paid late

1. Search for the student by name or student number
2. Click the **Not Paid** button next to their name
3. It changes to **Paid** ✓

## Step 4: Data Sync with Legacy System

The new system is fully compatible with the old manual entry system:

- ✅ Payment records sync to `membership_dues` table
- ✅ Public dues tracker shows all payments
- ✅ Statistics are accurate across both views
- ✅ You can switch between Registry and Manual views anytime

### How It Works

When you mark a student as paid in the Registry view:
1. Creates a record in `membership_dues` table
2. Links to the student's data from `students` table
3. Records officer name, date, academic year, and semester
4. Increments payment statistics

When you mark as unpaid:
1. Removes the record from `membership_dues`
2. Student remains in `students` table (master list)
3. Updates statistics accordingly

## Benefits of the New System

### Before (Manual Entry)
- ❌ Type each student's name manually
- ❌ Risk of typos and duplicates
- ❌ No visual confirmation of who paid
- ❌ Can't easily see unpaid students
- ❌ Time-consuming for large sections

### After (Toggle System)
- ✅ All 640 students pre-loaded
- ✅ One-click payment toggle
- ✅ Visual paid/unpaid indicators
- ✅ Instant search and filtering
- ✅ Bulk operations for entire sections
- ✅ Accurate student information from official source

## Database Schema

### `students` Table
Master list of all BSIT students (permanent, rarely changes)

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY,
  student_no TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  full_name_normalized TEXT NOT NULL,  -- For searching
  year_level INT (1-4),
  section TEXT (A-E),
  year_section TEXT,  -- e.g., "BSIT 1-A"
  program TEXT DEFAULT 'BSIT',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### `membership_dues` Table
Payment records per semester (transactional, frequently updated)

```sql
CREATE TABLE membership_dues (
  id UUID PRIMARY KEY,
  student_name TEXT NOT NULL,
  student_name_normalized TEXT NOT NULL,
  program TEXT,
  year_level INT,
  section TEXT,
  year_section TEXT,
  amount NUMERIC DEFAULT 25.00,
  is_paid BOOLEAN DEFAULT true,
  academic_year TEXT,  -- e.g., "2024-2025"
  semester TEXT,        -- e.g., "1st Semester"
  recorded_by TEXT,
  paid_at TIMESTAMPTZ,
  -- Unique constraint prevents duplicates
  UNIQUE(student_name_normalized, year_section, academic_year, semester)
);
```

### Relationship

The systems are linked through `student_name_normalized`:
- When marking as paid: Insert into `membership_dues`
- When checking status: Join `students` with `membership_dues`
- Master student data always stays in `students` table

## Maintenance

### Adding New Students

If new students enroll mid-semester:

**Option 1: Manual Add via Supabase Dashboard**
1. Go to Supabase Table Editor → `students`
2. Click **Insert** → **Insert row**
3. Fill in student details
4. They'll appear in the Registry immediately

**Option 2: Update Excel and Re-import**
1. Add new students to the Excel file
2. Run `npm run import-students` again
3. The script uses `upsert` so it won't duplicate existing students

### Updating Student Information

To update a student's section or year level:
1. Update in Supabase Dashboard → `students` table
2. Changes reflect immediately in the Registry

### Archiving Graduated Students

To hide graduated students:
1. In `students` table, set `is_active = false`
2. They'll no longer appear in the Registry
3. Historical payment records remain intact

## Support and Troubleshooting

### Common Issues

**Q: I imported students but they don't appear**
- Check Supabase Table Editor to verify data was imported
- Ensure `is_active = true` for students
- Try refreshing the page

**Q: Payment toggle doesn't work**
- Check browser console for errors
- Verify user has proper authentication
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly

**Q: Duplicate entries in the list**
- This shouldn't happen due to unique constraints
- If it does, check for duplicate `student_no` in the Excel file
- Re-run import to fix duplicates

**Q: Student name doesn't match Excel**
- Names are taken exactly from the Excel "Name" column
- To fix: Update in Supabase → `students` table

### Need Help?

- Check application logs in browser console
- Review Supabase logs for database errors
- Verify all environment variables are set
- Ensure migration was applied successfully

## Files Reference

### Import Scripts
- `scripts/import-students.mjs` - Main import script
- `scripts/inspect-excel.mjs` - Excel inspection tool
- `package.json` - Contains `import-students` npm script

### Database
- `supabase/migrations/20261001_create_students.sql` - Students table migration
- `lib/students.ts` - Student-related types and queries

### Components
- `app/management/dues/page.tsx` - Main dues management page
- `app/management/dues/StudentDuesRegistry.tsx` - New registry component
- `app/management/dues/actions.ts` - Server actions for dues operations

### Types
- `StudentRow` - Student record from database
- `StudentWithDuesStatus` - Student + payment status
- `MembershipDueRow` - Payment record

---

**Version**: 1.0.0  
**Last Updated**: October 2026  
**Maintained by**: PSITS-UA Development Team
