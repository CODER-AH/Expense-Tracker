/**
 * data.js
 * Data loading and management functions
 */

// ─── TRIP DAYS MANAGEMENT ─────────────────────────────────

// Load saved trip days from localStorage
function loadTripDays() {
  const saved = localStorage.getItem('coorg_tripDays');
  if (saved) {
    tripDays = JSON.parse(saved);
    maxDay = Math.max(...tripDays.map(d => d.day));
  }
}

// Save trip days to localStorage
function saveTripDays() {
  localStorage.setItem('coorg_tripDays', JSON.stringify(tripDays));
}

// Populate day dropdown with dynamic days
function populateDayDropdown(selectElement) {
  selectElement.innerHTML = '';

  tripDays.forEach(dayObj => {
    const option = document.createElement('option');
    option.value = dayObj.day;
    option.textContent = `Day ${dayObj.day} (${dayObj.name}, ${dayObj.date})`;
    selectElement.appendChild(option);
  });

  // Add "Add New Day" option
  const addOption = document.createElement('option');
  addOption.value = 'add';
  addOption.textContent = '➕ Add New Day';
  selectElement.appendChild(addOption);
}

// Handle day select change
function handleDaySelect(select) {
  if (select.value === 'add') {
    addNewDay();
    // Reset to last actual day
    select.value = maxDay;
    return false;
  }
  return true;
}

// Add a new day to the trip
function addNewDay() {
  const lastDay = tripDays[tripDays.length - 1];
  const newDayNum = maxDay + 1;

  // Calculate next day name and date
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Parse the last date (e.g., "29 Mar")
  const lastDateParts = lastDay.date.split(' ');
  const lastDayOfMonth = parseInt(lastDateParts[0]);
  const lastMonthName = lastDateParts[1];
  const lastMonthIndex = months.indexOf(lastMonthName);

  // Calculate next date (assuming 2026)
  const lastDate = new Date(2026, lastMonthIndex, lastDayOfMonth);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const nextDayName = dayNames[nextDate.getDay()];
  const nextDayOfMonth = nextDate.getDate();
  const nextMonthName = months[nextDate.getMonth()];

  const newDay = {
    day: newDayNum,
    name: nextDayName,
    date: `${nextDayOfMonth} ${nextMonthName}`
  };

  tripDays.push(newDay);
  maxDay = newDayNum;

  // Add to expenses object
  expenses[newDayNum] = [];

  // Save to localStorage
  saveTripDays();
  saveLocal();

  // Update filter dropdown
  updateFilterOptions();

  showToast(`Added Day ${newDayNum} (${nextDayName}, ${nextDayOfMonth} ${nextMonthName})`);
}

// Update filter dropdown options with current trip days
function updateFilterOptions() {
  const dayFilterDropdown = document.getElementById('dayFilterDropdown');
  if (!dayFilterDropdown) return;

  // Clear existing options except "All Days"
  dayFilterDropdown.innerHTML = '<div class="filter-option selected" onclick="selectDayFilter(\'all\', \'All Days\')">All Days</div>';

  // Add options for each trip day
  tripDays.forEach(dayObj => {
    const option = document.createElement('div');
    option.className = 'filter-option';
    option.onclick = () => selectDayFilter(String(dayObj.day), `Day ${dayObj.day} — ${dayObj.name}, ${dayObj.date}`);
    option.textContent = `Day ${dayObj.day} — ${dayObj.name}, ${dayObj.date}`;
    dayFilterDropdown.appendChild(option);
  });
}

// ─── LOCAL STORAGE ────────────────────────────────────────

function saveLocal() {
  localStorage.setItem('coorg_expenses', JSON.stringify(expenses));
  localStorage.setItem('coorg_archived', JSON.stringify(archivedExpenses));
}

function loadFromLocal() {
  const saved = localStorage.getItem('coorg_expenses');
  if (saved) {
    expenses = JSON.parse(saved);
  } else {
    // Initialize expenses object for all trip days
    expenses = {};
    tripDays.forEach(dayObj => {
      expenses[dayObj.day] = [];
    });
  }

  const savedArchived = localStorage.getItem('coorg_archived');
  archivedExpenses = savedArchived ? JSON.parse(savedArchived) : [];
}

// ─── DATA LOADING ─────────────────────────────────────────

async function loadFromSheet() {
  showLoading(true);
  setStatus('syncing', 'Loading…');
  try {
    // Load active expenses from Firebase
    const data = await dbGetAllExpenses();
    console.log('Loaded active expenses from Firebase:', data);

    // Initialize expenses object for all trip days
    expenses = {};
    tripDays.forEach(dayObj => {
      expenses[dayObj.day] = [];
    });

    // Process active expenses
    (data || []).forEach(e => {
      // Ensure the day exists in our expenses object
      if (!expenses[e.day]) {
        expenses[e.day] = [];
      }
      expenses[e.day].push(e);
    });

    // Load budget from Firebase
    tripBudget = await dbGetBudget();
    console.log('Loaded budget from Firebase:', tripBudget);
    if (tripBudget) {
      localStorage.setItem('coorg_budget', tripBudget);
    }

    // Don't load archived expenses or notes on initial load
    // They will be loaded when user expands those sections

    dataLoaded = true; // Mark that initial data has been loaded
    saveLocal();
    render();
    setStatus('ok', 'Synced ✓');
  } catch(e) {
    console.error('Error loading from Firebase:', e);
    setStatus('err', 'Offline — showing local data');
    loadFromLocal();
    dataLoaded = true; // Mark as loaded even on error (using cached data)
    render();
  } finally {
    showLoading(false);
  }
}

// ─── LEGACY GOOGLE SHEETS FUNCTIONS ───────────────────────
// These are kept for backward compatibility but not actively used

async function sheetAdd(exp) {
  const params = new URLSearchParams({
    action: 'add',
    day: exp.day,
    name: exp.name,
    desc: exp.desc,
    cat: exp.cat,
    amount: exp.amount,
    paidBy: exp.paidBy
  });
  const res = await fetch(`${SCRIPT_URL}?${params}`);
  const data = await res.json();
  return data.id;
}

async function sheetUpdate(exp) {
  const params = new URLSearchParams({
    action: 'update',
    id: exp.id,
    day: exp.day,
    name: exp.name,
    desc: exp.desc,
    cat: exp.cat,
    amount: exp.amount,
    paidBy: exp.paidBy
  });
  const res = await fetch(`${SCRIPT_URL}?${params}`);
  return await res.json();
}

async function sheetDelete(id) {
  const params = new URLSearchParams({ action: 'delete', id });
  await fetch(`${SCRIPT_URL}?${params}`);
}

async function sheetArchive(id) {
  const params = new URLSearchParams({ action: 'archive', id });
  await fetch(`${SCRIPT_URL}?${params}`);
}

async function sheetUnarchive(id) {
  const params = new URLSearchParams({ action: 'unarchive', id });
  await fetch(`${SCRIPT_URL}?${params}`);
}
