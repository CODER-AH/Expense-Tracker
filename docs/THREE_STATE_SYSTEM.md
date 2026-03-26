# Three-State Expense Management System

## Overview
Your expense tracker now has three distinct states for expenses:

### 1. **Active** (archived: false, deleted: false)
- ✅ Shown in main expense list
- ✅ Can be edited
- ✅ Can be archived (moved to archived section)
- 📍 Location: Main UI table

### 2. **Archived** (archived: true, deleted: false)
- ✅ Shown in "Archived Expenses" section
- ✅ Can be unarchived (restored to active)
- ✅ Can be permanently deleted (moved to deleted state)
- 📍 Location: Archived section (collapsible)

### 3. **Deleted** (deleted: true)
- ❌ **Never shown in UI** (completely hidden from users)
- ✅ **Still exists in database** (Firebase & Sheets)
- ✅ Available for auditing, reporting, or data recovery
- 🔒 Cannot be restored through UI (would need direct DB access)
- 📍 Location: Database only (not visible in app)

## User Flow

```
┌─────────┐   Archive    ┌──────────┐   Delete     ┌─────────┐
│ Active  │ ──────────> │ Archived │ ──────────> │ Deleted │
└─────────┘              └──────────┘              └─────────┘
     ^                        |                    (Hidden)
     └────── Unarchive ───────┘
```

## Database Schema

Each expense document has two boolean flags:
```javascript
{
  id: "abc123",
  desc: "Hotel stay",
  amount: 5000,
  archived: false,  // false = active, true = archived
  deleted: false,   // false = visible, true = hidden forever
  // ... other fields
}
```

## Firestore Queries

- **Active expenses**: `archived == false AND deleted == false`
- **Archived expenses**: `archived == true AND deleted == false`
- **Deleted expenses**: `deleted == true` (never queried by UI)

## Implementation Details

### Files Modified
1. `firebase-service.js` - Updated all queries to filter by `deleted: false`
2. `app.js` - Archive/unarchive now use `dbUpdateExpense`
3. `db-layer.js` - Sheets backup is now async (fire and forget)
4. `migrate.js` - Migration now sets `deleted: false` for all imported data

### For Existing Data
Run this script once in browser console to add `deleted: false` to existing expenses:
```javascript
const script = document.createElement('script');
script.src = './add-deleted-field.js';
document.head.appendChild(script);

// Then run:
addDeletedFieldToExistingData()
```

## Benefits

✅ **Data Preservation** - Nothing is ever truly lost
✅ **Clean UI** - Users don't see clutter from deleted items
✅ **Audit Trail** - All expenses remain in DB for record-keeping
✅ **Two-Stage Delete** - Archive first (recoverable), then delete (hidden)
✅ **Accidental Delete Protection** - Can unarchive before permanent deletion

## Sheets Backup Behavior

When an expense is deleted:
- Firebase: `deleted: true` (hidden from all queries)
- Google Sheets: Entry marked as deleted (column or similar, based on your backend implementation)

Both systems maintain the full record for auditing purposes.
