# Changelog

All notable changes to the Coorg Trip Expense Tracker project.

## [2.0.0] - 2026-03-27

### Added
- **Payment Tracking System**: Complete payment confirmation workflow
  - Record payments with amount, payment method (GPay/PhonePe/Paytm/Cred/Cash/Other), and optional note
  - Recipients can confirm or reject pending payments with reasons
  - Confirmed payments automatically adjust settlement amounts
  - Payment history with full audit trail and timestamps
  - Three-state workflow: pending → confirmed/rejected
  - Duplicate payment prevention and partial payment support
  - Time-relative display (just now, X mins ago, X hours ago, X days ago)
- **Minimal Transaction Algorithm**: Greedy algorithm for optimal settlement calculations
  - Sorts by largest amounts first for efficient matching
  - Reduces total number of transactions needed
  - Accounts for both confirmed and pending payments
- **Navigation Reorganization**: Updated section order for better UX
  1. Dashboard
  2. Expenses
  3. Settlements
  4. Payments
  5. Notes
  6. Archived Expenses
- **Consistent Section Titles**: All section titles match navigation labels exactly
- **Admin System**: Role-based access control with admin flag
- **Custom Authentication**: Username/password system with SHA-256 hashing

### Changed
- **Settlement Calculation**: Now includes expenses from all days, not just tripDays array
  - Fixed bug where day 3+ expenses were excluded
  - Uses `Object.values(expenses)` for complete data coverage
- **Payment Section Settlements**: Accounts for pending payments to show remaining amounts
- **Settlement Section**: Shows single "Go to Payments →" button instead of per-transaction buttons
- **Button Labels**:
  - Settlement navigation changed from "Settlement" to "Settlements"
  - Archived changed from "Archived" to "Archived Expenses"
  - Dashboard label updated from "Insights" to "Dashboard"
- **Notes Completion**: Timestamp format now uses localized format (e.g., "27 Mar, 10:02 AM") instead of ISO string
- **Toast Notifications**: All alerts replaced with consistent toast messages (green for success, red for errors)
- **Async Rendering**: `render()` function now async, properly awaits `updateSettlement()`

### Fixed
- **Settlement Amount Discrepancy**: Both Payments and Settlements now show identical amounts
  - Fixed missing sorting in `calculateSettlements()` algorithm
  - Both sections use same greedy algorithm with amount-based sorting
- **Data Loading Issue**: Fixed non-existent `loadFromDB()` calls replaced with `loadFromSheet()`
- **Cache Invalidation**: Expenses cache cleared on navigation to Settlements/Dashboard
- **Notes Timestamp Bug**: Bulk complete now uses formatted timestamps instead of ISO strings
- **Payment Button Text**: Changed from "Payment Pending" to "Awaiting Confirmation"
- **Go to Payments Button**: Shows for all users with settlements (not just those who owe)

### Technical
- Modular file structure:
  - `payments.js` - Payment tracking logic
  - `firebase-payments.js` - Payment Firestore operations
  - `multi-select.js` - Multi-select functionality
- Session-based data reloading for Payments, Settlements, and Dashboard
- Fixed expense iteration to use all days in expenses object
- Consolidated settlement algorithm with consistent sorting
- Added payment cache invalidation on load

### Documentation
- Updated README with correct navigation order
- Removed outdated documentation files:
  - CHANGES_SUMMARY.md
  - CODE_ORGANIZATION.md
  - FIREBASE_SECURITY_RULES.md (replaced by FIRESTORE_RULES.md)
  - FIREBASE_STATUS.md
  - REFACTORING_*.md files
  - SECURITY_*.md files
- Kept essential docs:
  - CHANGELOG.md
  - DEPLOYMENT.md
  - FIRESTORE_RULES.md
  - THREE_STATE_SYSTEM.md

## [1.0.0] - 2026-03-26

### Added
- Custom styled dropdowns replacing native select elements
- Modular code structure with separate files
- Enhanced mobile responsiveness
- Notes with multi-select operations
- Pagination for notes and archived sections
- Hamburger menu navigation with lazy loading

### Changed
- Increased section width to 1000px
- Settlement cards in 2x2 grid layout
- Mobile padding and layout improvements

### Fixed
- Dropdown visibility and positioning
- Tile alignment in summary sections
- Mobile layout overflow issues

### Technical
- Reorganized from monolithic HTML to modular structure
- Firebase Firestore integration
- Google Sheets backup system
- Three-state architecture (Active/Archived/Deleted)

---

For deployment instructions and feature documentation, see [README.md](../README.md)

