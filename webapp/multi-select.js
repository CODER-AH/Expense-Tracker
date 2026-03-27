// Multi-select functionality for batch archive/delete operations

// Toggle multi-select mode for active expenses
function toggleMultiSelect() {
  isMultiSelectMode = !isMultiSelectMode;
  selectedExpenses.clear();

  const btn = document.getElementById('multiSelectBtn');
  const addBtn = document.getElementById('addExpenseBtn');
  const bulkActions = document.getElementById('bulkActions');
  const header = document.getElementById('expenses-header');

  if (isMultiSelectMode) {
    btn.textContent = 'Cancel Selection';
    btn.style.background = 'rgba(232, 110, 138, 0.2)';
    if (addBtn) addBtn.style.display = 'none';
    // Add checkbox column to header
    if (header && !header.querySelector('.checkbox-col')) {
      const checkboxTh = document.createElement('th');
      checkboxTh.className = 'checkbox-col';
      checkboxTh.style.textAlign = 'center';
      checkboxTh.textContent = '☑️';
      header.insertBefore(checkboxTh, header.firstChild);
    }
    // Don't show bulk actions until at least one item is selected
    updateBulkActionButtons();
  } else {
    btn.textContent = '☑️ Select Multiple';
    btn.style.background = 'rgba(72, 126, 98, 0.2)';
    if (addBtn) addBtn.style.display = 'inline-block';
    bulkActions.style.display = 'none';
    // Remove checkbox column from header
    if (header) {
      const checkboxTh = header.querySelector('.checkbox-col');
      if (checkboxTh) checkboxTh.remove();
    }
  }

  render(); // Re-render to show/hide checkboxes
}

// Toggle multi-select mode for archived expenses
function toggleArchiveMultiSelect() {
  const archiveMultiSelectMode = document.getElementById('archiveMultiSelectBtn').dataset.active === 'true';
  const header = document.getElementById('archived-header');

  if (archiveMultiSelectMode) {
    document.getElementById('archiveMultiSelectBtn').dataset.active = 'false';
    document.getElementById('archiveMultiSelectBtn').textContent = '☑️ Select Multiple';
    document.getElementById('archiveMultiSelectBtn').style.background = 'rgba(72, 126, 98, 0.2)';
    document.getElementById('archiveBulkActions').style.display = 'none';
    selectedArchived.clear();
    // Remove checkbox column from header
    if (header) {
      const checkboxTh = header.querySelector('.checkbox-col');
      if (checkboxTh) checkboxTh.remove();
    }
  } else {
    document.getElementById('archiveMultiSelectBtn').dataset.active = 'true';
    document.getElementById('archiveMultiSelectBtn').textContent = 'Cancel Selection';
    document.getElementById('archiveMultiSelectBtn').style.background = 'rgba(232, 110, 138, 0.2)';
    // Add checkbox column to header
    if (header && !header.querySelector('.checkbox-col')) {
      const checkboxTh = document.createElement('th');
      checkboxTh.className = 'checkbox-col';
      checkboxTh.style.textAlign = 'center';
      checkboxTh.textContent = '☑️';
      header.insertBefore(checkboxTh, header.firstChild);
    }
    // Don't show bulk actions until at least one item is selected
    updateArchiveBulkActionButtons();
  }

  renderArchived(); // Re-render to show/hide checkboxes
}

// Toggle selection of a specific expense
function toggleExpenseSelection(day, id) {
  const key = `${day}:${id}`;
  if (selectedExpenses.has(key)) {
    selectedExpenses.delete(key);
  } else {
    selectedExpenses.add(key);
  }

  // Update checkbox visual state
  const checkbox = document.getElementById(`check-${id}`);
  if (checkbox) {
    checkbox.checked = selectedExpenses.has(key);
  }

  // Update bulk action button states
  updateBulkActionButtons();
}

// Toggle selection of archived expense
function toggleArchivedSelection(id) {
  if (selectedArchived.has(id)) {
    selectedArchived.delete(id);
  } else {
    selectedArchived.add(id);
  }

  // Update checkbox visual state
  const checkbox = document.getElementById(`check-archived-${id}`);
  if (checkbox) {
    checkbox.checked = selectedArchived.has(id);
  }

  // Update bulk action button states
  updateArchiveBulkActionButtons();
}

