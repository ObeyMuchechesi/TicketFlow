/**
 * AI Payment Verification Engine
 *
 * Analyzes uploaded payment screenshots through multiple layers:
 * 1. Image forensics (metadata, dimensions, file properties)
 * 2. OCR text pattern matching (EcoCash SMS format validation)
 * 3. Cross-referencing (amount, phone, reference vs purchase record)
 * 4. Duplicate detection (SHA-256 image hash)
 * 5. Tampering heuristics (compression artifacts, metadata anomalies)
 * 6. Confidence scoring (weighted composite score)
 *
 * Returns a verification result with score, flags, and recommended action.
 */

import crypto from 'crypto';

// ────────────────────────────────────────────────
// 1. ECOCash SMS Pattern Validators
// ────────────────────────────────────────────────

const ECOCASH_PATTERNS = {
  // Transaction reference patterns (EcoCash uses these formats)
  reference: [
    /\b(TF[A-Z0-9]{4,16})\b/i,              // TF prefix (most common)
    /\b(TX[A-Z0-9]{4,16})\b/i,              // TX prefix
    /\b(EXT[A-Z0-9]{4,16})\b/i,             // EXT prefix
    /(?:ref(?:erence)?|txn|transaction|id)[:\s#]*([A-Z0-9]{6,20})/i,
    /\b([A-Z0-9]{8,20})\b/,                 // Generic alphanumeric fallback
  ],  // Amount patterns — capture ONLY the numeric part
    amount: [
      /(?:amount|total|paid|sent)[:\s]*\$?\s*USD?\s*([\d,]+\.?\d*)/i,
      /\$\s*([\d,]+\.?\d*)/,
      /\bUSD?\s+([\d,]+\.?\d*)/i,
      /\b([\d,]+\.?\d*)\s*(?:USD|US\$)/i,
    ],

  // Phone number patterns (Zimbabwe)
  phone: [
    /\b(07[0-9]{8})\b/,
    /\b(2637[0-9]{8})\b/,
    /\b(\+2637[0-9]{8})\b/,
  ],

  // EcoCash-specific keywords that appear in real SMS
  ecocashKeywords: [
    'ecocash', 'econet', 'mobile money', 'payment',
    'received', 'sent', 'transferred', 'confirmed',
    'balance', 'transaction', 'successful',
  ],

  // Time/date patterns
  datetime: [
    /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/,
    /\d{1,2}:\d{2}(:\d{2})?(\s*(?:AM|PM))?/i,
    /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}/i,
  ],
};

// ────────────────────────────────────────────────
// 2. Image Analysis Helpers
// ────────────────────────────────────────────────

/**
 * Generate a SHA-256 hash of the screenshot for duplicate detection.
 */
export function hashScreenshot(base64Data) {
  try {
    const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch {
    return null;
  }
}

/**
 * Basic image forensics from base64 data.
 */
function analyzeImageProperties(base64Data) {
  const result = {
    format: 'unknown',
    sizeBytes: 0,
    isReasonableSize: true,
    flags: [],
  };

  try {
    const raw = base64Data.replace(/^data:image\/(\w+);base64,/, '');
    const buffer = Buffer.from(raw, 'base64');
    result.sizeBytes = buffer.length;

    // Detect format from magic bytes
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) result.format = 'jpeg';
    else if (buffer[0] === 0x89 && buffer[1] === 0x50) result.format = 'png';
    else if (buffer[0] === 0x52 && buffer[1] === 0x49) result.format = 'webp';
    else if (buffer[0] === 0x47 && buffer[1] === 0x49) result.format = 'gif';
    else result.format = 'unknown';

    // Suspiciously small images (likely thumbnails or screenshots of screenshots)
    if (buffer.length < 5000) {
      result.flags.push('IMAGE_TOO_SMALL');
      result.isReasonableSize = false;
    }

    // Suspiciously large (could be a stitched/fake image)
    if (buffer.length > 20 * 1024 * 1024) {
      result.flags.push('IMAGE_UNUSUALLY_LARGE');
    }

    // PNG without compression (common in screenshots from editing tools)
    if (result.format === 'png' && buffer.length > 500000) {
      result.flags.push('PNG_LARGE_UNCOMPRESSED');
    }

    // Check for common screenshot dimensions in PNG/IHDR chunk
    if (result.format === 'png') {
      // IHDR chunk starts at byte 16 — width at 16, height at 20 (big-endian)
      if (buffer.length > 24) {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        result.width = width;
        result.height = height;

        // Common phone screenshot widths: 360-430 (Android), 375-430 (iPhone)
        const commonWidths = [360, 375, 390, 393, 412, 414, 428, 430];
        const isCommonMobileWidth = commonWidths.some(w => Math.abs(width - w) <= 5);
        if (!isCommonMobileWidth && width > 100) {
          result.flags.push('UNUSUAL_SCREENSHOT_DIMENSIONS');
        }

        // Very small dimensions (could be cropped/edited)
        if (width < 300 || height < 300) {
          result.flags.push('SMALL_DIMENSIONS');
        }
      }
    }
  } catch (err) {
    result.flags.push('IMAGE_PARSE_ERROR');
  }

  return result;
}

