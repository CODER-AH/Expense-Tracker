// Firebase configuration and initialization
// Config is loaded from config.js (not committed to git)
const firebaseConfig = window.APP_CONFIG?.firebase || {
  // Fallback config (will show warning if used)
  apiKey: "MISSING_CONFIG",
  authDomain: "MISSING_CONFIG",
  projectId: "MISSING_CONFIG",
  storageBucket: "MISSING_CONFIG",
  messagingSenderId: "MISSING_CONFIG",
  appId: "MISSING_CONFIG",
  measurementId: "MISSING_CONFIG"
};

// Check if config is loaded
if (firebaseConfig.apiKey === "MISSING_CONFIG") {
  console.error("⚠️ Firebase config not found! Please create webapp/config.js from config.template.js");
}

// Initialize Firebase
let db;
let analytics;
let initialized = false;

function initializeFirebase() {
  if (initialized) return;

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();

  // Initialize Analytics if measurementId is provided
  if (firebaseConfig.measurementId) {
    analytics = firebase.analytics();
    console.log('Firebase Analytics initialized');
  }

  initialized = true;
  console.log('Firebase initialized');
}

// ============================================
// ANALYTICS HELPER FUNCTIONS
// ============================================

function logAnalyticsEvent(eventName, params = {}) {
  if (analytics) {
    analytics.logEvent(eventName, params);
  }
}

// Track expense actions
function trackExpenseAdded(category, amount) {
  logAnalyticsEvent('expense_added', {
    category: category,
    amount: amount
  });
}

function trackExpenseUpdated(category) {
  logAnalyticsEvent('expense_updated', {
    category: category
  });
}

function trackExpenseDeleted(category) {
  logAnalyticsEvent('expense_deleted', {
    category: category
  });
}

// ============================================
// EXPENSES CRUD OPERATIONS
// ============================================

async function firestoreAddExpense(expense) {
  try {
    const docRef = await db.collection('expenses').add({
      ...expense,
      deleted: false, // Initialize deleted flag
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
}

async function firestoreGetAllExpenses() {
  try {
    // Get all non-archived expenses (filter deleted in client-side)
    const snapshot = await db.collection('expenses')
      .where('archived', '==', false)
      .orderBy('day')
      .orderBy('createdAt', 'desc')
      .get();

    const expenses = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Filter out deleted expenses client-side
      if (!data.deleted) {
        expenses.push({
          id: doc.id,
          ...data
        });
      }
    });

    return expenses;
  } catch (error) {
    console.error('Error getting expenses:', error);
    throw error;
  }
}

async function firestoreUpdateExpense(id, updates) {
  try {
    await db.collection('expenses').doc(id).update({
      ...updates,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
}

async function firestoreDeleteExpense(id) {
  try {
    // Mark as deleted (separate from archived)
    // Deleted items are kept in DB but never shown in UI
    await db.collection('expenses').doc(id).update({
      deleted: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
}

async function firestoreGetArchivedExpenses() {
  try {
    // Get all archived expenses (filter deleted in client-side)
    const snapshot = await db.collection('expenses')
      .where('archived', '==', true)
      .orderBy('day')
      .orderBy('createdAt', 'desc')
      .get();

    const expenses = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Filter out deleted expenses client-side
      if (!data.deleted) {
        expenses.push({
          id: doc.id,
          ...data
        });
      }
    });

    return expenses;
  } catch (error) {
    console.error('Error getting archived expenses:', error);
    throw error;
  }
}

// ============================================
// TRIP DAYS
// ============================================

async function firestoreGetTripDays() {
  try {
    const snapshot = await db.collection('tripDays')
      .orderBy('day')
      .get();

    const days = [];
    snapshot.forEach(doc => {
      days.push(doc.data());
    });

    return days;
  } catch (error) {
    console.error('Error getting trip days:', error);
    throw error;
  }
}

async function firestoreAddTripDay(dayData) {
  try {
    await db.collection('tripDays').doc(String(dayData.day)).set(dayData);
    return true;
  } catch (error) {
    console.error('Error adding trip day:', error);
    throw error;
  }
}

// ============================================
// BUDGET
// ============================================

async function firestoreGetBudget() {
  try {
    const doc = await db.collection('budget').doc('current').get();
    if (doc.exists) {
      return doc.data().amount || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error getting budget:', error);
    throw error;
  }
}

async function firestoreSetBudget(amount) {
  try {
    await db.collection('budget').doc('current').set({
      amount: amount,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error setting budget:', error);
    throw error;
  }
}

// ============================================
// REAL-TIME LISTENERS
// ============================================

function firestoreListenToExpenses(callback) {
  return db.collection('expenses')
    .where('archived', '==', false)
    .onSnapshot(snapshot => {
      const expenses = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Filter out deleted expenses client-side
        if (!data.deleted) {
          expenses.push({
            id: doc.id,
            ...data
          });
        }
      });
      callback(expenses);
    }, error => {
      console.error('Error listening to expenses:', error);
    });
}

function firestoreListenToBudget(callback) {
  return db.collection('budget').doc('current')
    .onSnapshot(doc => {
      if (doc.exists) {
        callback(doc.data().amount || 0);
      }
    }, error => {
      console.error('Error listening to budget:', error);
    });
}
