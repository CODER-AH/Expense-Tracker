# Changelog

All notable changes to the Coorg Trip Expense Tracker project.

## [Unreleased] - 2026-03-26

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