// Update bulk action button states
function updateBulkActionButtons() {
  const count = selectedExpenses.size;
  const bulkActions = document.getElementById('bulkActions');
  const bulkArchiveBtn = document.getElementById('bulkArchiveBtn');

  if (count === 0) {
    // Hide bulk actions when no selection
    if (bulkActions) bulkActions.style.display = 'none';
  } else {
    // Show bulk actions when there's selection
    if (bulkActions) bulkActions.style.display = 'flex';
    if (bulkArchiveBtn) {
      bulkArchiveBtn.disabled = false;
      bulkArchiveBtn.textContent = `Archive Selected (${count})`;
    }
  }
}

// Update archive bulk action button states
function updateArchiveBulkActionButtons() {
  const count = selectedArchived.size;
  const bulkActions = document.getElementById('archiveBulkActions');
  const bulkUnarchiveBtn = document.getElementById('bulkUnarchiveBtn');
  const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');

  if (count === 0) {
    // Hide bulk actions when no selection
    if (bulkActions) bulkActions.style.display = 'none';
  } else {
    // Show bulk actions when there's selection
    if (bulkActions) bulkActions.style.display = 'flex';
    if (bulkUnarchiveBtn) {
      bulkUnarchiveBtn.disabled = false;
      bulkUnarchiveBtn.textContent = `Unarchive Selected (${count})`;
    }
    if (bulkDeleteBtn) {
      // Only show delete button for admins
      if (isAdmin) {
        bulkDeleteBtn.style.display = 'inline-block';
        bulkDeleteBtn.disabled = false;
        bulkDeleteBtn.textContent = `Delete Selected (${count})`;
      } else {
        bulkDeleteBtn.style.display = 'none';
      }
    }
  }
}

// Bulk archive selected expenses
function bulkArchiveExpenses() {
  if (selectedExpenses.size === 0) return;

  // Get expense details for confirmation
  const expensesToArchive = [];
  selectedExpenses.forEach(key => {
    const [day, id] = key.split(':');
    const exp = expenses[parseInt(day)].find(e => String(e.id) === String(id));
    if (exp) {
      expensesToArchive.push({ ...exp, day: parseInt(day) });
    }
  });

  // Show confirmation dialog
  showBulkArchiveConfirm(expensesToArchive);
}

// Bulk unarchive selected expenses
function bulkUnarchiveExpenses() {
  if (selectedArchived.size === 0) return;

  // Get expense details for confirmation
  const expensesToUnarchive = [];
  selectedArchived.forEach(id => {
    const exp = archivedExpenses.find(e => String(e.id) === String(id));
    if (exp) {
      expensesToUnarchive.push(exp);
    }
  });

  // Show confirmation dialog
  showBulkUnarchiveConfirm(expensesToUnarchive);
}

// Bulk delete selected archived expenses
function bulkDeleteExpenses() {
  if (selectedArchived.size === 0) return;

  // Get expense details for confirmation
  const expensesToDelete = [];
  selectedArchived.forEach(id => {
    const exp = archivedExpenses.find(e => String(e.id) === String(id));
    if (exp) {
      expensesToDelete.push(exp);
    }
  });

  // Show confirmation dialog
  showBulkDeleteConfirm(expensesToDelete);
}

// Show bulk archive confirmation
function showBulkArchiveConfirm(expenses) {
  const overlay = document.getElementById('bulkArchiveOverlay');
  const detailsEl = document.getElementById('bulkArchiveDetails');

  let html = `<div style="max-height:300px;overflow-y:auto;margin:16px 0;padding:4px">`;
  expenses.forEach((exp, idx) => {
    html += `<div style="padding:12px 14px;background:rgba(72, 126, 98, 0.15);margin-bottom:8px;border-radius:8px;border-left:3px solid var(--accent)">
      <div style="font-weight:500;margin-bottom:6px;color:var(--text);font-size:14px">${idx + 1}. ${exp.desc}</div>
      <div style="font-size:11px;color:var(--muted);display:flex;gap:16px;flex-wrap:wrap;font-family:'DM Sans',sans-serif">
        <span style="display:flex;align-items:center;gap:4px">💰 ₹${exp.amount.toLocaleString('en-IN')}</span>
        <span style="display:flex;align-items:center;gap:4px">📅 Day ${exp.day}</span>
        <span style="display:flex;align-items:center;gap:4px">👤 ${exp.name}</span>
        <span style="display:flex;align-items:center;gap:4px">💳 ${exp.paidBy}</span>
      </div>
    </div>`;
  });
  html += `</div>`;

  detailsEl.innerHTML = html;
  overlay.classList.remove('hidden');
}

