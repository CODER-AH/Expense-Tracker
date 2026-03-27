// Payments Management
// Handles payment recording, confirmation, and settlement adjustments

// ============================================
// STATE MANAGEMENT
// ============================================

let paymentsLoaded = false;
let allPayments = [];

const PAYMENT_METHODS = ['GPay', 'PhonePe', 'Paytm', 'Cred', 'Cash', 'Other'];

// Participants list (matches app.js)
const PARTICIPANTS = ['Afsar', 'Adham', 'Aakif', 'Sahlaan'];

// ============================================
// MAIN LOAD FUNCTION
// ============================================

async function loadPayments() {
  // Always reload payments to ensure fresh data
  try {
    allPayments = await dbGetAllPayments();
    paymentsLoaded = true;
    renderPaymentSection();
  } catch (error) {
    console.error('Error loading payments:', error);
    showError('Failed to load payments. Please try again.');
  }
}

// ============================================
// RENDER PAYMENT SECTION
// ============================================

function renderPaymentSection() {
  const container = document.getElementById('payments-section');
  if (!container) return;

  // Get current settlements (from existing logic)
  const settlements = getCurrentSettlements();

  // Get pending payments for current user
  const pendingToConfirm = allPayments.filter(p =>
    p.status === 'pending' && p.to === currentUser && !p.deleted
  );

  const pendingSent = allPayments.filter(p =>
    p.status === 'pending' && p.from === currentUser && !p.deleted
  );

  const confirmedPayments = allPayments.filter(p =>
    p.status === 'confirmed' && !p.deleted
  );

  let html = `
    <div class="payments-container">
      <h2>💸 Payments & Settlements</h2>

      <!-- Current Settlements -->
      <div class="settlements-section">
        <h3>Current Settlements (After Payments)</h3>
        <div class="settlement-grid">
          ${renderSettlementCards(settlements)}
        </div>
      </div>

      <!-- Pending Confirmations -->
      <div class="pending-confirmations">
        <h3>Pending Confirmations (${pendingToConfirm.length})</h3>
        ${pendingToConfirm.length > 0
          ? pendingToConfirm.map(p => renderPendingConfirmation(p)).join('')
          : '<p class="empty-state-message">No pending payments to confirm</p>'}
      </div>

      <!-- Pending Sent -->
      <div class="pending-sent">
        <h3>Payments Awaiting Confirmation (${pendingSent.length})</h3>
        ${pendingSent.length > 0
          ? pendingSent.map(p => renderPendingSent(p)).join('')
          : '<p class="empty-state-message">No payments awaiting confirmation</p>'}
      </div>

      <!-- Payment History -->
      <div class="payment-history">
        <h3>Payment History</h3>
        ${confirmedPayments.length > 0 ? renderPaymentHistory(confirmedPayments) : '<p class="empty-state-message">No confirmed payments yet</p>'}
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// ============================================
// SETTLEMENT CALCULATIONS WITH PAYMENTS
// ============================================

function getCurrentSettlements() {
  // Use existing settlement calculation from app.js
  // But adjust for confirmed payments

  const confirmedPayments = allPayments.filter(p => p.status === 'confirmed' && !p.deleted);

  // Calculate payment adjustments per person
  const paymentAdjustments = {};
  PARTICIPANTS.forEach(name => {
    paymentAdjustments[name] = 0;
  });

  confirmedPayments.forEach(payment => {
    // Person who sent loses money (negative)
    paymentAdjustments[payment.from] = (paymentAdjustments[payment.from] || 0) - payment.amount;
    // Person who received gains money (positive)
    paymentAdjustments[payment.to] = (paymentAdjustments[payment.to] || 0) + payment.amount;
  });

  // Get base settlements from expenses
  const baseSettlements = calculateBaseSettlements();

  // Adjust settlements with payment data
  const adjustedBalances = {};
  PARTICIPANTS.forEach(name => {
    adjustedBalances[name] = (baseSettlements[name] || 0) + (paymentAdjustments[name] || 0);
  });

  // Calculate who owes whom with adjusted balances
  return calculateMinimalTransactions(adjustedBalances);
}

function calculateBaseSettlements() {
  // Copy logic from app.js updateSettlement()
  const balances = {};
  PARTICIPANTS.forEach(name => {
    balances[name] = 0;
  });

  // Get all active expenses (not archived, not deleted)
  const allActiveExpenses = [];
  if (typeof expenses !== 'undefined') {
    Object.values(expenses).forEach(dayExpenses => {
      if (Array.isArray(dayExpenses)) {
        allActiveExpenses.push(...dayExpenses.filter(e => !e.archived && !e.deleted));
      }
    });
  }

  // Calculate total and share per person
  const total = allActiveExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const sharePerPerson = total / PARTICIPANTS.length;

  // Calculate how much each person paid
  const paidBy = {};
  PARTICIPANTS.forEach(name => {
    paidBy[name] = 0;
  });

  allActiveExpenses.forEach(e => {
    if (paidBy[e.paidBy] !== undefined) {
      paidBy[e.paidBy] += (e.amount || 0);
    }
  });

  // Calculate balance (positive = gets money, negative = owes money)
  PARTICIPANTS.forEach(person => {
    balances[person] = paidBy[person] - sharePerPerson;
  });

  return balances;
}

function calculateMinimalTransactions(balances) {
  // Simplified greedy algorithm for settlements
  const creditors = [];
  const debtors = [];

  Object.keys(balances).forEach(person => {
    const balance = Math.round(balances[person]);
    if (balance > 0) {
      creditors.push({ name: person, amount: balance });
    } else if (balance < 0) {
      debtors.push({ name: person, amount: -balance });
    }
  });

  const transactions = [];

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const amount = Math.min(creditor.amount, debtor.amount);

    if (amount > 0) {
      transactions.push({
        from: debtor.name,
        to: creditor.name,
        amount: amount
      });
    }

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount === 0) i++;
    if (debtor.amount === 0) j++;
  }

  return transactions;
}

// ============================================
// RENDER HELPERS
// ============================================

function renderSettlementCards(settlements) {
  if (settlements.length === 0) {
    return '<div class="settlement-card"><p>All settled up! ✓</p></div>';
  }

  const userSettlements = settlements.filter(s =>
    s.from === currentUser || s.to === currentUser
  );

  if (userSettlements.length === 0) {
    return '<div class="settlement-card"><p>You\'re all settled up! ✓</p></div>';
  }

  // Get pending payments sent by current user
  const pendingPaymentsByUser = allPayments.filter(p =>
    p.from === currentUser && p.status === 'pending' && !p.deleted
  );

  return userSettlements.map(s => {
    if (s.from === currentUser) {
      // Check if there's already a pending payment to this person
      const existingPending = pendingPaymentsByUser.filter(p => p.to === s.to);
      const totalPendingAmount = existingPending.reduce((sum, p) => sum + p.amount, 0);
      const remainingAmount = s.amount; // This already accounts for confirmed payments

      // Disable button if total pending >= remaining amount needed
      const canPayMore = totalPendingAmount < remainingAmount;
      const buttonDisabled = !canPayMore;

      return `
        <div class="settlement-card">
          <div class="settlement-info">
            <span class="settlement-label">You owe</span>
            <span class="settlement-person">${s.to}</span>
            <span class="settlement-amount">₹${s.amount}</span>
            ${totalPendingAmount > 0 ? `<span class="pending-note" style="font-size:12px;color:var(--accent2);margin-top:4px">₹${totalPendingAmount} pending confirmation</span>` : ''}
          </div>
          <button
            class="btn-primary payment-pay-btn"
            onclick="showRecordPaymentModal('${s.from}', '${s.to}', ${s.amount})"
            ${buttonDisabled ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}
          >
            ${buttonDisabled ? 'Payment Pending' : 'Pay Now'}
          </button>
        </div>
      `;
    } else {
      return `
        <div class="settlement-card">
          <div class="settlement-info">
            <span class="settlement-label">${s.from} owes you</span>
            <span class="settlement-amount">₹${s.amount}</span>
          </div>
        </div>
      `;
    }
  }).join('');
}

function renderPendingConfirmation(payment) {
  const timeAgo = getTimeAgo(payment.createdAt);

  return `
    <div class="payment-card payment-status-pending">
      <div class="payment-header">
        <span class="payment-from">💰 ${payment.from} sent you ₹${payment.amount}</span>
        <span class="payment-method-badge">${payment.paymentMethod}</span>
      </div>
      ${payment.note ? `<div class="payment-note">"${payment.note}"</div>` : ''}
      <div class="payment-time">${timeAgo}</div>
      <div class="payment-actions">
        <button class="btn-success" onclick="confirmPaymentAction('${payment.id}')">Confirm</button>
        <button class="btn-danger" onclick="showRejectPaymentModal('${payment.id}')">Reject</button>
      </div>
    </div>
  `;
}

function renderPendingSent(payment) {
  const timeAgo = getTimeAgo(payment.createdAt);

  return `
    <div class="payment-card payment-status-pending">
      <div class="payment-header">
        <span>⏳ Waiting for ${payment.to} to confirm</span>
      </div>
      <div class="payment-details">
        ₹${payment.amount} via ${payment.paymentMethod}
        ${payment.note ? ` • "${payment.note}"` : ''}
      </div>
      <div class="payment-time">Sent ${timeAgo}</div>
      <div class="payment-actions">
        <button class="btn-secondary" onclick="deletePaymentAction('${payment.id}')">Cancel</button>
      </div>
    </div>
  `;
}

function renderPaymentHistory(payments) {
  // Show most recent 10 payments
  const recentPayments = payments
    .sort((a, b) => (b.confirmedAt?.seconds || 0) - (a.confirmedAt?.seconds || 0))
    .slice(0, 10);

  return `
    <div class="payment-history-list">
      ${recentPayments.map(p => `
        <div class="payment-card payment-status-confirmed">
          <div class="payment-header">
            <span>${p.from} → ${p.to}</span>
            <span class="payment-amount">₹${p.amount}</span>
          </div>
          <div class="payment-details">
            <span class="payment-method-badge">${p.paymentMethod}</span>
            ${p.note ? `<span class="payment-note">"${p.note}"</span>` : ''}
          </div>
          <div class="payment-time">
            Confirmed by ${p.confirmedBy} ${getTimeAgo(p.confirmedAt)}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function getTimeAgo(timestamp) {
  if (!timestamp || !timestamp.seconds) return 'recently';

  const now = Date.now() / 1000;
  const diff = now - timestamp.seconds;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

// ============================================
// MODAL ACTIONS
// ============================================

let currentPaymentIdForAction = null;

function showRecordPaymentModal(from, to, suggestedAmount) {
  const modal = document.getElementById('record-payment-modal');
  if (!modal) return;

  // Pre-fill form
  document.getElementById('payment-from').value = from;
  document.getElementById('payment-to').value = to;
  document.getElementById('payment-amount').value = suggestedAmount || '';
  document.getElementById('payment-note').value = '';

  // Reset payment method dropdown
  const methodDropdown = document.getElementById('payment-method');
  if (methodDropdown) {
    methodDropdown.selectedIndex = 0;
  }

  // Show modal using confirm-overlay pattern
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
}

function hideRecordPaymentModal() {
  const modal = document.getElementById('record-payment-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

async function submitPayment() {
  const from = document.getElementById('payment-from').value;
  const to = document.getElementById('payment-to').value;
  const amount = parseFloat(document.getElementById('payment-amount').value);
  const method = document.getElementById('payment-method').value;
  const note = document.getElementById('payment-note').value.trim();

  // Validation
  if (!from || !to) {
    showError('Please specify sender and receiver.');
    return;
  }

  if (from === to) {
    showError('Cannot send payment to yourself.');
    return;
  }

  if (!amount || amount <= 0) {
    showError('Please enter a valid amount.');
    return;
  }

  if (!method) {
    showError('Please select a payment method.');
    return;
  }

  try {
    showLoading(true, 'default', 'Recording payment...');

    const payment = {
      from,
      to,
      amount,
      paymentMethod: method,
      note: note || ''
    };

    await dbAddPayment(payment);

    hideRecordPaymentModal();

    // Reload payments to show new payment
    await loadPayments();

    showLoading(false);
    showToast('Payment recorded! Waiting for confirmation');
  } catch (error) {
    showLoading(false);
    console.error('Error submitting payment:', error);
    showError('Failed to record payment. Please try again.');
  }
}

async function confirmPaymentAction(paymentId) {
  // Get payment details
  const payment = allPayments.find(p => p.id === paymentId);
  if (!payment) return;

  // Show custom confirmation modal
  currentPaymentIdForAction = paymentId;
  const modal = document.getElementById('confirmPaymentOverlay');
  const detailsEl = document.getElementById('confirmPaymentDetails');

  if (modal && detailsEl) {
    detailsEl.innerHTML = `
      <strong>${payment.from}</strong> sent you <strong>₹${payment.amount}</strong><br>
      via <strong>${payment.paymentMethod}</strong>
      ${payment.note ? `<br><em>"${payment.note}"</em>` : ''}
    `;
    modal.classList.remove('hidden');
  }
}

function hideConfirmPaymentModal() {
  const modal = document.getElementById('confirmPaymentOverlay');
  if (modal) modal.classList.add('hidden');
  currentPaymentIdForAction = null;
}

async function doConfirmPayment() {
  if (!currentPaymentIdForAction) return;

  try {
    hideConfirmPaymentModal();
    showLoading(true, 'default', 'Confirming payment...');
    await dbConfirmPayment(currentPaymentIdForAction, currentUser);

    // Reload payments
    await loadPayments();

    // Also reload expenses to update settlement calculations
    if (typeof loadFromDB === 'function') {
      await loadFromDB();
    }

    showLoading(false);
    showToast('Payment confirmed! Settlements updated');
    currentPaymentIdForAction = null;
  } catch (error) {
    showLoading(false);
    console.error('Error confirming payment:', error);
    showError('Failed to confirm payment. Please try again.');
  }
}

function showRejectPaymentModal(paymentId) {
  // Get payment details
  const payment = allPayments.find(p => p.id === paymentId);
  if (!payment) return;

  // Show custom rejection modal
  currentPaymentIdForAction = paymentId;
  const modal = document.getElementById('rejectPaymentOverlay');
  const detailsEl = document.getElementById('rejectPaymentDetails');
  const reasonInput = document.getElementById('rejectPaymentReason');

  if (modal && detailsEl && reasonInput) {
    detailsEl.innerHTML = `
      <strong>${payment.from}</strong> sent you <strong>₹${payment.amount}</strong><br>
      via <strong>${payment.paymentMethod}</strong>
      ${payment.note ? `<br><em>"${payment.note}"</em>` : ''}
    `;
    reasonInput.value = '';
    modal.classList.remove('hidden');
  }
}

function hideRejectPaymentModal() {
  const modal = document.getElementById('rejectPaymentOverlay');
  if (modal) modal.classList.add('hidden');
  currentPaymentIdForAction = null;
}

async function doRejectPayment() {
  if (!currentPaymentIdForAction) return;

  const reason = document.getElementById('rejectPaymentReason').value.trim();
  if (!reason) {
    showError('Please provide a reason for rejection.');
    return;
  }

  try {
    hideRejectPaymentModal();
    showLoading(true, 'default', 'Rejecting payment...');
    await dbRejectPayment(currentPaymentIdForAction, reason);

    // Reload payments
    await loadPayments();

    // No need to reload expenses since rejected payments don't affect settlements

    showLoading(false);
    showToast('Payment rejected');
    currentPaymentIdForAction = null;
  } catch (error) {
    showLoading(false);
    console.error('Error rejecting payment:', error);
    showError('Failed to reject payment. Please try again.');
  }
}

async function deletePaymentAction(paymentId) {
  // Get payment details
  const payment = allPayments.find(p => p.id === paymentId);
  if (!payment) return;

  // Show custom cancel modal
  currentPaymentIdForAction = paymentId;
  const modal = document.getElementById('cancelPaymentOverlay');
  const detailsEl = document.getElementById('cancelPaymentDetails');

  if (modal && detailsEl) {
    detailsEl.innerHTML = `
      Payment to <strong>${payment.to}</strong> for <strong>₹${payment.amount}</strong><br>
      via <strong>${payment.paymentMethod}</strong>
      ${payment.note ? `<br><em>"${payment.note}"</em>` : ''}
    `;
    modal.classList.remove('hidden');
  }
}

function hideCancelPaymentModal() {
  const modal = document.getElementById('cancelPaymentOverlay');
  if (modal) modal.classList.add('hidden');
  currentPaymentIdForAction = null;
}

async function doCancelPayment() {
  if (!currentPaymentIdForAction) return;

  try {
    hideCancelPaymentModal();
    showLoading(true, 'default', 'Cancelling payment...');
    await dbDeletePayment(currentPaymentIdForAction);
    showLoading(false);

    // Reload payments
    await loadPayments();

    showToast('Payment cancelled');
    currentPaymentIdForAction = null;
  } catch (error) {
    showLoading(false);
    console.error('Error cancelling payment:', error);
    showError('Failed to cancel payment. Please try again.');
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function showError(message) {
  alert(message);
}

function showToast(message) {
  // Use the app's toast function
  if (typeof toast === 'function') {
    toast(message);
  } else {
    // Fallback if toast is not available
    console.log('Toast:', message);
  }
}