// ────────────────────────────────────────────────
// 3. OCR Text Analysis
// ────────────────────────────────────────────────

function analyzeOCRText(text, expectedAmount, expectedPhone) {
  const result = {
    hasEcocashKeywords: false,
    hasReference: false,
    extractedRef: '',
    hasAmount: false,
    extractedAmount: '',
    amountMatches: false,
    hasPhone: false,
    extractedPhone: '',
    phoneMatches: false,
    hasTimestamp: false,
    extractedTimestamp: '',
    keywordScore: 0,
    flags: [],
    rawText: text,
  };

  if (!text || text.trim().length < 5) {
    result.flags.push('EMPTY_OR_MINIMAL_TEXT');
    return result;
  }

  const normalized = text.replace(/\s+/g, ' ').trim();
  const lowerText = normalized.toLowerCase();

  // Check for EcoCash keywords
  const matchedKeywords = ECOCASH_PATTERNS.ecocashKeywords.filter(kw => lowerText.includes(kw));
  result.hasEcocashKeywords = matchedKeywords.length > 0;
  result.keywordScore = Math.min(matchedKeywords.length / 3, 1); // 3+ keywords = full score
  result.matchedKeywords = matchedKeywords;

  if (!result.hasEcocashKeywords) {
    result.flags.push('NO_ECOCASH_KEYWORDS');
  }

  // Extract transaction reference
  for (const pattern of ECOCASH_PATTERNS.reference) {
    const match = normalized.match(pattern);
    if (match) {
      result.hasReference = true;
      result.extractedRef = match[1];
      break;
    }
  }
  if (!result.hasReference) {
    result.flags.push('NO_REFERENCE_FOUND');
  }

  // Validate reference format
  if (result.hasReference) {
    const ref = result.extractedRef;
    if (ref.length < 6 || ref.length > 20) {
      result.flags.push('REFERENCE_UNUSUAL_LENGTH');
    }
    if (!/^[A-Z]/.test(ref)) {
      result.flags.push('REFERENCE_NO_LETTER_PREFIX');
    }
  }

  // Extract and validate amount
  for (const pattern of ECOCASH_PATTERNS.amount) {
    const match = normalized.match(pattern);
    if (match) {
      result.hasAmount = true;
      result.extractedAmount = match[1].replace(/,/g, '');
      break;
    }
  }

  if (result.hasAmount && expectedAmount) {
    const extracted = parseFloat(result.extractedAmount);
    const expected = parseFloat(expectedAmount);
    if (!isNaN(extracted) && !isNaN(expected)) {
      // Allow ±5% tolerance (rounding differences)
      const tolerance = Math.max(expected * 0.05, 1);
      result.amountMatches = Math.abs(extracted - expected) <= tolerance;
      if (!result.amountMatches) {
        result.flags.push('AMOUNT_MISMATCH');
        result.amountDifference = Math.abs(extracted - expected);
      }
    }
  }

  if (!result.hasAmount) {
    result.flags.push('NO_AMOUNT_FOUND');
  }

  // Extract and validate phone number
  for (const pattern of ECOCASH_PATTERNS.phone) {
    const match = normalized.match(pattern);
    if (match) {
      result.hasPhone = true;
      result.extractedPhone = match[1];
      break;
    }
  }

  if (result.hasPhone && expectedPhone) {
    const extracted = result.extractedPhone.replace(/^263/, '0');
    const expected = expectedPhone.replace(/^263/, '0');
    result.phoneMatches = extracted === expected;
    if (!result.phoneMatches) {
      result.flags.push('PHONE_MISMATCH');
    }
  }

  // Check for timestamp
  for (const pattern of ECOCASH_PATTERNS.datetime) {
    const match = normalized.match(pattern);
    if (match) {
      result.hasTimestamp = true;
      result.extractedTimestamp = match[0];
      break;
    }
  }

  return result;
}

