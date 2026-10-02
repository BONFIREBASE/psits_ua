# Membership Dues System - Testing Checklist

Use this checklist to verify the new toggle-based dues system works correctly.

## ✅ Pre-Testing Setup

Before testing, complete these setup steps:

- [ ] **Step 1**: Apply the database migration
  - Open Supabase Dashboard → SQL Editor
  - Copy content from `supabase/migrations/20261001_create_students.sql`
  - Execute the SQL
  - Verify `students` table appears in Table Editor

- [ ] **Step 2**: Import student data
  ```bash
  npm run import-students
  ```
  - Verify: Should show "✅ Imported: 640 students"
  - Check Supabase Table Editor → `students` table has 640 rows

- [ ] **Step 3**: Build and run the application
  ```bash
  npm run build
  npm run dev
  ```
  - Navigate to `http://localhost:3000/management/dues`

## 🧪 Functional Tests

### Test 1: View Mode Toggle

- [ ] Page loads without errors
- [ ] See two buttons: "Student Registry" and "Manual Records"
- [ ] "Student Registry" is selected by default (gold background)
- [ ] Click "Manual Records" → View switches to legacy system
- [ ] Click "Student Registry" → View switches back to new system

**Expected**: Smooth transitions between views, no console errors

---

### Test 2: Student Registry View Loads

- [ ] Switch to "Student Registry" view
- [ ] See three statistics cards:
  - **Total Students**: Shows 640
  - **Paid Members**: Shows 0 (initially)
  - **Unpaid**: Shows 640 (initially)
- [ ] See search bar with placeholder text
- [ ] See filter dropdowns: Year Level, Section
- [ ] See "Paid Only" and "Unpaid Only" filter buttons
- [ ] See "Select All" checkbox header
- [ ] See list of students (showing first batch)

**Expected**: All UI elements render correctly, no loading errors

---

### Test 3: Search Functionality

Test each search method:

- [ ] Search by **student name** (e.g., "AGUPE")
  - Results filter immediately
  - Shows matching students
  - Counter updates: "Showing X of 640 students"

- [ ] Search by **student number** (e.g., "2026-S02549")
  - Finds exact match
  - Shows correct student

- [ ] Search by **section** (e.g., "BSIT 1-A")
  - Filters to students in that section only

- [ ] Clear search (click "Clear" button or delete text)
  - Returns to full list

**Expected**: Instant filtering, accurate results, no lag

---

### Test 4: Filter Functionality

Test each filter:

- [ ] **Year Level Filter**: Select "1st Year"
  - Shows only year 1 students (~197 students)
  - Statistics update accordingly

- [ ] **Section Filter**: Select "Section A"
  - Combined with year filter if active
  - Shows correct subset

- [ ] **Paid Only Button**: Click to toggle on
  - Initially shows 0 students (none paid yet)
  - Button turns green when active

- [ ] **Unpaid Only Button**: Click to toggle on
  - Shows all 640 students (all unpaid initially)
  - Button turns orange when active
  - "Paid Only" turns off automatically

- [ ] **Reset Filters**: Set all back to "All"
  - Returns to full 640 students

**Expected**: Filters combine correctly, statistics accurate

---

### Test 5: Individual Payment Toggle

- [ ] Find a student (e.g., search "AGUPE, ALLEN")
- [ ] Click the **"Not Paid"** button (gray)
  - Button changes to **"Paid"** (green with checkmark)
  - Toast notification appears: "✓ [Name] marked as paid"
  - **Paid Members** statistic increases by 1
  - **Unpaid** statistic decreases by 1

- [ ] Click the **"Paid"** button again
  - Button changes back to **"Not Paid"** (gray)
  - Toast notification: "○ [Name] marked as unpaid"
  - Statistics update accordingly

- [ ] Toggle a few more students
  - Each toggle is instant
  - Statistics stay accurate

**Expected**: Instant updates, accurate statistics, smooth animations

---

### Test 6: Bulk Selection

- [ ] Click checkboxes next to 3-5 students manually
  - Checkboxes become checked
  - Orange banner appears: "X student(s) selected"
  - Shows bulk action buttons

- [ ] Click "Clear" button
  - All checkboxes uncheck
  - Banner disappears

- [ ] Filter to "1st Year" + "Section A"
  - Click "Select All" checkbox
  - All ~38 students in 1-A become selected
  - Banner shows: "38 student(s) selected"

**Expected**: Selection works smoothly, counts are accurate

---

### Test 7: Bulk Mark as Paid

- [ ] Select 5-10 students using checkboxes
- [ ] Click **"Mark as Paid"** button (green)
  - Loading state appears briefly
  - Toast notification: "✓ Marked X student(s) as paid"
  - Selected students show "Paid" buttons
  - Statistics update (+X to Paid Members)
  - Checkboxes clear automatically

- [ ] Filter to "Paid Only"
  - Shows only the students you just marked
  - Count matches

**Expected**: Bulk operation completes in <2 seconds, all updates accurate

---

### Test 8: Bulk Mark as Unpaid

- [ ] Filter to "Paid Only" (to see paid students)
- [ ] Select all paid students
- [ ] Click **"Mark as Unpaid"** button (orange)
  - Toast notification: "○ Marked X student(s) as unpaid"
  - Selected students revert to "Not Paid"
  - Statistics update (-X from Paid Members)

**Expected**: Reverse operation works correctly

---

### Test 9: Large Section Test

Test with full section (40+ students):

