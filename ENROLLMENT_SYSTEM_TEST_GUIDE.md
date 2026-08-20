# Enrollment System - Comprehensive Testing Guide

## Overview
This guide provides step-by-step instructions for testing the complete Academic Year, Enrollment & Student Promotion system integrated with Smart SMS.

**Testing Date:** August 13, 2026  
**System Version:** 1.0  
**Test Coverage:** Full end-to-end workflows across all user roles

---

## Table of Contents
1. [Pre-Test Setup](#pre-test-setup)
2. [Academic Year Management Tests](#academic-year-management-tests)
3. [Student Enrollment Tests](#student-enrollment-tests)
4. [Student Promotion Tests](#student-promotion-tests)
5. [Student Transfer Tests](#student-transfer-tests)
6. [Multi-Role Visibility Tests](#multi-role-visibility-tests)
7. [Notification Tests](#notification-tests)
8. [Integration Tests](#integration-tests)
9. [Edge Cases & Validation Tests](#edge-cases--validation-tests)
10. [Performance Tests](#performance-tests)

---

## Pre-Test Setup

### 1. Database Preparation
```bash
# Ensure MongoDB is running
# Ensure all models are synced
# Verify test data exists
```

### 2. Start the Application
```bash
# Terminal 1 - Backend
cd school-management-system/server
npm start

# Terminal 2 - Frontend
cd school-management-system
npm run dev
```

### 3. Test User Accounts
- **Admin:** admin@school.com / password
- **Teacher:** teacher@school.com / password
- **Student:** student@school.com / password
- **Parent:** parent@school.com / password

### 4. Required Test Data
- At least 2 Academic Years (one active, one inactive)
- At least 5 Students (some enrolled, some not enrolled)
- At least 3 Classes per grade (Grade 9, 10, 11, 12)
- At least 2 Teachers assigned to classes
- At least 1 Parent linked to students

---

## Academic Year Management Tests

### Test 1.1: Create New Academic Year
**Role:** Admin  
**Path:** /admin/academic-years

1. Click "Add Academic Year" button
2. Fill in form:
   - Name: "2027/2028"
   - Start Date: "2027-09-01"
   - End Date: "2028-06-30"
   - Is Active: Unchecked
3. Click "Create"

**Expected Results:**
- ✅ Success notification appears
- ✅ New academic year appears in Active Years table
- ✅ Start/End dates display correctly
- ✅ Status shows "Inactive" (gray badge)

### Test 1.2: Set Active Academic Year
**Role:** Admin  
**Path:** /admin/academic-years

1. Find an inactive academic year
2. Click "Set Active" button
3. Confirm the warning dialog

**Expected Results:**
- ✅ Confirmation dialog shows warning about deactivating others
- ✅ Success notification appears
- ✅ Selected year shows "Current" badge (green)
- ✅ Previously active year becomes "Inactive" (gray)
- ✅ Only ONE academic year is active

### Test 1.3: Edit Academic Year
**Role:** Admin  
**Path:** /admin/academic-years

1. Click "Edit" button on any academic year
2. Change the name to "2026/2027 (Updated)"
3. Click "Update"

**Expected Results:**
- ✅ Success notification appears
- ✅ Updated name displays in table
- ✅ Other fields remain unchanged

### Test 1.4: Archive Academic Year
**Role:** Admin  
**Path:** /admin/academic-years

1. Click "Archive" button on an inactive academic year
2. Confirm the dialog

**Expected Results:**
- ✅ Confirmation warns that archived years cannot be set active
- ✅ Success notification appears
- ✅ Academic year moves to "Archived Academic Years" section
- ✅ Archived section appears with reduced opacity
- ✅ "Unarchive" button shows in actions

### Test 1.5: Unarchive Academic Year
**Role:** Admin  
**Path:** /admin/academic-years

1. In Archived section, click "Unarchive" button
2. Confirm

**Expected Results:**
- ✅ Success notification appears
- ✅ Academic year moves back to Active Years table
- ✅ Status shows "Inactive"
- ✅ Can now be set as active

### Test 1.6: Delete Academic Year Validation
**Role:** Admin  
**Path:** /admin/academic-years

1. Try to delete the active academic year

**Expected Results:**
- ❌ Error notification: "Cannot delete the active academic year"
- ✅ Academic year remains in table

2. Delete an inactive academic year with no enrollments
3. Confirm the warning dialog

**Expected Results:**
- ✅ Warning mentions enrollment impact
- ✅ Success notification appears
- ✅ Academic year removed from table

---

## Student Enrollment Tests

### Test 2.1: Single Student Enrollment
**Role:** Admin  
**Path:** /admin/enrollment → Enroll Tab

1. Select "Academic Year": "2026/2027" (active)
2. Select "Student": Choose a non-enrolled student
3. Select "Class": "Grade 10 - Section A"
4. Enter "Roll Number": "15"
5. Select "Enrollment Date": Today's date
6. Click "Enroll Student"

**Expected Results:**
- ✅ Success notification: "Student enrolled successfully"
- ✅ Form resets
- ✅ Student appears in History tab with "Active" status (green badge)
- ✅ Notification sent to student and parents

### Test 2.2: Enrollment with Auto Roll Number
**Role:** Admin  
**Path:** /admin/enrollment → Enroll Tab

1. Select academic year and student
2. Select class
3. **Leave roll number empty**
4. Click "Enroll Student"

**Expected Results:**
- ✅ Student enrolled successfully
- ✅ Roll number auto-generated (incremental)
- ✅ Roll number visible in History tab

### Test 2.3: Duplicate Enrollment Prevention
**Role:** Admin  
**Path:** /admin/enrollment → Enroll Tab

1. Select a student **already enrolled** in the selected academic year
2. Select same or different class in same academic year
3. Click "Enroll Student"

**Expected Results:**
- ❌ Error notification: "Student is already enrolled in this academic year"
- ✅ No enrollment created
- ✅ Student dropdown should ideally not show already-enrolled students

### Test 2.4: Enrollment with Stream (Grade 11-12)
**Role:** Admin  
**Path:** /admin/enrollment → Enroll Tab

1. Select academic year
2. Select student
3. Select class: "Grade 11 Natural Science - Section A"
4. Enter roll number
5. Click "Enroll Student"

**Expected Results:**
- ✅ Enrollment successful
- ✅ Stream ("Natural Science") saved in enrollment
- ✅ Stream displays in History tab

### Test 2.5: Class Capacity Validation
**Role:** Admin  
**Path:** /admin/enrollment → Enroll Tab

1. Find a class at full capacity (enrolled = capacity)
2. Try to enroll another student in that class

**Expected Results:**
- ❌ Error notification: "Class is at full capacity (X students)"
- ✅ No enrollment created

---

## Student Promotion Tests

### Test 3.1: Bulk Student Promotion (Grade 9 → 10)
**Role:** Admin  
**Path:** /admin/enrollment → Promote Tab

1. **Source Class:**
   - Academic Year: "2025/2026"
   - Grade: "Grade 9"
   - Section: "A"
   - Stream: "" (none)

2. **Target Class:**
   - Academic Year: "2026/2027"
   - Grade: "Grade 10"
   - Section: "A"
   - Stream: "" (none)

3. Click "Preview Students"

**Expected Results:**
- ✅ Preview modal opens
- ✅ Shows all enrolled students from Grade 9-A
- ✅ Displays roll number, name, enrollment number, current class
- ✅ Shows total count

4. Click "Confirm Promotion"

**Expected Results:**
- ✅ Success notification: "Promoted X of Y students"
- ✅ All students appear in Grade 10-A enrollment records
- ✅ Old enrollments marked as "promoted" status
- ✅ New enrollments marked as "active" status
- ✅ Old enrollments have promotedTo link
- ✅ New enrollments have promotedFrom link
- ✅ Students' cache fields updated (grade, section, classId)
- ✅ Notifications sent to students and parents

### Test 3.2: Promotion with Stream Selection (Grade 10 → 11)
**Role:** Admin  
**Path:** /admin/enrollment → Promote Tab

1. **Source Class:**
   - Academic Year: "2025/2026"
   - Grade: "Grade 10"
   - Section: "A"

2. **Target Class:**
   - Academic Year: "2026/2027"
   - Grade: "Grade 11"
   - Section: "A"
   - Stream: "Natural Science"

3. Click "Preview Students"
4. Verify student list
5. Click "Confirm Promotion"

**Expected Results:**
- ✅ All validations pass (stream required for Grade 11)
- ✅ Students promoted with stream = "Natural Science"
- ✅ Stream visible in enrollment records
- ✅ Notifications include stream information

### Test 3.3: Promotion Validation (Grade 12 → 13)
**Role:** Admin  
**Path:** /admin/enrollment → Promote Tab

1. **Source Class:** Grade 12
2. **Target Class:** Try to select "Grade 13" (shouldn't exist)

**Expected Results:**
- ✅ No Grade 13 available in dropdown
- ❌ If manually crafted API call: "Cannot promote beyond Grade 12"

### Test 3.4: Promotion with Missing Stream (Grade 10 → 11)
**Role:** Admin  
**Path:** /admin/enrollment → Promote Tab

1. Source Class: Grade 10
2. Target Class: Grade 11 **without selecting stream**
3. Try to preview/promote

**Expected Results:**
- ❌ Error for students: "Stream is required when promoting to Grade 11"
- ✅ No students promoted without stream

### Test 3.5: Roll Number Auto-Generation on Promotion
**Role:** Admin  
**Path:** /admin/enrollment → Promote Tab

1. Promote students from Grade 9-A to Grade 10-B
2. Check enrolled student count in Grade 10-B before promotion: X
3. Promote 5 students

**Expected Results:**
- ✅ New roll numbers: X+1, X+2, X+3, X+4, X+5
- ✅ Sequential roll number assignment
- ✅ No duplicate roll numbers in target class

---

## Student Transfer Tests

### Test 4.1: Transfer Student to Different Section
**Role:** Admin  
**Path:** /admin/enrollment → Transfer Tab

1. Select student currently enrolled in "Grade 10 - Section A"
2. Source class auto-fills
3. Select Target Academic Year: Same year (2026/2027)
4. Select Target Class: "Grade 10 - Section B"
5. Enter Reason: "Better fit for student's learning style"
6. Click "Transfer Student"

**Expected Results:**
- ✅ Success notification: "Student transferred successfully"
- ✅ Old enrollment status = "transferred"
- ✅ Old enrollment has transferredTo link
- ✅ New enrollment created in Grade 10-B
- ✅ New enrollment status = "active"
- ✅ New enrollment has transferredFrom link
- ✅ Student's cache fields updated
- ✅ Notifications sent to student and parents

### Test 4.2: Transfer Student to Different Stream (Grade 11-12)
**Role:** Admin  
**Path:** /admin/enrollment → Transfer Tab

1. Select student in "Grade 11 Natural Science - Section A"
2. Target Class: "Grade 11 Social Science - Section A"
3. Enter reason: "Student's interest changed"
4. Transfer

**Expected Results:**
- ✅ Transfer successful
- ✅ Stream changed from "Natural Science" to "Social Science"
- ✅ Enrollment records show stream change
- ✅ Notification includes stream information

### Test 4.3: Transfer to Same Class Prevention
**Role:** Admin  
**Path:** /admin/enrollment → Transfer Tab

1. Select student
2. Target Class: **Same class as current enrollment**
3. Try to transfer

**Expected Results:**
- ❌ Error notification: "Student is already enrolled in this class"
- ✅ No transfer created

### Test 4.4: Transfer Across Academic Years
**Role:** Admin  
**Path:** /admin/enrollment → Transfer Tab

1. Select student in "2025/2026 - Grade 10-A"
2. Target Academic Year: "2026/2027"
3. Target Class: "Grade 10-B"
4. Transfer

**Expected Results:**
- ✅ Transfer successful across academic years
- ✅ Old enrollment linked to new enrollment
- ✅ Student's currentEnrollmentId updated

---

## Multi-Role Visibility Tests

### Test 5.1: Admin View
**Role:** Admin

#### Students Page (/admin/students)
1. Check Academic Year Filter dropdown
2. Check Enrollment Status Filter dropdown
3. Filter by active academic year
4. Observe table columns

**Expected Results:**
- ✅ Academic Year column displays year name
- ✅ Enrollment Status column shows color-coded badges
- ✅ Stream displays for Grade 11-12 students
- ✅ Statistics show "Enrolled (Active)" and "Not Enrolled" counts
- ✅ Filters work correctly

#### Classes Page (/admin/classes)
1. Check Academic Year dropdown in create form
2. Observe "Enrolled" column in table
3. Check statistics

**Expected Results:**
- ✅ Academic Year dropdown lists all years
- ✅ Active year shows "(Active)" badge
- ✅ Enrolled column shows "X / Y" (enrolled / capacity)
- ✅ Total Enrolled Students statistic shows sum
- ✅ Color-coded enrollment badges (blue/gray)

#### Enrollment Management (/admin/enrollment)
1. Test all four tabs (Enroll, Promote, Transfer, History)
2. Verify all filters and actions work

**Expected Results:**
- ✅ All tabs functional
- ✅ Preview modal works for promotion
- ✅ History filters work correctly
- ✅ All forms validate properly

### Test 5.2: Teacher View
**Role:** Teacher  
**Path:** /teacher/dashboard

1. Login as teacher
2. Check dashboard statistics
3. Navigate to students list

**Expected Results:**
- ✅ Dashboard shows student count for current academic year only
- ✅ Students list shows only students enrolled in teacher's classes
- ✅ Academic year context visible
- ✅ Students filtered by enrollment status = "active"
- ✅ Enrollment metadata visible (roll number, enrollment date)

### Test 5.3: Student View
**Role:** Student  
**Path:** /student/dashboard

1. Login as student
2. Check dashboard

**Expected Results:**
- ✅ Current enrollment displayed with:
  - Grade, section, stream (if Grade 11-12)
  - Roll number
  - Enrollment date
  - Class name
  - Academic year name
- ✅ Academic year context visible
- ✅ Enrollment status badge shown

#### Enrollment History
**Path:** /student/profile or enrollment history section

**Expected Results:**
- ✅ Complete enrollment history visible
- ✅ Past enrollments show:
  - Previous grades/classes
  - Promotion dates
  - Transfer records
  - Status (promoted, transferred, etc.)
- ✅ Historical academic years displayed

### Test 5.4: Parent View
**Role:** Parent  
**Path:** /parent/dashboard

1. Login as parent
2. Check dashboard

**Expected Results:**
- ✅ Each child's current enrollment displayed:
  - Grade, section, stream
  - Roll number
  - Class name
  - Academic year name
  - Enrollment status
- ✅ Academic year context for each child
- ✅ Can view each child's enrollment history

#### Child Enrollment History
**Path:** /parent/child/:id

**Expected Results:**
- ✅ Complete enrollment history for selected child
- ✅ Promotion history visible with dates
- ✅ Transfer records visible
- ✅ Academic year progression displayed

---

## Notification Tests

### Test 6.1: Enrollment Notification
**Setup:** Enroll a new student

**Check:**
1. Login as the enrolled student
2. Check notifications panel

**Expected Results:**
- ✅ Notification appears: "Welcome to Smart SMS"
- ✅ Message: "You have been enrolled in [Class] for academic year [Year]"
- ✅ Priority: High
- ✅ Action URL: /student/dashboard

3. Login as parent of the student
4. Check notifications

**Expected Results:**
- ✅ Notification appears: "[Student Name] Enrolled"
- ✅ Message includes class and academic year
- ✅ Action URL: /parent/child/:id

### Test 6.2: Promotion Notification
**Setup:** Promote students from Grade 9 to Grade 10

**Check:**
1. Login as promoted student
2. Check notifications

**Expected Results:**
- ✅ Notification: "Congratulations! You Have Been Promoted"
- ✅ Message shows from grade → to grade
- ✅ Includes target section, stream (if applicable)
- ✅ Includes academic year
- ✅ Priority: High

3. Login as parent
4. Check notifications

**Expected Results:**
- ✅ Notification: "[Student Name] Promoted"
- ✅ Shows promotion details
- ✅ Links to child profile

### Test 6.3: Transfer Notification
**Setup:** Transfer a student to different section

**Check:**
1. Login as transferred student
2. Check notifications

**Expected Results:**
- ✅ Notification: "Class Transfer Notification"
- ✅ Message shows from class → to class
- ✅ Includes section and stream changes
- ✅ Priority: High

3. Login as parent
4. Check notifications

**Expected Results:**
- ✅ Notification: "[Student Name] Transferred"
- ✅ Shows transfer details
- ✅ Links to child profile

### Test 6.4: Notification Metadata
**Check all enrollment notifications for:**

**Expected Results:**
- ✅ All notifications include relevant metadata:
  - Grade, section, stream
  - Academic year
  - From/to information (promotion/transfer)
- ✅ Action URLs navigate correctly
- ✅ Notifications marked as "high" priority
- ✅ Timestamps accurate

---

## Integration Tests

### Test 7.1: Enrollment Impact on Attendance
**Setup:** Enroll student, then mark attendance

**Steps:**
1. Enroll student in Grade 10-A for 2026/2027
2. Navigate to attendance marking
3. Mark attendance for Grade 10-A

**Expected Results:**
- ✅ Student appears in attendance list for Grade 10-A
- ✅ Academic year context maintained
- ✅ Attendance records linked to correct enrollment

### Test 7.2: Enrollment Impact on Grades
**Setup:** Enroll student, then add grade

**Steps:**
1. Enroll student in Grade 10-A
2. Navigate to grade entry
3. Add grade for student in a subject

**Expected Results:**
- ✅ Student appears in grade entry list
- ✅ Academic year context maintained
- ✅ Grade records linked to correct enrollment/class

### Test 7.3: Promotion Impact on Historical Data
**Setup:** Promote student with existing attendance/grades

**Steps:**
1. Student has attendance and grades in Grade 9-A (2025/2026)
2. Promote student to Grade 10-A (2026/2027)
3. Check historical data

**Expected Results:**
- ✅ Old attendance records remain linked to old enrollment
- ✅ Old grade records remain linked to old enrollment
- ✅ Academic year preserved in historical data
- ✅ Student can view past academic year records
- ✅ New attendance/grades link to new enrollment

### Test 7.4: Transfer Impact on Current Data
**Setup:** Transfer student with attendance in current year

**Steps:**
1. Student has attendance in Grade 10-A
2. Transfer student to Grade 10-B (same academic year)
3. Check attendance records

**Expected Results:**
- ✅ Old attendance remains linked to old enrollment
- ✅ New attendance (after transfer) links to new enrollment
- ✅ Attendance history shows both classes
- ✅ Academic year context maintained

### Test 7.5: Academic Year Filter in Reports
**Setup:** Multiple academic years with data

**Steps:**
1. Navigate to various report pages
2. Check academic year filtering

**Expected Results:**
- ✅ Reports filter by academic year correctly
- ✅ Historical data accessible by selecting past years
- ✅ Current year data shows by default
- ✅ No data mixing between academic years

---

## Edge Cases & Validation Tests

### Test 8.1: Student Without Enrollment
**Scenario:** Student exists but not enrolled in any academic year

**Check:**
1. Admin Students page
2. Filter by "Not Enrolled" enrollment status

**Expected Results:**
- ✅ Student appears in filtered list
- ✅ Enrollment Status shows "Not Enrolled" (orange badge)
- ✅ Academic Year column shows "—"
- ✅ Student can be enrolled via Enrollment Management

### Test 8.2: Multiple Enrollments (Historical)
**Scenario:** Student has been promoted 3 times

**Check:**
1. Student's enrollment history
2. Verify linked enrollments

**Expected Results:**
- ✅ All 4 enrollments visible (3 promoted + 1 active)
- ✅ Promotion links correct (promotedFrom/promotedTo)
- ✅ Chronological order maintained
- ✅ Status badges correct (promoted, promoted, promoted, active)

### Test 8.3: Stream Validation
**Test Case A:** Enroll Grade 10 student with stream

**Expected Results:**
- ✅ System accepts enrollment (no stream validation for Grade 10)
- ⚠️ Stream may be null or empty

**Test Case B:** Enroll Grade 11 student without stream

**Expected Results:**
- ❌ Validation error if class requires stream
- ✅ Enrollment blocked until stream provided

### Test 8.4: Concurrent Enrollments Prevention
**Scenario:** Try to enroll student in two classes simultaneously

**Steps:**
1. Open two browser tabs
2. Enroll student in Class A (tab 1)
3. Quickly enroll same student in Class B (tab 2)

**Expected Results:**
- ✅ First enrollment succeeds
- ❌ Second enrollment fails: "Already enrolled in this academic year"
- ✅ Only one active enrollment exists

### Test 8.5: Parent with Multiple Children
**Scenario:** Parent has 3 children in different grades

**Check:**
1. Parent dashboard
2. Notifications
3. Enrollment history for each child

**Expected Results:**
- ✅ All 3 children displayed with individual enrollments
- ✅ Each child's academic year shown
- ✅ Enrollment status for each child
- ✅ Notifications for all children received
- ✅ Can view history for each child independently

### Test 8.6: Teacher Teaching Multiple Grades
**Scenario:** Teacher assigned to Grade 9, 10, 11 classes

**Check:**
1. Teacher dashboard student count
2. Teacher students list

**Expected Results:**
- ✅ Count includes students from all assigned classes
- ✅ Students from multiple grades visible
- ✅ Academic year filter applies to all
- ✅ Only current academic year students shown by default

### Test 8.7: Deleted Class with Enrollments
**Scenario:** Class has historical enrollments but is deleted

**Expected Results:**
- ✅ Historical enrollments remain accessible
- ✅ Class data populated in enrollment records (soft reference)
- ✅ Students can view past enrollment
- ⚠️ Admin should be warned before deleting class with enrollments

### Test 8.8: Archived Academic Year Data Access
**Scenario:** Academic year archived with enrollments

**Steps:**
1. Archive an academic year with active enrollments
2. Check student history
3. Check admin reports

**Expected Results:**
- ✅ Archived year not selectable for new enrollments
- ✅ Historical data remains accessible
- ✅ Students can view past enrollment in archived year
- ✅ Reports can filter by archived year
- ✅ No new enrollments possible in archived year

---

## Performance Tests

### Test 9.1: Bulk Promotion Performance
**Scenario:** Promote 50 students simultaneously

**Steps:**
1. Enroll 50 students in Grade 9-A
2. Promote all to Grade 10-A
3. Measure time and resource usage

**Expected Results:**
- ✅ Promotion completes within reasonable time (<5 seconds)
- ✅ All 50 students promoted successfully
- ✅ No database errors or timeouts
- ✅ All enrollment links created correctly
- ✅ All notifications sent (100 notifications: 50 students + 50 parents)

### Test 9.2: Large Enrollment History Load
**Scenario:** Student with 10+ enrollment records

**Steps:**
1. View student's enrollment history
2. Check load time

**Expected Results:**
- ✅ History loads quickly (<2 seconds)
- ✅ All enrollments displayed
- ✅ No pagination issues
- ✅ UI remains responsive

### Test 9.3: Academic Year Filter Performance
**Scenario:** Filter students by academic year with 1000+ students

**Steps:**
1. Navigate to admin students page
2. Change academic year filter
3. Measure response time

**Expected Results:**
- ✅ Filter applies quickly (<3 seconds)
- ✅ No UI freezing
- ✅ Correct students displayed
- ✅ Count accurate

### Test 9.4: Enrollment Count Calculation
**Scenario:** Calculate enrolled students across 50 classes

**Steps:**
1. Navigate to admin classes page
2. Wait for enrollment counts to load

**Expected Results:**
- ✅ All counts load within 5 seconds
- ✅ Counts accurate for each class
- ✅ Total enrollment statistic correct
- ✅ Parallel API calls efficient

---

## Test Results Checklist

### Critical Features (Must Pass)
- [ ] Academic year CRUD operations
- [ ] Set active academic year (only one active)
- [ ] Single student enrollment
- [ ] Bulk student promotion
- [ ] Student transfer
- [ ] Enrollment history display
- [ ] Duplicate enrollment prevention
- [ ] Stream validation for Grade 11-12
- [ ] Enrollment notifications (student + parent)
- [ ] Multi-role visibility (admin, teacher, student, parent)

### Important Features (Should Pass)
- [ ] Academic year archiving
- [ ] Auto roll number generation
- [ ] Promotion preview modal
- [ ] Transfer reason tracking
- [ ] Class capacity validation
- [ ] Enrollment status filtering
- [ ] Academic year filtering
- [ ] Stream display for Grade 11-12
- [ ] Enrollment count per class
- [ ] Historical data preservation

### Nice-to-Have Features (Can Have Minor Issues)
- [ ] Notification metadata accuracy
- [ ] Performance under load
- [ ] Archived year data access
- [ ] Concurrent enrollment prevention
- [ ] Multiple children handling
- [ ] Teacher multi-grade visibility

---

## Known Issues & Limitations

### Current Limitations:
1. **Stream Migration:** Existing classes may have old stream format ('natural', 'social') vs new format ('Natural Science', 'Social Science')
   - **Workaround:** Update existing class records or handle both formats in frontend

2. **Parent Field Name:** Parent model uses 'children' field (fixed in Task 5), but some legacy code may still reference 'studentIds'
   - **Status:** Fixed in admin.js, parent.js - verify no other files use old field name

3. **Academic Year Cascade:** Deleting academic year doesn't cascade to enrollments
   - **Recommendation:** Add warning and prevent deletion if enrollments exist

4. **Backward Compatibility:** Student cache fields (classId, grade, section, stream) maintained for existing features
   - **Status:** Working as designed for gradual migration

### Future Enhancements:
1. Bulk transfer support (currently only single student)
2. Enrollment approval workflow
3. Academic year overlap validation (prevent date conflicts)
4. Enrollment deadline enforcement
5. Capacity warning before full (e.g., warn at 90%)
6. Export enrollment reports (CSV/PDF)

---

## Troubleshooting Guide

### Issue: Student not appearing in class list
**Check:**
1. Is enrollment status "active"?
2. Is academic year correct?
3. Is currentEnrollmentId set on student?
4. Check enrollment record in database

### Issue: Promotion fails with "already enrolled"
**Check:**
1. Does target academic year already have active enrollment?
2. Check enrollment records for studentId + target academicYearId
3. Verify source enrollment status is "active"

### Issue: Notifications not received
**Check:**
1. Student/Parent has userId linked?
2. Notification service errors in console?
3. Check Notification collection in database
4. Verify notification types match frontend expectations

### Issue: Academic year filter not working
**Check:**
1. currentEnrollmentId populated on students?
2. Enrollment records have academicYearId populated?
3. Check API response for enrollment data
4. Verify filter logic in frontend

### Issue: Stream not displaying
**Check:**
1. Is student in Grade 11-12?
2. Is stream field populated in enrollment/class?
3. Check for both old ('natural') and new ('Natural Science') formats
4. Verify conditional rendering logic

---

## Test Sign-Off

**Tester Name:** _________________  
**Date:** _________________  
**Environment:** Development / Staging / Production  
**Overall Status:** Pass / Fail / Pass with Issues  

**Critical Issues Found:** _________________  
**Recommendations:** _________________  

**Approved for Production:** Yes / No  
**Approver Signature:** _________________

---

## Conclusion

This comprehensive test guide covers all enrollment system workflows including:
- ✅ Academic year management (CRUD, active, archive)
- ✅ Student enrollment (single, bulk, validation)
- ✅ Student promotion (bulk, stream selection, linking)
- ✅ Student transfer (section, stream, academic year)
- ✅ Multi-role visibility (admin, teacher, student, parent)
- ✅ Notifications (enrollment, promotion, transfer)
- ✅ Integration with existing modules (attendance, grades)
- ✅ Edge cases and validation
- ✅ Performance under load

**Next Steps:**
1. Execute all test cases systematically
2. Document any failures or issues
3. Fix critical issues before production deployment
4. Re-test after fixes
5. Obtain sign-off from stakeholders
6. Deploy to production with monitoring

**Support:** For issues during testing, contact the development team or refer to the technical documentation in API.md and model files.
