# Code Organization - Refactoring Plan

## Current State
All JavaScript code (2500+ lines) is in a single `app.js` file, making it hard to maintain and navigate.

## Proposed Modular Structure

### JavaScript Modules

```
webapp/
├── js/
│   ├── config.js          # Configuration and global state
│   ├── auth.js            # Authentication & profile management
│   ├── data.js            # Data loading & localStorage
│   ├── expenses.js        # Expense CRUD operations
│   ├── ui.js              # UI components (filters, menus, helpers)
│   ├── render.js          # Rendering functions
│   └── init.js            # Initialization logic
├── db-layer.js           # Database abstraction (unchanged)
├── firebase-service.js   # Firebase operations (unchanged)
├── index.html            # Main HTML (load modules)
└── styles.css            # Styles (unchanged)
```

### Module Responsibilities

#### `config.js` - Configuration & State
- Global variables (expenses, currentUser, tripDays, etc.)
- Category configurations
- Constants (ITEMS_PER_PAGE, SCRIPT_URL)

#### `auth.js` - Authentication
- Login/logout functions
- Password management (set, change, verify)
- Profile menu toggle
- Session management

#### `data.js` - Data Management
- loadFromSheet()
- saveLocal() / loadLocal()
- loadTripDays()
- Firebase initialization wrapper

#### `expenses.js` - Expense Operations
- Add expense (single/batch)
- Edit expense (inline editing)
- Delete/archive expense
- Multi-select operations

#### `ui.js` - UI Components
- Filters (day, person, column visibility)
- Sort functionality
- Pagination
- Toast notifications
- Loading indicators
- Section toggle (collapsible sections)
- Budget UI

#### `render.js` - Rendering
- render() - main expense table
- renderArchived()
- renderNotes()
- updateSummary()
- updateSettlement()

#### `init.js` - Initialization
- window.onload logic
- Event listeners setup
- Component initialization

### Benefits

1. **Better Organization**: Related functions grouped together
2. **Easier Maintenance**: Find and fix issues faster
3. **Code Reusability**: Import only what you need
4. **Team Collaboration**: Multiple developers can work on different modules
5. **Reduced Cognitive Load**: Each file focuses on one responsibility

### Implementation Strategy

**Phase 1: Create Module Files**
- Extract functions into new module files
- Keep functions as-is (no refactoring yet)
- Maintain global scope for now (attach to window object)

**Phase 2: Update index.html**
- Load modules in correct order (config → utils → features → init)
- Ensure proper dependency loading

**Phase 3: Testing**
- Test all features work correctly
- Fix any broken references

**Phase 4: Future Improvements** (optional)
- Convert to ES6 modules (import/export)
- Remove global variables
- Add proper module bundling (Vite/Webpack)

### Load Order

```html
<!-- Core & Config -->
<script src="firebase-service.js"></script>
<script src="db-layer.js"></script>
<script src="js/config.js"></script>

<!-- Features -->
<script src="js/auth.js"></script>
<script src="js/data.js"></script>
<script src="js/ui.js"></script>
<script src="js/render.js"></script>
<script src="js/expenses.js"></script>

<!-- Initialization (must be last) -->
<script src="js/init.js"></script>
```

### Migration Notes

- All functions remain global (attached to window) for compatibility
- No breaking changes to HTML onclick handlers
- Backward compatible with existing code
- Can be done incrementally (one module at a time)

### File Size Comparison

| File | Current | After Refactoring |
|------|---------|-------------------|
| app.js | ~2500 lines | N/A (split) |
| config.js | - | ~100 lines |
| auth.js | - | ~200 lines |
| data.js | - | ~150 lines |
| expenses.js | - | ~400 lines |
| ui.js | - | ~500 lines |
| render.js | - | ~400 lines |
| init.js | - | ~100 lines |
| **Total** | ~2500 lines | ~1850 lines |

Note: Total lines reduced due to removal of duplicate comments and better organization.