- [ ] Filter: "2nd Year" + "Section B" (~35 students)
- [ ] Click "Select All"
- [ ] Click "Mark as Paid"
  - Wait for completion
  - All 35 students marked as paid
  - Statistics: +35 to Paid Members

**Expected**: Handles 30-40 students without issues

---

### Test 10: Data Persistence

- [ ] Mark 10 students as paid across different sections
- [ ] Note the exact students and sections
- [ ] Refresh the page (F5)
  - Payment statuses persist
  - Statistics remain accurate
  - Same students show "Paid" buttons

- [ ] Switch to "Manual Records" view
  - See the 10 payment records in the legacy list
  - Student names match
  - Amounts show ₱25.00

- [ ] Switch back to "Student Registry"
  - Payment statuses still correct

**Expected**: All data persists across refreshes and view switches

---

### Test 11: Search + Filter + Toggle Combination

Complex workflow:

- [ ] Search: "BSIT 1-A"
- [ ] Select 5 students
- [ ] Mark as Paid
- [ ] Filter: "Paid Only"
  - Shows the 5 paid students only
- [ ] Clear filters
- [ ] Filter: "1st Year" + "Unpaid Only"
  - Shows 1st year unpaid students
  - The 5 paid students are excluded

**Expected**: Filters interact correctly with payment status

---

### Test 12: Public Tracker Sync

Verify public-facing dues page updates:

- [ ] Mark 20-30 students as paid in Registry
- [ ] Open new tab: `/dues` (public tracker)
- [ ] Verify:
  - Total paid count shows 20-30
  - Section breakdown shows correct counts
  - Masked names appear in the list
  - Total collected amount is accurate (count × ₱25.00)

**Expected**: Public tracker reflects Registry changes immediately

---

### Test 13: Error Handling

Test edge cases:

- [ ] Try toggling payment while offline (disconnect internet)
  - Should show error toast
  - Button should revert to original state

- [ ] Select 0 students and click "Mark as Paid"
  - Should show error: "No students selected"

- [ ] Search for non-existent student: "ZZZZZZZ"
  - Shows "No students found" message
  - UI remains functional

**Expected**: Graceful error handling, no crashes

---

### Test 14: Term Configuration

Test academic year/semester handling:

- [ ] Switch to "Manual Records" view
- [ ] Click "Manage" button in Active Term card
- [ ] Verify current term displayed
- [ ] Switch back to "Student Registry"
- [ ] Payment toggles should use this active term

**Expected**: Registry respects active term configuration

---

### Test 15: Performance Test

Test with large datasets:

- [ ] Clear all filters (show all 640 students)
- [ ] Scroll through the list
  - Smooth scrolling, no lag
- [ ] Type in search box while viewing full list
  - Instant filtering
- [ ] Select all 640 students (don't mark as paid yet!)
  - Selection completes quickly
  - Click "Clear" to deselect

**Expected**: No performance degradation with full dataset

---

## 🐛 Common Issues & Solutions

### Issue: Students don't appear in Registry

**Check**:
1. Supabase Table Editor → `students` table has data
2. Browser console for errors
3. Network tab shows successful API calls

**Fix**: Re-run import script if table is empty

---

### Issue: Payment toggle doesn't work

**Check**:
1. User is authenticated (logged in to management)
2. Browser console for permission errors
3. Supabase RLS policies allow writes

**Fix**: Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

---

### Issue: Statistics don't update

**Check**:
1. Hard refresh (Ctrl+Shift+R)
2. Check if `membership_dues` table is being updated

**Fix**: Verify revalidation in actions.ts is working

---

### Issue: Bulk operations timeout

**Check**:
1. Number of students selected
2. Network connection

**Fix**: Select smaller batches (50-100 at a time maximum)

---

## ✅ Sign-Off Checklist

After completing all tests above:

- [ ] All 15 functional tests passed
- [ ] No console errors during normal usage
- [ ] Data persists correctly across sessions
- [ ] Public tracker syncs with Registry
- [ ] Both Registry and Manual views work
- [ ] Performance is acceptable with 640 students
- [ ] Error handling works gracefully

## 📊 Test Results Template

Copy and fill this out after testing:

```
=== MEMBERSHIP DUES SYSTEM TEST RESULTS ===

Date: _______________
Tester: _______________
Environment: _______________

Setup:
- [ ] Migration applied successfully
- [ ] 640 students imported
- [ ] Application builds without errors

Core Functionality:
- [ ] View mode toggle works
- [ ] Search functionality: ___/10
- [ ] Filter functionality: ___/10
- [ ] Individual toggle: ___/10
- [ ] Bulk operations: ___/10
- [ ] Data persistence: ___/10

Performance:
- [ ] Page load time: _____ seconds
- [ ] Search response: _____ ms
- [ ] Toggle response: _____ ms
- [ ] Bulk operation (50 students): _____ seconds

Issues Found:
1. _________________________
2. _________________________
3. _________________________

Overall Status: ✅ PASS / ❌ FAIL

Notes:
_________________________________
_________________________________
```

---

## 🚀 Ready for Production?

Before deploying to production:

- [ ] All tests passed
- [ ] No critical bugs found
- [ ] Import script tested with actual Excel file
- [ ] Backup of existing `membership_dues` data created
- [ ] Officers trained on new system
- [ ] Documentation reviewed and accessible

---

**Next Steps**: See `docs/MEMBERSHIP_DUES_SETUP.md` for deployment instructions