// Show bulk unarchive confirmation
function showBulkUnarchiveConfirm(expenses) {
  const overlay = document.getElementById('bulkUnarchiveOverlay');
  const detailsEl = document.getElementById('bulkUnarchiveDetails');

  let html = `<div style="max-height:300px;overflow-y:auto;margin:16px 0;padding:4px">`;
  expenses.forEach((exp, idx) => {
    html += `<div style="padding:12px 14px;background:rgba(72, 126, 98, 0.15);margin-bottom:8px;border-radius:8px;border-left:3px solid var(--accent)">
      <div style="font-weight:500;margin-bottom:6px;color:var(--text);font-size:14px">${idx + 1}. ${exp.desc}</div>
      <div style="font-size:11px;color:var(--muted);display:flex;gap:16px;flex-wrap:wrap;font-family:'DM Sans',sans-serif">
        <span style="display:flex;align-items:center;gap:4px">💰 ₹${exp.amount.toLocaleString('en-IN')}</span>
        <span style="display:flex;align-items:center;gap:4px">📅 Day ${exp.archivedDay}</span>
        <span style="display:flex;align-items:center;gap:4px">👤 ${exp.name}</span>
        <span style="display:flex;align-items:center;gap:4px">💳 ${exp.paidBy}</span>
      </div>
    </div>`;
  });
  html += `</div>`;

  detailsEl.innerHTML = html;
  overlay.classList.remove('hidden');
}

// Show bulk delete confirmation
function showBulkDeleteConfirm(expenses) {
  const overlay = document.getElementById('bulkDeleteOverlay');
  const detailsEl = document.getElementById('bulkDeleteDetails');

  let html = `<div style="max-height:300px;overflow-y:auto;margin:16px 0;padding:4px">`;
  expenses.forEach((exp, idx) => {
    html += `<div style="padding:12px 14px;background:rgba(232, 110, 138, 0.15);margin-bottom:8px;border-radius:8px;border-left:3px solid #e86e8a">
      <div style="font-weight:500;margin-bottom:6px;color:var(--text);font-size:14px">${idx + 1}. ${exp.desc}</div>
      <div style="font-size:11px;color:var(--muted);display:flex;gap:16px;flex-wrap:wrap;font-family:'DM Sans',sans-serif">
        <span style="display:flex;align-items:center;gap:4px">💰 ₹${exp.amount.toLocaleString('en-IN')}</span>
        <span style="display:flex;align-items:center;gap:4px">📅 Day ${exp.archivedDay}</span>
        <span style="display:flex;align-items:center;gap:4px">👤 ${exp.name}</span>
        <span style="display:flex;align-items:center;gap:4px">💳 ${exp.paidBy}</span>
      </div>
    </div>`;
  });
  html += `</div>`;

  detailsEl.innerHTML = html;
  overlay.classList.remove('hidden');
}

// Cancel bulk operations
function cancelBulkArchive() {
  document.getElementById('bulkArchiveOverlay').classList.add('hidden');
}

function cancelBulkUnarchive() {
  document.getElementById('bulkUnarchiveOverlay').classList.add('hidden');
}

function cancelBulkDelete() {
  document.getElementById('bulkDeleteOverlay').classList.add('hidden');
}

