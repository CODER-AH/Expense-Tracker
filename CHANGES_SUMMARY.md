# Release Notes - Coorg Trip Expense Tracker

## Latest Updates (v2.0) - Current

### Major Features

#### Multi-Row Expense Entry
- **Add multiple expenses in batch**: Click "Add Row" to stage expenses, then "Save All" at once
- **Clear All option**: Discard staged rows without saving
- **Individual row removal**: Remove specific rows before saving
- **Pre-filled values**: Form values carry over to new rows for faster entry
- **Visual feedback**: Multi-row section appears/disappears automatically

#### Advanced Table Features
- **Pagination**: View 10 entries per page with numbered page navigation
- **Column sorting**: Click any column header to sort ascending/descending
  - Supported columns: Description, Category, Added By, Paid By, Time, Amount
  - Visual indicators (▲/▼) show current sort direction
- **Person filtering**: Dropdown to view expenses from specific people
- **Smart time sorting**: Fixed to properly compare timestamps

#### Inline Editing
- **Edit in place**: Click ✏️ to edit directly in the table row
- **User restriction**: Only edit expenses you added
- **Edit tracking**: Visual "EDITED" badge on modified entries
- **Save/Cancel actions**: ✅ to save, ❌ to cancel changes

#### Settlement Calculator
- **Automatic split**: Divides total equally among all 4 participants
- **Minimum transactions**: Uses greedy algorithm to calculate fewest transfers
- **Balance display**: Shows how much each person paid vs their share
- **Action items**: Clear "owes" or "gets" indicators per person

#### UI/UX Improvements
- **Description truncation**: Long descriptions show 3 lines with "Show more" button
- **Consistent dropdown arrows**: Fixed positioning across all select elements
- **Edit badge placement**: EDITED label now appears before description (visible even when truncated)
- **Larger sort icons**: Increased size for better visibility
- **Loading overlay**: Full-screen spinner during initial data fetch
- **Toast notifications**: User feedback for all actions (add, edit, delete)

### Backend Updates (Google Apps Script v2)

#### New Columns
- **Name** (Column C): Tracks who added each expense
- **Edited** (Column I): Flags modified entries

#### Enhanced Functions
- `updateExpense()`: Full edit support with timestamp and edit flag updates
- `getAllExpenses()`: Returns complete expense data including edit status
- `addExpense()`: Saves name and paid-by information
- Color-coded categories in Google Sheets for visual clarity

### Bug Fixes
- ✅ Fixed column mapping between frontend and Google Sheets
- ✅ Fixed time sorting to properly handle date comparisons
- ✅ Fixed dropdown styling inconsistencies (white backgrounds, misaligned arrows)
- ✅ Removed duplicate setBusy function and isBusy state variable
- ✅ Fixed description character limit (now unlimited with truncation)

### GitHub Integration
- ✅ Repository configured as public
- ✅ Main branch protection enabled
- ✅ Code owners set (@CODER-AH)
- ✅ GitHub Pages deployment active
- ✅ Feature branch workflow (feature/pagination-and-fixes)

---

## Previous Version (v1.0) - Initial Release

### Core Features
- Basic expense tracking (add/delete)
- Google Sheets sync
- localStorage backup
- Category-based organization
- Day-wise tracking (Day 1, Day 2)
- User name prompt on first visit
- Dark theme UI
- Mobile responsive design

### Initial Categories
- Fuel, Food, Stay, Transport, Entry Fees, Miscellaneous

### Backend
- Google Apps Script web app
- Basic CRUD operations
- Sheet auto-creation with headers

---

## Deployment Notes

### To Update Your Deployment:

#### Google Apps Script:
1. Open your Apps Script project
2. Paste contents from `GoogleAppsScript_v2_UPDATE_THIS.gs`
3. Deploy → Manage Deployments → Edit → New Version → Deploy
4. Copy the Web App URL

#### Frontend (index.html):
1. Update `SCRIPT_URL` constant (around line 1120) with your Apps Script URL
2. Commit and push to main branch
3. GitHub Pages will auto-deploy

### Current Branch Structure:
- `main`: Production-ready code
- `feature/pagination-and-fixes`: Latest updates (multi-row, pagination, sorting)

---

## Known Limitations

1. **User restrictions**: Users can only edit/delete their own expenses (by design)
2. **Pagination per day**: Each day maintains its own page state
3. **Local storage dependency**: Offline mode requires browser localStorage
4. **Edit history**: Only shows if edited, not full edit history
5. **Settlement assumes equal split**: All participants split equally (no custom splits)

---

## Future Considerations

- Export to CSV/Excel
- Receipt photo uploads
- Custom split percentages
- Multi-trip support
- Edit history log
- Expense search/filter by description
- Date range filtering
- Category-wise settlement option

---

## Technical Details

### File Structure:
```
index.html                          - 2000+ lines, self-contained SPA
GoogleAppsScript_v2_UPDATE_THIS.gs  - 148 lines, backend API
README.md                           - Updated documentation
CHANGES_SUMMARY.md                  - This file
.gitignore                          - Standard git ignores
.github/CODEOWNERS                  - @CODER-AH as owner
```

### Dependencies:
- Google Fonts (DM Sans, DM Mono, Playfair Display)
- Google Apps Script runtime
- Google Sheets API (via Apps Script)

### Browser Compatibility:
- Chrome, Firefox, Safari (latest versions)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled
- localStorage support needed for offline mode

---

## Version History

| Version | Date | Branch | Key Changes |
|---------|------|--------|-------------|
| v2.0 | 2024-03 | feature/pagination-and-fixes | Multi-row entry, pagination, sorting, inline editing, settlement |
| v1.0 | 2024-02 | main | Initial release with basic tracking |

---

Last Updated: March 2024
