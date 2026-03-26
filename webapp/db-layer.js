// Database abstraction layer
// This allows switching between Firebase and Google Sheets seamlessly

// Configuration
const USE_FIREBASE = true; // Set to false to use only Google Sheets
const ENABLE_SHEETS_BACKUP = true; // If true, writes to both Firebase AND Sheets

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

    // Optionally backup to Sheets
    if (ENABLE_SHEETS_BACKUP && USE_FIREBASE) {
      try {
        await sheetAdd({ ...expense, id });
      } catch (e) {
        console.warn('Sheets backup failed:', e);
        // Don't fail the operation if backup fails
      }
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

    // Optionally update in Sheets
    if (ENABLE_SHEETS_BACKUP && USE_FIREBASE) {
      try {
        await sheetUpdate(id, updates);
      } catch (e) {
        console.warn('Sheets backup update failed:', e);
      }
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

    // Optionally delete from Sheets
    if (ENABLE_SHEETS_BACKUP && USE_FIREBASE) {
      try {
        await sheetDelete(day, id);
      } catch (e) {
        console.warn('Sheets backup delete failed:', e);
      }
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

    // Also update in Sheets
    if (ENABLE_SHEETS_BACKUP || !USE_FIREBASE) {
      try {
        await fetch(SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'setBudget', budget: amount })
        });
      } catch (e) {
        console.warn('Sheets budget update failed:', e);
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

const SCRIPT_URL = 'YOUR_GOOGLE_SHEETS_SCRIPT_URL'; // Keep your existing URL here

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
