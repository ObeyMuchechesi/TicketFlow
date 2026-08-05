// ─────────────────────────────────────────────────────────────
// EcoCash USSD shortcode generation (Zimbabwe)
//
// Agent Code flow:   *151*2*<agentCode>*<amount>#
// Biller Code flow:  *151*1*<billerCode>*<reference>*<amount>#
// ─────────────────────────────────────────────────────────────

/**
 * Build a tap-to-dial EcoCash USSD string from the organiser's payment config.
 * @param {{type: 'agent'|'biller'|'none'|null, code: string, amount: number|string, reference: string}} opts
 * @returns {string|null} the shortcode (e.g. "*151*2*12345*15.00#") or null if not configured
 */
export function buildEcocashShortcode({ type, code, amount, reference }) {
  if (!type || type === 'none') return null;
  const amt = Number(amount).toFixed(2);
  const safeCode = String(code || '').replace(/[^0-9A-Za-z]/g, '').trim();
  const safeRef = String(reference || '').replace(/[^0-9A-Za-z]/g, '').trim();
  if (!safeCode) return null;

  if (type === 'biller') {
    // *151*1*<billerCode>*<reference>*<amount>#
    return `*151*1*${safeCode}*${safeRef}*${amt}#`;
  }
  // agent
  return `*151*2*${safeCode}*${amt}#`;
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
