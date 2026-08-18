// ─────────────────────────────────────────────────────────────
// EcoCash USSD shortcode generation (Zimbabwe)
//
// Agent/Merchant Code flow: *153*2*2<merchantCode>*<amount>#
// Biller Code flow:         *153*1*1*<billerCode>*<reference>*<amount>#
// Send Money flow:          *153*1*1*<phoneNumber>*<amount>#
// ─────────────────────────────────────────────────────────────

/**
 * Build a tap-to-dial EcoCash USSD string from the organiser's payment config.
 * @param {{type: 'agent'|'biller'|'number'|'none'|null, code: string, phone: string, amount: number|string, reference: string}} opts
 * @returns {string|null} the shortcode (e.g. "*153*2*212345*15.00#") or null if not configured
 */
export function buildEcocashShortcode({ type, code, phone, amount, reference }) {
  if (!type || type === 'none') return null;
  const amt = Number(amount).toFixed(2);
  const safeCode = String(code || '').replace(/[^0-9A-Za-z]/g, '').trim();
  const safeRef = String(reference || '').replace(/[^0-9A-Za-z]/g, '').trim();
  const safePhone = String(phone || '').replace(/[^0-9]/g, '').trim();

  if (type === 'biller') {
    // *153*1*1*<billerCode>*<reference>*<amount>#
    if (!safeCode) return null;
    return `*153*1*1*${safeCode}*${safeRef}*${amt}#`;
  }
  if (type === 'agent') {
    // *153*2*2<merchantCode>*<amount>#
    if (!safeCode) return null;
    return `*153*2*2${safeCode}*${amt}#`;
  }
  if (type === 'number') {
    // *153*1*1*<phoneNumber>*<amount>#  (Send Money to individual)
    if (!safePhone) return null;
    return `*153*1*1*${safePhone}*${amt}#`;
  }
  return null;
}

/** Generate a short human-friendly payment reference (e.g. TF8F3K2Q) */
export function generateEcocashReference() {
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  return `TF${ts}${rand}`;
}

/** tel: URI that dials the USSD string on mobile (Android dials USSD via tel:) */
export function dialableShortcode(shortcode) {
  if (!shortcode) return null;
  return `tel:${encodeURIComponent(shortcode)}`;
}
