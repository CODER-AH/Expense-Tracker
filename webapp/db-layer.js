// Database abstraction layer
// This allows switching between Firebase and Google Sheets seamlessly

// Configuration - loaded from config.js
const USE_FIREBASE = window.APP_CONFIG?.database?.useFirebase ?? true;
const ENABLE_SHEETS_BACKUP = window.APP_CONFIG?.database?.enableSheetsBackup ?? false;

// ============================================
// UNIFIED DATABASE API
// ============================================

async function dbInit() {
  if (USE_FIREBASE) {
    initializeFirebase();
  }
}

async function dbAddExpense(expense) {
  try {
    let id;

    // Add to Firebase (primary)
    if (USE_FIREBASE) {
      id = await firestoreAddExpense(expense);
      trackExpenseAdded(expense.cat, expense.amount);
    }

    // Optionally backup to Sheets (fire and forget - don't await)
    if (ENABLE_SHEETS_BACKUP && USE_FIREBASE) {
      sheetAdd({ ...expense, id }).catch(e => {
        console.warn('Sheets backup failed:', e);
        // Don't fail the operation if backup fails
      });
    }

    // If not using Firebase, use Sheets as primary
    if (!USE_FIREBASE) {
      id = await sheetAdd(expense);
    }

    return id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
}

async function dbGetAllExpenses() {
  try {
    if (USE_FIREBASE) {
      return await firestoreGetAllExpenses();
    } else {
      const data = await fetch(SCRIPT_URL + '?action=getAll').then(r => r.json());
      return data;
    }
  } catch (error) {
    console.error('Error getting expenses:', error);
    throw error;
  }
}

async function dbUpdateExpense(id, updates) {
  try {
    // Update in Firebase
    if (USE_FIREBASE) {
      await firestoreUpdateExpense(id, updates);
      trackExpenseUpdated(updates.cat || 'unknown');
    }

    // Optionally update in Sheets (fire and forget - don't await)
    if (ENABLE_SHEETS_BACKUP && USE_FIREBASE) {
      sheetUpdate(id, updates).catch(e => {
        console.warn('Sheets backup update failed:', e);
      });
    }

    // If not using Firebase, use Sheets
    if (!USE_FIREBASE) {
      await sheetUpdate(id, updates);
    }

    return true;
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
}

async function dbDeleteExpense(day, id) {
  try {
    // Delete from Firebase
    if (USE_FIREBASE) {
      await firestoreDeleteExpense(id);
      trackExpenseDeleted('unknown');
    }

    // Optionally delete from Sheets (fire and forget - don't await)
    if (ENABLE_SHEETS_BACKUP && USE_FIREBASE) {
      sheetDelete(day, id).catch(e => {
        console.warn('Sheets backup delete failed:', e);
      });
    }

    // If not using Firebase, use Sheets
    if (!USE_FIREBASE) {
      await sheetDelete(day, id);
    }

    return true;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
}

async function dbGetArchivedExpenses() {
  try {
    if (USE_FIREBASE) {
      return await firestoreGetArchivedExpenses();
    } else {
      const data = await fetch(SCRIPT_URL + '?action=getArchived').then(r => r.json());
      return data;
    }
  } catch (error) {
    console.error('Error getting archived expenses:', error);
    throw error;
  }
}

async function dbGetTripDays() {
  try {
    if (USE_FIREBASE) {
      const days = await firestoreGetTripDays();
      // If no days in Firebase, return defaults
      if (days.length === 0) {
        return [
          { day: 1, name: 'Saturday', date: '28 March' },
          { day: 2, name: 'Sunday', date: '29 March' }
        ];
      }
      return days;
    } else {
      // For Sheets, return static days (Sheets doesn't store trip days)
      return [
        { day: 1, name: 'Saturday', date: '28 March' },
        { day: 2, name: 'Sunday', date: '29 March' }
      ];
    }
  } catch (error) {
    console.error('Error getting trip days:', error);
    return [
      { day: 1, name: 'Saturday', date: '28 March' },
      { day: 2, name: 'Sunday', date: '29 March' }
    ];
  }
}

async function dbAddTripDay(dayData) {
  try {
    if (USE_FIREBASE) {
      await firestoreAddTripDay(dayData);
    }
    // Note: Sheets doesn't store trip days separately
    return true;
  } catch (error) {
    console.error('Error adding trip day:', error);
    throw error;
  }
}

async function dbGetBudget() {
  try {
    if (USE_FIREBASE) {
      return await firestoreGetBudget();
    } else {
      const data = await fetch(SCRIPT_URL + '?action=getBudget').then(r => r.json());
      return data.budget || 0;
    }
  } catch (error) {
    console.error('Error getting budget:', error);
    return 0;
  }
}

async function dbSetBudget(amount) {
  try {
    if (USE_FIREBASE) {
      await firestoreSetBudget(amount);
    }

    // Also update in Sheets (fire and forget - don't await)
    if (ENABLE_SHEETS_BACKUP || !USE_FIREBASE) {
      const sheetCall = fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'setBudget', budget: amount })
      }).catch(e => {
        console.warn('Sheets budget update failed:', e);
      });

      // Only await if Sheets is primary
      if (!USE_FIREBASE) {
        await sheetCall;
      }
    }

    return true;
  } catch (error) {
    console.error('Error setting budget:', error);
    throw error;
  }
}

