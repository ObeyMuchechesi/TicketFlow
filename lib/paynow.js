// ─────────────────────────────────────────────────────────────
// Paynow Zimbabwe — payment gateway helper
//
// Uses the official `paynow` npm SDK to:
//   1. Send an EcoCash payment prompt directly to the buyer's phone
//   2. Poll for payment status
//   3. Confirm / deny the transaction
//
// Requires env vars: PAYNOW_INTEGRATION_ID, PAYNOW_INTEGRATION_KEY
// ─────────────────────────────────────────────────────────────

let _paynowInstance = null;

/**
 * Get or create a Paynow SDK instance.
 * Lazily initialised so the rest of the app never crashes if the
 * env vars are missing — functions below return null instead.
 */
function getClient() {
  if (_paynowInstance) return _paynowInstance;

  const integrationId = process.env.PAYNOW_INTEGRATION_ID;
  const integrationKey = process.env.PAYNOW_INTEGRATION_KEY;

  if (!integrationId || !integrationKey) return null;

  // Dynamic import so the module is only loaded server-side
  // and doesn't blow up if `paynow` isn't installed yet.
  try {
    // paynow v2 uses CommonJS require
    // eslint-disable-next-line global-require
    const { Paynow } = require('paynow');
    const pw = new Paynow(integrationId, integrationKey);

    // Where Paynow POSTs payment status updates (server-to-server webhook)
    pw.resultUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tickets/paynow-webhook`;

    // Where the user is sent back after completing (or cancelling) payment on
    // Paynow's hosted checkout page. We include the reference in the query
    // string so the front-end can show a meaningful result.
    pw.returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/events`;

    _paynowInstance = pw;
    return _paynowInstance;
  } catch (err) {
    console.error('Failed to initialise Paynow SDK:', err.message);
    return null;
  }
}

/**
 * Check whether Paynow credentials are configured.
 */
export function isPaynowConfigured() {
  return Boolean(getClient());
}

/**
 * Send an EcoCash payment prompt directly to the buyer's phone.
 *
 * @param {object} opts
 * @param {string} opts.reference   — Unique reference for this payment (e.g. TF8F3K2Q)
 * @param {number} opts.amount      — Amount in USD (e.g. 25)
 * @param {string} opts.buyerPhone  — EcoCash number to send the prompt to (e.g. 0774401643)
 * @param {string} opts.description — What the payment is for (e.g. "VIP Ticket — Afrobeats Night")
 * @returns {Promise<{success: boolean, instructions?: string, pollUrl?: string, error?: string}>}
 */
export async function initiateMobilePayment({ reference, amount, buyerPhone, description }) {
  const pw = getClient();
  if (!pw) {
    return { success: false, error: 'Paynow is not configured. Please add your integration credentials.' };
  }

  if (!buyerPhone || !amount || amount <= 0) {
    return { success: false, error: 'Invalid payment parameters' };
  }

  try {
    // Create a payment with a reference
    const payment = pw.createPayment(reference);
    payment.add(description || 'Event Ticket', Math.round(amount));

    // Send as a mobile (EcoCash) prompt to the buyer's phone
    const response = await pw.sendMobile(payment, buyerPhone, 'ecocash');

    if (response.success) {
      return {
        success: true,
        instructions: response.instructions, // e.g. "Dial *153*1*1*..."
        pollUrl: response.pollUrl,            // URL to poll for status
        reference,
      };
    }

    return {
      success: false,
      error: response.error || 'Payment initiation failed. Please try again.',
    };
  } catch (err) {
    console.error('Paynow mobile payment error:', err);
    return {
      success: false,
      error: 'Payment service temporarily unavailable. Please try again.',
    };
  }
}

/**
 * Send an EcoCash payment prompt via hosted checkout page (redirect flow).
 * Useful for desktop users who can't receive a mobile prompt.
 *
 * @param {string} reference
 * @param {number} amount
 * @returns {Promise<{success: boolean, redirectUrl?: string, error?: string}>}
 */
export async function initiateCheckout({ reference, amount, description }) {
  const pw = getClient();
  if (!pw) {
    return { success: false, error: 'Paynow is not configured.' };
  }

  try {
    const payment = pw.createPayment(reference);
    payment.add(description || 'Event Ticket', Math.round(amount));

    const response = await pw.send(payment);

    if (response.success) {
      return {
        success: true,
        redirectUrl: response.redirectUrl,
        pollUrl: response.pollUrl,
        reference,
      };
    }

    return { success: false, error: response.error || 'Checkout failed' };
  } catch (err) {
    console.error('Paynow checkout error:', err);
    return { success: false, error: 'Payment service unavailable.' };
  }
}

/**
 * Poll Paynow for the status of a transaction.
 *
 * @param {string} pollUrl — the poll URL returned by initiateMobilePayment / initiateCheckout
 * @returns {Promise<{paid: boolean, status: string, reference?: string}>}
 */
export async function checkPaymentStatus(pollUrl) {
  const pw = getClient();
  if (!pw) {
    return { paid: false, status: 'unknown', error: 'Paynot configured' };
  }

  try {
    const status = await pw.pollTransaction(pollUrl);
    return {
      paid: status.paid(),
      status: status.status || 'unknown',
    };
  } catch (err) {
    console.error('Paynow status check error:', err);
    return { paid: false, status: 'error', error: err.message };
  }
}