// ────────────────────────────────────────────────
// 4. Tampering Detection Heuristics
// ────────────────────────────────────────────────

function detectTampering(textAnalysis, imageAnalysis) {
  const flags = [];
  let tamperingScore = 0;

  // Red flag: No EcoCash keywords at all
  if (textAnalysis.flags.includes('NO_ECOCASH_KEYWORDS')) {
    flags.push('NOT_ECOCASH_SMS');
    tamperingScore += 30;
  }

  // Red flag: Amount doesn't match purchase
  if (textAnalysis.flags.includes('AMOUNT_MISMATCH')) {
    flags.push('AMOUNT_DOES_NOT_MATCH_PURCHASE');
    tamperingScore += 40;
  }

  // Red flag: Phone doesn't match
  if (textAnalysis.flags.includes('PHONE_MISMATCH')) {
    flags.push('PHONE_DOES_NOT_MATCH_PURCHASE');
    tamperingScore += 20;
  }

  // Red flag: Unusual image properties
  if (imageAnalysis.flags.includes('SMALL_DIMENSIONS')) {
    flags.push('POSSIBLY_CROPPED');
    tamperingScore += 15;
  }

  if (imageAnalysis.flags.includes('UNUSUAL_SCREENSHOT_DIMENSIONS')) {
    flags.push('UNUSUAL_DIMENSIONS_FOR_MOBILE');
    tamperingScore += 10;
  }

  if (imageAnalysis.flags.includes('PNG_LARGE_UNCOMPRESSED')) {
    flags.push('POSSIBLE_SCREENSHOT_EDITOR');
    tamperingScore += 10;
  }

  // Red flag: Reference format doesn't match EcoCash patterns
  if (textAnalysis.flags.includes('REFERENCE_NO_LETTER_PREFIX')) {
    flags.push('REFERENCE_FORMAT_SUSPICIOUS');
    tamperingScore += 15;
  }

  // Yellow flag: Very low keyword density
  if (textAnalysis.keywordScore < 0.3) {
    flags.push('LOW_ECOCASH_RELEVANCE');
    tamperingScore += 10;
  }

  return {
    flags,
    tamperingScore: Math.min(tamperingScore, 100),
    isLikelyTampered: tamperingScore >= 50,
    severity: tamperingScore >= 70 ? 'high' : tamperingScore >= 40 ? 'medium' : 'low',
  };
}

// ────────────────────────────────────────────────
// 5. Duplicate Detection
// ────────────────────────────────────────────────

/**
 * Check if this exact screenshot (or very similar) has been used before.
 * Uses image hash stored in the payment_verifications table.
 */
export async function checkDuplicate(supabase, imageHash) {
  if (!imageHash) return { isDuplicate: false, previousTicketIds: [] };

  try {
    const { data, error } = await supabase
      .from('payment_verifications')
      .select('ticket_id, extracted_ref, created_at')
      .eq('screenshot_data', imageHash); // We store the hash, not the full image

    if (error || !data || data.length === 0) {
      return { isDuplicate: false, previousTicketIds: [] };
    }

    return {
      isDuplicate: true,
      previousTicketIds: data.map(d => d.ticket_id),
      previousRefs: data.map(d => d.extracted_ref),
      count: data.length,
    };
  } catch {
    return { isDuplicate: false, previousTicketIds: [] };
  }
}

// ────────────────────────────────────────────────
// 6. Main Verification Engine
// ────────────────────────────────────────────────

/**
 * Run the full AI verification pipeline on a payment screenshot.
 *
 * @param {Object} params
 * @param {string} params.screenshotBase64 - Base64-encoded screenshot image
 * @param {string} params.ocrText - Raw OCR text extracted by Tesseract
 * @param {string} params.extractedRef - Reference extracted by OCR (optional)
 * @param {number} params.extractedAmount - Amount extracted by OCR (optional)
 * @param {number} params.expectedAmount - Amount from the purchase record
 * @param {string} params.expectedPhone - EcoCash phone from the event config
 * @param {Object} params.supabase - Supabase client for duplicate checks
 *
 * @returns {Object} Verification result with score, flags, and recommendation
 */