// ============================================
// REAL-TIME LISTENERS (Firebase only)
// ============================================

function dbListenToExpenses(callback) {
  if (USE_FIREBASE) {
    return firestoreListenToExpenses(callback);
  }
  // For Sheets, return null (no real-time updates)
  return null;
}

function dbListenToBudget(callback) {
  if (USE_FIREBASE) {
    return firestoreListenToBudget(callback);
  }
  // For Sheets, return null (no real-time updates)
  return null;
}

// ============================================
// GOOGLE SHEETS FUNCTIONS (Original)
// ============================================

// Use the SCRIPT_URL from app.js (already defined there)

async function sheetAdd(expense) {
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'add', ...expense })
  });
  const data = await res.json();
  return data.id;
}

async function sheetUpdate(id, updates) {
  await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'update', id, ...updates })
  });
}

async function sheetDelete(day, id) {
  await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', day, id })
  });
}

// ============================================
// NOTES/TASKS OPERATIONS
// ============================================

async function dbAddNote(note) {
  try {
    let id;

    // Add to Firebase (primary)
    if (USE_FIREBASE) {
      id = await firestoreAddNote(note);
    }

    // Optionally backup to Sheets (fire and forget - don't await)
    if (ENABLE_SHEETS_BACKUP && USE_FIREBASE) {
      sheetAddNote({ ...note, id }).catch(e => {
        console.warn('Sheets note backup failed:', e);
      });
    }

    // If not using Firebase, use Sheets as primary
    if (!USE_FIREBASE) {
      id = await sheetAddNote(note);
    }

    return id;
  } catch (error) {
    console.error('Error adding note:', error);
    throw error;
  }
}

async function dbGetAllNotes() {
  try {
    if (USE_FIREBASE) {
      return await firestoreGetAllNotes();
    } else {
      const data = await fetch(SCRIPT_URL + '?action=getNotes').then(r => r.json());
      return data.notes || [];
    }
  } catch (error) {
    console.error('Error getting notes:', error);
    throw error;
  }
}

async function dbUpdateNote(id, updates) {
  try {
    // Update in Firebase
    if (USE_FIREBASE) {
      await firestoreUpdateNote(id, updates);
    }

    // Optionally update in Sheets (fire and forget - don't await)
    if (ENABLE_SHEETS_BACKUP && USE_FIREBASE) {
      sheetUpdateNote(id, updates).catch(e => {
        console.warn('Sheets note backup update failed:', e);
      });
    }

    // If not using Firebase, use Sheets
    if (!USE_FIREBASE) {
      await sheetUpdateNote(id, updates);
    }

    return true;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
}

async function dbDeleteNote(id) {
  try {
    // Delete from Firebase
    if (USE_FIREBASE) {
      await firestoreDeleteNote(id);
    }

    // Optionally delete from Sheets (fire and forget - don't await)
    if (ENABLE_SHEETS_BACKUP && USE_FIREBASE) {
      sheetDeleteNote(id).catch(e => {
        console.warn('Sheets note backup delete failed:', e);
      });
    }

    // If not using Firebase, use Sheets
    if (!USE_FIREBASE) {
      await sheetDeleteNote(id);
    }

    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
}

// ============================================
// GOOGLE SHEETS - NOTES FUNCTIONS
// ============================================

async function sheetAddNote(note) {
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'addNote', ...note })
  });
  const data = await res.json();
  return data.id;
}

async function sheetUpdateNote(id, updates) {
  await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'updateNote', id, ...updates })
  });
}

async function sheetDeleteNote(id) {
  await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'deleteNote', id })
  });
}
