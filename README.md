# SCHOOL MANAGEMENT & FEE MANAGEMENT SYSTEM

## MASTER AI DEVELOPMENT PROMPT

You are the lead software architect, senior MERN developer, UI/UX engineer, security engineer, database designer, and Electron desktop application developer.

Build a complete production-quality **School Management & Fee Management System** using:

* React.js
* JavaScript / JSX
* Node.js
* Express.js
* MongoDB
* Mongoose
* Tailwind CSS
* Axios
* React Router
* Electron.js
* JWT authentication
* bcrypt/password hashing
* REST APIs

Do NOT use TypeScript unless absolutely unavoidable.

The final application must work as:

1. A normal React + Express web application.
2. A Windows desktop application packaged as `.exe` using Electron.js.

---

# 1. DEVELOPMENT RULES

Follow these rules throughout the entire project.

### Architecture

Use a clean modular architecture:

```text
school-management-system/

├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── routes/
│   │   └── App.jsx
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   └── server.js
│
├── electron/
│   ├── main.js
│   ├── preload.js
│   └── config.js
│
├── uploads/
├── docs/
├── .env.example
├── package.json
└── README.md
```

Do not create one giant React component.

Do not create one giant Express route.

Keep controllers, services, models, validation, authentication, and business logic separated.

---

# 2. UI/UX REQUIREMENTS

The application must have a simple but professional SaaS-level interface.

The design must NOT look like a basic student CRUD project.

Design principles:

* Clean
* Minimal
* Professional
* Fast
* Responsive
* Accessible
* Consistent
* Easy for non-technical school staff
* Desktop-first but responsive
* Excellent empty states
* Excellent loading states
* Excellent error states
* Clear confirmation dialogs
* Clear success/error notifications

Use Tailwind CSS.

Do not overuse gradients.

Do not overuse animations.

Use subtle transitions only.

Use a professional dashboard layout.

---

# 3. GLOBAL APPLICATION LAYOUT

Create:

```text
┌─────────────────────────────────────────────────────┐
│ Sidebar          │ Topbar                           │
│                  │                                   │
│ Dashboard        │ Page Title                       │
│ Students         │                                   │
│ Teachers         │ Main Content                      │
│ Classes          │                                   │
│ Sections         │                                   │
│ Fees             │                                   │
│ Payments         │                                   │
│ Challans         │                                   │
│ Reports          │                                   │
│ Promotions       │                                   │
│ Settings         │                                   │
│                  │                                   │
│ User Profile     │                                   │
└─────────────────────────────────────────────────────┘
```

Sidebar must support:

* Collapsed mode
* Expanded mode
* Active menu state
* Role-based menu visibility

Topbar:

* Page title
* Search where appropriate
* Notifications
* User profile
* Logout
* Current academic session

---

# 4. AUTHENTICATION

Implement secure authentication.

Roles:

### Super Admin

Full system access.

### School Admin

School management access.

### Accountant

Financial/fee-related access.

Use:

```text
JWT
bcrypt
HTTP-only cookies where appropriate
Role-based authorization
Protected routes
Server-side authorization
```

Never trust frontend role checks alone.

Every protected API endpoint must validate authorization on the server.

---

# 5. USER PERMISSIONS

Create permission middleware.

Example:

```text
Super Admin
    ↓
Everything

School Admin
    ↓
Students
Teachers
Classes
Sections
Subjects
Enrollments
Promotions
Fees
Reports

Accountant
    ↓
Fees
Payments
Challans
Receipts
Financial Reports
Student Fee History
```

Do not allow an accountant to modify system users unless explicitly permitted.

---

# 6. DATABASE DESIGN

Create separate MongoDB/Mongoose models.

Required initial models:

```text
User
Student
Teacher
AcademicSession
Class
Section
Subject
Enrollment
TeacherAssignment
```

Later models:

```text
FeeStructure
FeeInvoice
FeePayment
FeeChallan
FeeReceipt
PaymentTransaction
Promotion
Expense
Notification
AuditLog
SchoolSettings
```

---

# 7. STUDENT MODEL

Student should contain permanent information.

Example:

```text
Student
├── studentId
├── admissionNumber
├── grNumber
├── name
├── dateOfBirth
├── gender
├── photo
├── father
├── guardian
├── contact
├── address
├── previousSchool
├── previousClass
├── admissionDate
├── documents
├── status
└── timestamps
```

