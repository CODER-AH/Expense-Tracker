# Changelog

All notable changes to the Coorg Trip Expense Tracker project.

## [Unreleased] - 2026-03-27

### Added
- **Payment Tracking System**: Record and confirm payments between users
  - Record payments with amount, payment method (GPay/PhonePe/Paytm/Cred/Cash/Other), and optional note
  - Recipients can confirm or reject pending payments
  - Confirmed payments automatically adjust settlement amounts
  - Payment history with full audit trail
  - Three-state workflow: pending → confirmed/rejected
  - Soft delete preserves payment records for audit
- **Admin System**: Role-based access control with admin flag in Firebase users collection
  - Only admins can permanently delete archived expenses
  - Admin status checked on login and verified from Firebase
- **Hamburger Menu Navigation**: Sidebar navigation with on-demand section loading
  - Lazy loading for notes and archived sections improves performance
  - Section state persists across page reloads
- **Notes Enhancements**:
  - Bulk complete and bulk delete with confirmation dialogs
  - Custom styled radio buttons matching app theme
  - Notes sorted newest first automatically
  - Read-only mode for completed notes (no edit/delete/multi-select)
  - "Show more" button for truncated note text
- **Pagination**: Added to notes and archived sections (10 items per page)
- **Mobile Padding Fix**: Content now has 16px margins on mobile (tiles no longer touch edges)

### Changed
- **Navigation Header**: Changed to "💰 Expense Hub"
- **Archived Actions**: Unarchive and delete buttons combined in single centered column
- **Completed Notes Visibility**: Text color changed from low opacity to readable muted green-gray (#8a9d92)
- **Notes Layout**: Radio buttons and checkboxes vertically centered with entire note content
- **Expense Sorting**: Time-based sorting now considers day first, then timestamp within day
  - DESC order: Day 2 → Day 1, newest first within each day
  - ASC order: Day 1 → Day 2, oldest first within each day

### Fixed
- Section state restoration after page reload
- Hamburger menu visibility sync with scroll behavior
- Strike-through effect only applies to note text, not metadata (added by, time)
- Newly added notes appear at top immediately (no reload needed)
- Loader messages specific to each section (expenses, notes, archived)
- Archived table header colspan adjusted for single actions column

### Removed
- Expand/collapse functionality from sections (navigation provides separate pages)
- Duplicate section-specific loaders (using single main page loader)
- Unnecessary console.log statements throughout the codebase
- Debug logging from sorting, pagination, and admin checks

### Technical
- Implemented Firebase Timestamp for proper note sorting
- Added `isAdmin` flag with sessionStorage caching
- Created confirmation overlays for bulk operations
- Enhanced sorting algorithm with day-aware timestamp comparison
- Added `dbIsAdmin()` function in db-layer.js
- Custom radio button styling with CSS appearance override

## [Previous] - 2026-03-26

### Added
- Custom styled dropdowns replacing native select elements across all forms
- Modular code structure with separate CSS and JavaScript files
- Enhanced mobile responsiveness with adaptive layouts
- Consistent placeholder text across single and multi-row entry forms

### Changed
- Increased section width from 860px to 1000px for better laptop viewing
- Settlement cards now display in 2x2 grid layout (2 per row)
- Description field placeholder updated to "e.g. Masala Dosa at Mylari" in both single and multi-row forms
- Delete button column width reduced from 60px to 40px to prevent overflow

### Fixed
- Delete button overflow in add multiple items section
- Day dropdown selection issue in add row section
- Tile alignment in summary and settlement sections (centered when fewer items)
- Mobile layout overflow issues with dynamic width handling
- Dropdown visibility clipping in expense sections
- Missing Google Fonts (Playfair Display, DM Mono, DM Sans)
- Dropdown width sizing for better content fit

### Technical
- Reorganized codebase from monolithic 3271-line HTML into:
  - `index.html` (431 lines) - structure
  - `styles.css` (1107 lines) - all styles
  - `app.js` (1731 lines) - all logic
- Implemented custom dropdown component system with JavaScript state management
- Added responsive overflow handling for medium screens (641-900px)
- Single-column layout for mobile screens (<640px)

## Previous Releases

### Feature Branches Merged
- Column-based sorting functionality
- Inline edit improvements
- Settlement calculator
- Filter by name with 300 character description limit
- Budget tracking integration

---

For deployment instructions and feature documentation, see [README.md](README.md)