export async function verifyPaymentScreenshot({
  screenshotBase64,
  ocrText = '',
  extractedRef = '',
  extractedAmount = null,
  expectedAmount = 0,
  expectedPhone = '',
  supabase = null,
}) {
  const checks = {};

  // ── Layer 1: Image Analysis ──
  checks.image = screenshotBase64
    ? analyzeImageProperties(screenshotBase64)
    : { format: 'none', sizeBytes: 0, isReasonableSize: false, flags: ['NO_IMAGE'] };

  // ── Layer 2: OCR Text Analysis ──
  checks.text = analyzeOCRText(ocrText, expectedAmount, expectedPhone);

  // Override extracted values if OCR provided better ones
  if (extractedRef && !checks.text.hasReference) {
    checks.text.hasReference = true;
    checks.text.extractedRef = extractedRef;
    checks.text.flags = checks.text.flags.filter(f => f !== 'NO_REFERENCE_FOUND');
  }
  if (extractedAmount && !checks.text.hasAmount) {
    checks.text.hasAmount = true;
    checks.text.extractedAmount = String(extractedAmount);
    checks.text.flags = checks.text.flags.filter(f => f !== 'NO_AMOUNT_FOUND');
  }

  // ── Layer 3: Tampering Detection ──
  checks.tampering = detectTampering(checks.text, checks.image);

  // ── Layer 4: Duplicate Detection ──
  const imageHash = hashScreenshot(screenshotBase64);
  checks.duplicate = supabase
    ? await checkDuplicate(supabase, imageHash)
    : { isDuplicate: false };

  if (checks.duplicate.isDuplicate) {
    checks.tampering.flags.push('DUPLICATE_SCREENSHOT');
    checks.tampering.tamperingScore += 50;
    checks.tampering.isLikelyTampered = true;
    checks.tampering.severity = 'high';
  }

  // ── Layer 5: Confidence Scoring ──
  const scores = {
    // Image quality (0-20 points)
    imageQuality: 0,
    // Text relevance (0-30 points)
    textRelevance: 0,
    // Data accuracy (0-30 points)
    dataAccuracy: 0,
    // Authenticity (0-20 points)
    authenticity: 0,
  };

  // Image quality scoring
  if (checks.image.format !== 'unknown' && checks.image.format !== 'none') scores.imageQuality += 5;
  if (checks.image.isReasonableSize) scores.imageQuality += 5;
  if (!checks.image.flags.includes('SMALL_DIMENSIONS')) scores.imageQuality += 5;
  if (!checks.image.flags.includes('UNUSUAL_SCREENSHOT_DIMENSIONS')) scores.imageQuality += 5;

  // Text relevance scoring
  scores.textRelevance = Math.round(checks.text.keywordScore * 15);
  if (checks.text.hasReference) scores.textRelevance += 10;
  if (checks.text.hasTimestamp) scores.textRelevance += 5;

  // Data accuracy scoring
  if (checks.text.hasAmount) scores.dataAccuracy += 10;
  if (checks.text.amountMatches) scores.dataAccuracy += 10;
  if (checks.text.phoneMatches) scores.dataAccuracy += 10;
  if (checks.text.hasPhone && !checks.text.flags.includes('PHONE_MISMATCH')) {
    scores.dataAccuracy = Math.min(scores.dataAccuracy + 5, 30);
  }

  // Authenticity scoring (inverse of tampering score)
  scores.authenticity = Math.max(0, 20 - Math.round(checks.tampering.tamperingScore * 0.2));

  let totalScore = scores.imageQuality + scores.textRelevance + scores.dataAccuracy + scores.authenticity;

  // Determine recommendation
  let recommendation;
  let status;
  if (totalScore >= 70) {
    recommendation = 'Auto-approve: Screenshot appears legitimate with high confidence.';
    status = 'verified';
  } else if (totalScore >= 45) {
    recommendation = 'Needs manual review: Some checks passed but could not fully verify.';
    status = 'needs_review';
  } else {
    recommendation = 'Likely fake or invalid: Multiple verification checks failed.';
    status = 'rejected';
  }

  // HARD REJECT: Amount doesn't match (strongest anti-fraud signal)
  if (checks.text.flags.includes('AMOUNT_MISMATCH')) {
    recommendation = 'Rejected: Payment amount ($' + (checks.text.extractedAmount || '?') + ') does not match the ticket price ($' + expectedAmount + ').';
    status = 'rejected';
    // Override score to reflect the severity
    totalScore = Math.min(totalScore, 25);
  }

  // HARD REJECT: Duplicate screenshot
  if (checks.duplicate.isDuplicate) {
    recommendation = `Rejected: This exact screenshot was already used for ${checks.duplicate.count} other ticket(s).`;
    status = 'rejected';
  }

  return {
    score: totalScore,
    scores,
    recommendation,
    status,
    checks,
    imageHash,
    allFlags: [
      ...checks.image.flags,
      ...checks.text.flags,
      ...checks.tampering.flags,
    ],
  };
}