Important:

`grNumber` is OPTIONAL.

Do not require GR Number.

Student ID and admission number should support unique constraints.

---

# 8. ENROLLMENT MODEL

Do NOT permanently store the student's current class as the historical source of truth.

Use:

```text
Student
   ↓
Enrollment
   ↓
Academic Session
   ↓
Class
   ↓
Section
```

Example:

```text
2025-26 → Grade 7 → A
2026-27 → Grade 8 → B
2027-28 → Grade 9 → A
```

This is essential for historical reporting.

Enrollment should include:

```text
student
academicSession
class
section
rollNumber
enrollmentDate
status
```

---

# 9. ACADEMIC SESSION

Create academic sessions such as:

```text
2025-26
2026-27
2027-28
```

Admin can:

* Create session
* Edit session
* Activate session
* Close session
* Set current session

Only one session should normally be marked active.

Do not delete historical sessions casually.

---

# 10. CLASS MANAGEMENT

Admin can:

* Create class
* Edit class
* Activate/deactivate class
* Set class ordering

Examples:

```text
Play Group
Nursery
KG
Grade 1
Grade 2
Grade 3
...
Grade 10
```

Do not hard-code class names.

---

# 11. SECTION MANAGEMENT

A class can contain multiple sections.

Example:

```text
Grade 5
├── A
├── B
└── C
```

Section model:

```text
name
class
capacity
classTeacher
status
```

The same section name may exist under different classes.

Example:

```text
Grade 5 → A
Grade 6 → A
Grade 7 → A
```

These are different sections.

---

# 12. TEACHER MANAGEMENT

Teacher profile:

```text
teacherId
name
fatherName
cnic
phone
email
address
qualification
joiningDate
photo
documents
status
```

Teacher assignments must be separate.

Example:

```text
Teacher
    ↓
TeacherAssignment
    ├── Academic Session
    ├── Class
    ├── Section
    ├── Subject
    └── Is Class Teacher
```

A teacher can teach:

```text
Mathematics → Grade 8-A
Mathematics → Grade 8-B
Mathematics → Grade 9-A
```

A teacher may also be designated as class teacher.

---

# 13. SUBJECT MANAGEMENT

Create subject management.

Fields:

```text
name
code
description
status
```

Examples:

```text
Mathematics
English
Urdu
Science
Computer
Physics
Chemistry
Biology
Islamiyat
Pakistan Studies
```

Do not hard-code subjects.

---

# 14. TEACHER TIMETABLE

Create the architecture for teacher timetable.

Allow:

```text
Teacher
Day
Start Time
End Time
Class
Section
Subject
Room
```

Example:

```text
Monday
09:00 - 10:00
Grade 8-A
Mathematics
Room 4
```

Keep timetable modular so it can be expanded later.

---

# 15. STUDENT REGISTRATION UI

Create a professional multi-step enrollment form.

Step 1:

```text
Basic Information
```

Step 2:

```text
Parent / Guardian
```

Step 3:

```text
Contact & Address
```

Step 4:

```text
Previous Education
```

Step 5:

```text
Academic Enrollment
```

Step 6:

```text
Documents
```

Step 7:

```text
Review & Submit
```

Use validation on both frontend and backend.

---

# 16. STUDENT LIST

Create:

* Search
* Filter
* Pagination
* Class filter
* Section filter
* Academic session filter
* Status filter
* Export
* View
* Edit
* Delete/archive

Table:

```text
Student ID
Admission No.
Name
Father Name
Class
Section
Phone
Status
Actions
```

Do not load thousands of records unnecessarily.

Use server-side pagination.

---

# 17. STUDENT PROFILE

Create a professional student profile.

Tabs:

```text
Overview
Enrollment
Fees
Payments
Documents
History
```

Student profile should show:

```text
Current Class
Current Section
Academic Session
Outstanding Balance
Last Payment
Enrollment Status
```

---

# 18. STUDENT PROMOTION

Create a promotion module.

Example:

```text
2025-26
Grade 5-A

       ↓ PROMOTE

2026-27
Grade 6-B
```

Allow:

* Individual promotion
* Bulk promotion
* Select destination class
* Select destination section
* Promote multiple students
* Repeat students
* Transfer students
* Graduation

Never overwrite historical enrollment.

---

# 19. FEE MANAGEMENT

Create flexible fee structures.

Fee types:

```text
Monthly Tuition
Admission Fee
Annual Fee
Exam Fee
Transport Fee
Computer Fee
Lab Fee
Other Fee
Fine
Discount
```

Admin should be able to create custom fee types.

---

# 20. MONTHLY FEE

Monthly fee system must support:

```text
Student
Class
Section
Academic Session
Month
Fee Components
Previous Balance
Discount
Fine
Total
Due Date
Status
```

Statuses:

```text
Unpaid
Partially Paid
Paid
Overdue
Cancelled
```

---

# 21. PREVIOUS BALANCE

If a student has unpaid fees:

```text
August Outstanding = Rs. 5,000
September Fee = Rs. 5,000
```

September invoice:

```text
Previous Balance = Rs. 5,000
Current Fee = Rs. 5,000
Total = Rs. 10,000
```

Do not duplicate balances incorrectly.

Use a reliable ledger/invoice calculation.

---

# 22. EXAM FEE

Exam fees must be independent fee components.

Example:

```text
September Tuition = Rs. 5,000
Mid-Term Exam = Rs. 1,000
Previous Balance = Rs. 2,000

Total = Rs. 8,000
```

Allow exam fee to be assigned by:

* Class
* Student
* Session
* Exam type

---

# 23. FEE INVOICE

Generate unique invoice numbers.

Example:

```text
INV-2026-000001
INV-2026-000002
```

Invoice should contain:

```text
School Name
Invoice Number
Student ID
Admission Number
Student Name
Father Name
Class
Section
Academic Session
Fee Month
Fee Components
Previous Balance
Discount
Fine
Total
Due Date
Status
```

---

# 24. CHALLAN SYSTEM

Generate printable fee challans.

Challan number:

```text
CHL-2026-000001
```

Allow:

```text
View Challan
Download PDF
Print Challan
Regenerate Challan
```

Do not create duplicate challan numbers.

---

# 25. PAYMENT SYSTEM

Support:

```text
Cash
Bank Transfer
Easypaisa
JazzCash
Other
```

Payment record:

```text
receiptNumber
invoice
student
amount
paymentMethod
transactionId
paymentDate
receivedBy
notes
```

---

# 26. PARTIAL PAYMENTS

Support partial payment.

Example:

```text
Invoice = Rs. 10,000

Payment 1 = Rs. 4,000
Payment 2 = Rs. 3,000
Payment 3 = Rs. 3,000
```

Invoice becomes:

```text
Paid = Rs. 10,000
Remaining = Rs. 0
Status = Paid
```

Do not mark an invoice paid until the actual balance reaches zero.

---

# 27. RECEIPT SYSTEM

After successful payment generate:

```text
REC-2026-000001
```

Receipt must contain:

```text
School Name
Receipt Number
Student
Admission Number
Class
Section
Payment Date
Payment Method
Transaction ID
Paid Amount
Remaining Balance
Received By
```

Allow:

```text
Print
Download PDF
```

---

# 28. EASYPaisa AND JAZZCASH

Implement payment gateways through a dedicated payment service.

Architecture:

```text
Frontend
   ↓
Payment API
   ↓
Payment Service
   ↓
Easypaisa / JazzCash
   ↓
Gateway Response / Callback
   ↓
Verify Transaction
   ↓
Payment Transaction
   ↓
Fee Payment
   ↓
Receipt
```

Do NOT use unofficial APIs.

Do NOT fake successful payments.

Use environment variables:

```text
EASYPAISA_MERCHANT_ID
EASYPAISA_SECRET
EASYPAISA_API_URL

JAZZCASH_MERCHANT_ID
JAZZCASH_PASSWORD
JAZZCASH_INTEGRITY_SALT
JAZZCASH_API_URL
```

Keep gateway implementations isolated so they can be replaced or updated without modifying the fee system.

If official merchant credentials/API documentation are unavailable during development, create a clean payment-provider interface and a mock/sandbox provider for development.

Do not pretend that the mock provider is a real payment gateway.

---

# 29. REPORTING SYSTEM

Create a dedicated reports module.

Reports:

```text
Daily Collection
Monthly Collection
Student Fee Ledger
Outstanding Fees
Paid Fees
Unpaid Fees
Partial Payments
Class-wise Collection
Section-wise Collection
Exam Fee Collection
Discount Report
Fine Report
Payment Method Report
Easypaisa Transactions
JazzCash Transactions
Accountant Collection
```

