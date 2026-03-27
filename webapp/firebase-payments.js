// Firebase Payments Service
// Handles all Firestore operations for the payments collection

/**
 * Add a new payment record
 * @param {Object} payment - Payment object
 * @returns {Promise<string>} Document ID
 */
async function firestoreAddPayment(payment) {
  try {
    const docRef = await db.collection('payments').add({
      from: payment.from || '',
      to: payment.to || '',
      amount: payment.amount || 0,
      paymentMethod: payment.paymentMethod || 'Other',
      note: payment.note || '',
      status: 'pending',
      confirmedBy: null,
      confirmedAt: null,
      rejectionReason: '',
      deleted: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding payment:', error);
    throw error;
  }
}

/**
 * Get all non-deleted payments
 * @returns {Promise<Array>} Array of payment objects
 */
async function firestoreGetAllPayments() {
  try {
    const snapshot = await db.collection('payments')
      .where('deleted', '==', false)
      .orderBy('createdAt', 'desc')
      .get();

    const payments = [];
    snapshot.forEach(doc => {
      payments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return payments;
  } catch (error) {
    console.error('Error getting payments:', error);
    throw error;
  }
}

/**
 * Get pending payments sent to a user (needing their confirmation)
 * @param {string} username - Username
 * @returns {Promise<Array>} Array of pending payments to confirm
 */
async function firestoreGetPendingPaymentsTo(username) {
  try {
    const snapshot = await db.collection('payments')
      .where('to', '==', username)
      .where('status', '==', 'pending')
      .where('deleted', '==', false)
      .orderBy('createdAt', 'desc')
      .get();

    const payments = [];
    snapshot.forEach(doc => {
      payments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return payments;
  } catch (error) {
    console.error('Error getting pending payments to user:', error);
    throw error;
  }
}

/**
 * Get pending payments sent by a user (awaiting confirmation)
 * @param {string} username - Username
 * @returns {Promise<Array>} Array of pending payments sent
 */
async function firestoreGetPendingPaymentsFrom(username) {
  try {
    const snapshot = await db.collection('payments')
      .where('from', '==', username)
      .where('status', '==', 'pending')
      .where('deleted', '==', false)
      .orderBy('createdAt', 'desc')
      .get();

    const payments = [];
    snapshot.forEach(doc => {
      payments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return payments;
  } catch (error) {
    console.error('Error getting pending payments from user:', error);
    throw error;
  }
}

/**
 * Confirm a payment
 * @param {string} id - Payment document ID
 * @param {string} confirmedBy - Username confirming the payment
 * @returns {Promise<void>}
 */
async function firestoreConfirmPayment(id, confirmedBy) {
  try {
    await db.collection('payments').doc(id).update({
      status: 'confirmed',
      confirmedBy: confirmedBy,
      confirmedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
}

/**
 * Reject a payment
 * @param {string} id - Payment document ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<void>}
 */
async function firestoreRejectPayment(id, reason) {
  try {
    await db.collection('payments').doc(id).update({
      status: 'rejected',
      rejectionReason: reason || '',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    throw error;
  }
}

/**
 * Soft delete a payment
 * @param {string} id - Payment document ID
 * @returns {Promise<void>}
 */
async function firestoreDeletePayment(id) {
  try {
    await db.collection('payments').doc(id).update({
      deleted: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    throw error;
  }
}

/**
 * Get confirmed payments (for settlement calculation)
 * @returns {Promise<Array>} Array of confirmed payments
 */
async function firestoreGetConfirmedPayments() {
  try {
    const snapshot = await db.collection('payments')
      .where('status', '==', 'confirmed')
      .where('deleted', '==', false)
      .get();

    const payments = [];
    snapshot.forEach(doc => {
      payments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return payments;
  } catch (error) {
    console.error('Error getting confirmed payments:', error);
    throw error;
  }
}
