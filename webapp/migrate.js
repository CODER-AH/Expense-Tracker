// Migration Script: Google Sheets → Firebase Firestore
// Run this in the browser console on your app page

async function migrateFromSheetsToFirebase() {
  console.log('🚀 Starting migration from Sheets to Firebase...');

  try {
    // 1. Get all data from Google Sheets
    console.log('📥 Fetching data from Google Sheets...');
    const res = await fetch(`${SCRIPT_URL}?action=getAll`);
    const sheetsData = await res.json();

    console.log(`Found ${sheetsData.expenses?.length || 0} expenses in Sheets`);

    // 2. Get budget from Sheets
    const budgetRes = await fetch(`${SCRIPT_URL}?action=getBudget`);
    const budgetData = await budgetRes.json();
    console.log(`Budget from Sheets: ₹${budgetData.budget || 0}`);

    // 3. Initialize Firebase if not already done
    if (!initialized) {
      console.log('🔥 Initializing Firebase...');
      initializeFirebase();
    }

    // 4. Migrate expenses to Firestore
    let successCount = 0;
    let errorCount = 0;

    if (sheetsData.expenses && sheetsData.expenses.length > 0) {
      console.log('📤 Migrating expenses to Firestore...');

      for (let i = 0; i < sheetsData.expenses.length; i++) {
        const expense = sheetsData.expenses[i];

        try {
          // Add to Firestore
          await firestoreAddExpense({
            day: parseInt(expense.day) || 1,
            name: expense.name || '',
            desc: expense.desc || '',
            cat: expense.cat || 'misc',
            amount: parseFloat(expense.amount) || 0,
            paidBy: expense.paidBy || '',
            ts: expense.ts || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
            edited: expense.edited || '',
            archived: expense.archived === "Yes" || expense.archived === true
          });

          successCount++;

          // Log progress every 10 items
          if (successCount % 10 === 0) {
            console.log(`✅ Migrated ${successCount}/${sheetsData.expenses.length} expenses`);
          }

          // Small delay to avoid overwhelming Firestore
          await new Promise(resolve => setTimeout(resolve, 50));

        } catch (error) {
          console.error(`❌ Failed to migrate expense ${i}:`, expense, error);
          errorCount++;
        }
      }
    }

    // 5. Migrate budget to Firestore
    if (budgetData.budget !== undefined) {
      console.log('💰 Migrating budget to Firestore...');
      try {
        await firestoreSetBudget(budgetData.budget);
        console.log(`✅ Budget migrated: ₹${budgetData.budget}`);
      } catch (error) {
        console.error('❌ Failed to migrate budget:', error);
      }
    }

    // 6. Migrate trip days to Firestore
    console.log('📅 Migrating trip days to Firestore...');
    for (const dayObj of tripDays) {
      try {
        await firestoreAddTripDay(dayObj);
      } catch (error) {
        console.warn(`Trip day ${dayObj.day} might already exist or failed:`, error);
      }
    }

    // 7. Summary
    console.log('\n🎉 Migration Complete!');
    console.log('═══════════════════════');
    console.log(`✅ Successfully migrated: ${successCount} expenses`);
    console.log(`❌ Failed: ${errorCount} expenses`);
    console.log(`💰 Budget: ₹${budgetData.budget || 0}`);
    console.log(`📅 Trip days: ${tripDays.length}`);
    console.log('═══════════════════════');
    console.log('\n✨ You can now reload the page to see your data from Firebase!');

    return {
      success: successCount,
      failed: errorCount,
      budget: budgetData.budget
    };

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

// Run the migration
console.log('Copy and paste this into your browser console:');
console.log('migrateFromSheetsToFirebase()');