// Confirm bulk archive
async function confirmBulkArchive() {
  document.getElementById('bulkArchiveOverlay').classList.add('hidden');
  showLoading(true);
  setStatus('syncing', 'Archiving expenses...');

  let successCount = 0;
  let failCount = 0;

  // Process in parallel for better performance
  const promises = Array.from(selectedExpenses).map(async (key) => {
    const [day, id] = key.split(':');
    try {
      await dbUpdateExpense(id, { archived: true });

      // Move to archived
      const expense = expenses[parseInt(day)].find(e => String(e.id) === String(id));
      if (expense) {
        archivedExpenses.push({ ...expense, archivedDay: parseInt(day), archived: "Yes" });
        expenses[parseInt(day)] = expenses[parseInt(day)].filter(e => String(e.id) !== String(id));
      }

      return { success: true, id };
    } catch (e) {
      console.error('Failed to archive expense:', id, e);
      return { success: false, id };
    }
  });

  // Wait for all operations to complete
  const results = await Promise.all(promises);

  // Count successes and failures
  results.forEach(result => {
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  });

  saveLocal();
  showLoading(false);
  selectedExpenses.clear();
  isMultiSelectMode = false;
  document.getElementById('multiSelectBtn').textContent = '☑️ Select Multiple';
  document.getElementById('multiSelectBtn').style.background = 'rgba(72, 126, 98, 0.2)';
  document.getElementById('bulkActions').style.display = 'none';

  if (failCount === 0) {
    setStatus('ok', 'Synced ✓');
    showToast(`${successCount} expense${successCount > 1 ? 's' : ''} archived!`, 'ok');
  } else {
    setStatus('err', 'Some failed');
    showToast(`Archived ${successCount}, failed ${failCount}`, 'err');
  }

  render();
  renderArchived();
}

// Confirm bulk unarchive
async function confirmBulkUnarchive() {
  document.getElementById('bulkUnarchiveOverlay').classList.add('hidden');
  showLoading(true);
  setStatus('syncing', 'Unarchiving expenses...');

  let successCount = 0;
  let failCount = 0;

  // Process in parallel for better performance
  const promises = Array.from(selectedArchived).map(async (id) => {
    try {
      await dbUpdateExpense(id, { archived: false });

      const expense = archivedExpenses.find(e => String(e.id) === String(id));
      if (expense) {
        const day = expense.archivedDay;
        delete expense.archivedDay;
        delete expense.archived;
        expenses[day].push(expense);
        archivedExpenses = archivedExpenses.filter(e => String(e.id) !== String(id));
      }

      return { success: true, id };
    } catch (e) {
      console.error('Failed to unarchive expense:', id, e);
      return { success: false, id };
    }
  });

  // Wait for all operations to complete
  const results = await Promise.all(promises);

  // Count successes and failures
  results.forEach(result => {
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  });

  saveLocal();
  showLoading(false);
  selectedArchived.clear();
  document.getElementById('archiveMultiSelectBtn').dataset.active = 'false';
  document.getElementById('archiveMultiSelectBtn').textContent = '☑️ Select Multiple';
  document.getElementById('archiveMultiSelectBtn').style.background = 'rgba(72, 126, 98, 0.2)';
  document.getElementById('archiveBulkActions').style.display = 'none';

  if (failCount === 0) {
    setStatus('ok', 'Synced ✓');
    showToast(`${successCount} expense${successCount > 1 ? 's' : ''} unarchived!`, 'ok');
  } else {
    setStatus('err', 'Some failed');
    showToast(`Unarchived ${successCount}, failed ${failCount}`, 'err');
  }

  render();
  renderArchived();
}

// Confirm bulk delete
async function confirmBulkDelete() {
  document.getElementById('bulkDeleteOverlay').classList.add('hidden');
  showLoading(true);
  setStatus('syncing', 'Deleting expenses...');

  let successCount = 0;
  let failCount = 0;

  // Process in parallel for better performance
  const promises = Array.from(selectedArchived).map(async (id) => {
    try {
      await dbDeleteExpense(null, id);
      archivedExpenses = archivedExpenses.filter(e => String(e.id) !== String(id));
      return { success: true, id };
    } catch (e) {
      console.error('Failed to delete expense:', id, e);
      return { success: false, id };
    }
  });

  // Wait for all operations to complete
  const results = await Promise.all(promises);

  // Count successes and failures
  results.forEach(result => {
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  });

  saveLocal();
  showLoading(false);
  selectedArchived.clear();
  document.getElementById('archiveMultiSelectBtn').dataset.active = 'false';
  document.getElementById('archiveMultiSelectBtn').textContent = '☑️ Select Multiple';
  document.getElementById('archiveMultiSelectBtn').style.background = 'rgba(72, 126, 98, 0.2)';
  document.getElementById('archiveBulkActions').style.display = 'none';

  if (failCount === 0) {
    setStatus('ok', 'Synced ✓');
    showToast(`${successCount} expense${successCount > 1 ? 's' : ''} deleted permanently!`, 'ok');
  } else {
    setStatus('err', 'Some failed');
    showToast(`Deleted ${successCount}, failed ${failCount}`, 'err');
  }

  renderArchived();
}
