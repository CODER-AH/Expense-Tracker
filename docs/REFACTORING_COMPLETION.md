# JavaScript Refactoring - Completion Instructions

## ✅ Completed Modules (4/7)

1. ✅ **config.js** - Configuration and global state
2. ✅ **auth.js** - Authentication and profile management
3. ✅ **data.js** - Data loading and localStorage
4. ✅ **ui.js** - UI components, filters, sort, pagination, budget

## 🚧 Remaining Work (3 modules + integration)

### 5. render.js - TO CREATE
Extract from app.js lines ~1064-1286:
- `render()` - main expense table rendering
- `renderArchived()` - archived expenses table
- `renderNotes()` - notes list
- `updateSummary()` - summary cards
- `updateSettlement()` - settlement calculations

### 6. expenses.js - TO CREATE
Extract from app.js:
- Batch add functions (showBatchAddDialog, renderBatchAddRows, saveBatchExpense)
- Inline edit functions (startInlineEdit, confirmInlineEdit, cancelInlineEdit)
- Delete/archive functions (showDeleteConfirm, deleteExpense, archiveExpense, unarchiveExpense)
- Multi-select functions (toggleMultiSelect, toggleExpenseSelection, bulkArchiveExpenses)
- Notes CRUD (showAddNoteDialog, addNote, deleteNote, etc.)
- Lazy loading functions (loadArchivedExpenses, loadNotes)

### 7. init.js - TO CREATE
Extract from app.js lines ~163-202 and ~1733-1792:
- `window.onload` initialization
- All `document.addEventListener('DOMContentLoaded', ...)` blocks
- Event listeners for Enter keys
- Click-outside handlers

### 8. Update index.html
Replace current script tags with modular loads:

```html
<!-- Firebase & Database -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics-compat.js"></script>

<!-- Core Services -->
<script src="config.js"></script>
<script src="firebase-service.js"></script>
<script src="db-layer.js"></script>

<!-- Application Modules -->
<script src="js/config.js"></script>
<script src="js/auth.js"></script>
<script src="js/data.js"></script>
<script src="js/ui.js"></script>
<script src="js/render.js"></script>
<script src="js/expenses.js"></script>

<!-- Initialization (must be last) -->
<script src="js/init.js"></script>
```

### 9. Remove old app.js
Once all modules are created and tested, delete the old app.js file.

## Quick Reference - What Goes Where

**render.js**:
- All table/list rendering functions
- Summary calculations
- Settlement calculations

**expenses.js**:
- All CRUD operations for expenses and notes
- Batch add modal
- Inline editing
- Multi-select operations
- Archive/unarchive
- Delete operations

**init.js**:
- `window.onload`
- All `DOMContentLoaded` handlers
- Event listener setup
- Initial authentication check

## Testing Checklist

After completing the refactoring:
- [ ] Login/logout works
- [ ] Add expense works (batch add)
- [ ] Edit expense works
- [ ] Delete/archive works
- [ ] Filters work (day, person, column)
- [ ] Sort works
- [ ] Pagination works
- [ ] Budget management works
- [ ] Notes work
- [ ] All modals open/close correctly
- [ ] No console errors

## Current Progress: 57% Complete

- config.js: 100%
- auth.js: 100%
- data.js: 100%
- ui.js: 100%
- render.js: 0%
- expenses.js: 0%
- init.js: 0%
- Integration: 0%