Every report should support:

```text
Search
Filter
Date range
Academic session
Class
Section
Export Excel
Export PDF
Print
```

---

# 30. EXCEL EXPORT

Generate real `.xlsx` files.

Use proper columns.

Example:

```text
Student ID
Admission Number
Student Name
Class
Section
Fee Month
Invoice
Amount
Paid
Remaining
Payment Method
Payment Date
Status
```

Do not generate CSV and rename it `.xlsx`.

---

# 31. PDF EXPORT

Generate professional A4 PDFs.

PDFs should have:

```text
School Logo
School Name
School Address
Report Title
Generated Date
Filters
Table
Totals
Footer
Page Numbers
```

Avoid text overflow.

Use proper pagination.

---

# 32. DASHBOARD

Create role-specific dashboards.

Super Admin:

```text
Total Students
Total Teachers
Total Classes
Total Sections
This Month Collection
Outstanding Fees
Today's Collection
Recent Payments
```

School Admin:

```text
Students
Teachers
Classes
Sections
Fees
Recent Admissions
```

Accountant:

```text
Today's Collection
Monthly Collection
Outstanding
Pending Invoices
Recent Payments
Payment Methods
```

Use charts only where useful.

Do not overload the dashboard.

---

# 33. SEARCH

Create global/local search where useful.

Student search should support:

```text
Student Name
Student ID
Admission Number
GR Number
Father Name
Phone
```

Search must be server-side for large datasets.

---

# 34. NOTIFICATIONS

Create notification system.

Examples:

```text
Fee Payment Successful
New Student Added
Outstanding Fee
Payment Failed
Promotion Completed
```

Use toast notifications for immediate actions.

Use persistent notifications only when useful.

---

# 35. AUDIT LOG

Create audit logs.

Track important actions:

```text
User
Action
Module
Record ID
Old Data
New Data
IP
Timestamp
```

Examples:

```text
Admin changed student class
Accountant recorded payment
Admin deleted fee invoice
Admin promoted students
```

Sensitive actions should be logged.

---

# 36. SECURITY

Implement:

```text
Helmet
CORS configuration
Rate limiting
Input validation
MongoDB query protection
Password hashing
JWT protection
Role authorization
Secure cookies where applicable
File upload validation
File size limits
Error handling
Audit logs
```

Never return passwords.

Never store plaintext passwords.

Never expose secrets in frontend code.

Use:

```text
.env
.env.example
```

---

# 37. FILE UPLOADS

Student/teacher documents should support:

```text
JPG
JPEG
PNG
PDF
```

Validate:

* MIME type
* Extension
* File size

Do not allow arbitrary executable uploads.

---

# 38. ERROR HANDLING

Create centralized backend error handling.

API responses should have consistent format:

```json
{
  "success": false,
  "message": "Student not found",
  "data": null
}
```

Success:

```json
{
  "success": true,
  "message": "Student created successfully",
  "data": {}
}
```

---

# 39. API DESIGN

Use RESTful APIs.

Example:

```text
/api/auth
/api/users
/api/students
/api/teachers
/api/classes
/api/sections
/api/subjects
/api/sessions
/api/enrollments
/api/promotions
/api/fee-structures
/api/invoices
/api/payments
/api/challans
/api/receipts
/api/reports
/api/settings
```

Use appropriate HTTP methods:

```text
GET
POST
PUT/PATCH
DELETE
```

---

# 40. ELECTRON DESKTOP APPLICATION

Use Electron.js as the desktop shell.

Electron should:

* Open the React application
* Handle desktop window
* Provide secure preload bridge where required
* Disable unsafe Node integration in renderer
* Use context isolation
* Support Windows packaging
* Provide application icon
* Provide application name
* Provide version number
* Support installer creation

Security configuration should follow Electron security best practices.

Do not expose unrestricted Node.js APIs to React.

---

# 41. WINDOWS BUILD

Configure packaging for:

```text
Windows
```

Generate:

```text
SchoolManagementSetup.exe
```

and, where appropriate:

```text
SchoolManagement.exe
```

The installer should support:

* Installation
* Desktop shortcut
* Start menu shortcut
* Uninstallation

Keep Electron packaging configuration in the project.

---

# 42. DATABASE CONFIGURATION

Use environment variables.

Example:

```env
NODE_ENV=development
PORT=5000

MONGO_URI=mongodb://localhost:27017/school_management

JWT_SECRET=change_this_secret

CLIENT_URL=http://localhost:5173
```

Never hard-code production credentials.

Support MongoDB Atlas.

---

# 43. SEED DATA

Create a development seed script.

Seed:

```text
Super Admin
School Admin
Accountant

Academic Session
Classes
Sections
Subjects

Sample Teachers
Sample Students
Sample Enrollments
Sample Fee Structures
```

Use obviously fake development data.

Never seed real credentials.

---

# 44. VALIDATION

Frontend validation:

```text
Required fields
Email
Phone
Dates
Numbers
File types
```

Backend validation must repeat critical validation.

Never rely only on React validation.

---

# 45. IMPORTANT BUSINESS RULES

Implement these carefully.

### Student

Student ID must be unique.

Admission number must be unique.

GR number is optional but must be unique when supplied.

### Enrollment

A student should not have two active enrollments for the same academic session.

### Section

A section belongs to a specific class.

### Teacher

Teacher assignments must reference valid:

```text
Academic Session
Class
Section
Subject
```

### Promotion

Promotion creates a new enrollment.

It does NOT overwrite old enrollment.

### Fees

Payments must not exceed the outstanding amount unless explicitly supporting advance payments.

### Invoice

Paid invoices should not be casually deleted.

Use cancellation/reversal mechanisms.

### Payment

Every payment should have a unique receipt number.

Gateway transactions must have unique transaction references.

---

# 46. SOFT DELETE

For important records, prefer:

```text
status: active/inactive/archived
```

instead of permanent deletion.

Especially for:

```text
Students
Teachers
Invoices
Payments
Academic Sessions
```

Financial records should be immutable or reversal-based wherever practical.

---

# 47. RESPONSIVE DESIGN

Desktop:

```text
Sidebar + Content
```

Tablet:

```text
Collapsible Sidebar
```

Mobile:

```text
Drawer Navigation
```

Tables should become horizontally scrollable or transform into useful cards.

---

# 48. ACCESSIBILITY

Use:

```text
Proper labels
Keyboard navigation
Focus states
Accessible buttons
Readable contrast
ARIA where appropriate
```

Do not make important information dependent on color alone.

---

# 49. PERFORMANCE

Use:

```text
Pagination
Debounced search
Lazy loading
Memoization where justified
Optimized queries
MongoDB indexes
Proper API response sizes
```

Do not load all students at once.

Create indexes for frequently searched fields.

---

# 50. DOCUMENTATION

Create:

```text
README.md
docs/
```

Documentation must explain:

```text
Installation
Environment variables
MongoDB setup
Development commands
Production commands
Electron commands
Build commands
Database seeding
API structure
Roles
Permissions
Deployment
Backup
Restore
```

---

# 51. TESTING

Implement meaningful tests for critical business logic.

At minimum test:

```text
Authentication
Authorization
Student creation
Enrollment
Promotion
Fee calculation
Previous balance
Partial payment
Invoice status
Receipt generation
Payment transaction validation
```

Do not claim something is tested if it was not actually tested.

---

# 52. DEVELOPMENT PHASES

IMPORTANT:

DO NOT build everything at once.

Work phase-by-phase.

After each phase:

1. Implement it.
2. Run the application.
3. Test it.
4. Fix errors.
5. Review architecture.
6. Confirm database relationships.
7. Only then move to the next phase.

Never silently skip a phase.

---

# PHASE 1 — PROJECT FOUNDATION

Build:

```text
React
Express
MongoDB
Mongoose
Tailwind
Electron
Axios
Routing
Environment configuration
Folder structure
Global error handling
Basic API
```

Create:

```text
Login
```

and the main application shell.

Deliver:

```text
Working React frontend
Working Express backend
MongoDB connection
Electron window
```

---

# PHASE 2 — AUTHENTICATION & ROLES

Implement:

```text
Login
Logout
JWT
Password hashing
Role middleware
Protected routes
User management
```

Roles:

```text
Super Admin
School Admin
Accountant
```

Test every role.

---

# PHASE 3 — ACADEMIC STRUCTURE

Implement:

```text
Academic Sessions
Classes
Sections
Subjects
```

Relations must work correctly.

Example:

```text
2026-27
  ├── Grade 5
  │    ├── A
  │    ├── B
  │    └── C
```

---

# PHASE 4 — TEACHERS

Implement:

```text
Teacher CRUD
Teacher profile
Subject assignment
Class assignment
Section assignment
Class teacher
Teacher timetable
```

---

# PHASE 5 — STUDENTS

Implement:

```text
Student registration
Student ID
Admission number
Optional GR number
Parent/guardian
Contact
Address
Previous school
Documents
Photo
Enrollment
```

---

# PHASE 6 — PROMOTION

Implement:

```text
Promotion
Bulk promotion
Individual promotion
Repeat
Transfer
Graduation
Session history
```

Verify historical enrollment remains unchanged.

---

# PHASE 7 — FEE STRUCTURE

Implement:

```text
Fee types
Monthly fee
Exam fee
Annual fee
Custom fee
Discount
Fine
```

---

# PHASE 8 — INVOICES & CHALLANS

Implement:

```text
Fee invoices
Previous balances
Due dates
Challans
Challan numbers
PDF
Print
```

---

# PHASE 9 — PAYMENTS & RECEIPTS

Implement:

```text
Cash
Bank
Easypaisa architecture
JazzCash architecture
Partial payment
Payment history
Receipt
PDF
Print
```

Gateway integration must use official provider documentation/credentials.

---

# PHASE 10 — REPORTING

Implement:

```text
Collection reports
Outstanding reports
Student ledger
Class reports
Section reports
Exam fee reports
Payment reports
```

Add:

```text
Excel
PDF
Print
```

---

# PHASE 11 — DASHBOARD & ANALYTICS

Create role-specific dashboards.

Use clean charts and KPIs.

Avoid unnecessary visual clutter.

---

# PHASE 12 — AUDIT & SECURITY

Implement:

```text
Audit logs
Rate limiting
Security headers
Input validation
File validation
Permission review
Error handling
```

---

# PHASE 13 — ELECTRON PRODUCTION BUILD

Configure:

```text
electron-builder
Windows installer
Application icon
Version
Auto-update architecture if appropriate
```

Generate a working `.exe`.

---

# PHASE 14 — FINAL QA

Perform a complete workflow test:

```text
Login
↓
Create academic session
↓
Create classes
↓
Create sections
↓
Create subjects
↓
Create teacher
↓
Assign teacher
↓
Register student
↓
Enroll student
↓
Create fee structure
↓
Generate monthly invoice
↓
Generate challan
↓
Record payment
↓
Generate receipt
↓
View fee history
↓
Promote student
↓
Generate reports
↓
Export Excel
↓
Export PDF
↓
Build Electron EXE
```

Fix all discovered problems before declaring the project complete.

---

# 53. IMPORTANT AI CODING RULES

When you modify existing code:

* First inspect the existing architecture.
* Do not unnecessarily rewrite working code.
* Do not duplicate components.
* Reuse existing utilities.
* Preserve working features.
* Explain breaking changes.
* Update related API/frontend code together.

When you encounter an error:

1. Identify the root cause.
2. Fix the actual cause.
3. Run the relevant test.
4. Check for regression.
5. Continue.

Do not hide errors with empty catch blocks.

Do not use fake data in production functionality.

Do not create placeholder buttons that appear functional but do nothing.

If a feature cannot yet be implemented because an external API credential/documentation is missing, build the correct interface/service abstraction and clearly mark the external integration as pending.

---

# 54. DESIGN QUALITY STANDARD

The final UI should feel like a modern SaaS product.

Use:

* Consistent spacing
* Consistent typography
* Clear hierarchy
* Professional tables
* Modern forms
* Clean cards
* Good empty states
* Skeleton loaders
* Toast notifications
* Confirmation dialogs
* Responsive layouts
* Accessible controls

Avoid:

* Excessive gradients
* Excessive shadows
* Giant text
* Unnecessary animations
* Crowded dashboards
* Random colors
* Inconsistent buttons
* Inconsistent spacing
* Huge forms without sections

---

# 55. FINAL REQUIREMENT

At the end of every development phase, provide:

```text
PHASE:
What was implemented:
Files created:
Files modified:
Database models:
API endpoints:
Frontend pages:
Tests performed:
Known issues:
Next phase:
```

Do not proceed to the next phase if the current phase has critical errors.

Start with **PHASE 1 only**.

First inspect the current project directory.

If a project already exists, preserve useful existing work instead of rebuilding unnecessarily.

Then implement Phase 1 completely and test it before moving forward.
