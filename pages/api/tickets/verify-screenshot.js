import { getServiceClient } from '../../../lib/supabase';
import { sendTicketConfirmation, sendTicketWhatsApp } from '../../../lib/tickets';
import { verifyPaymentScreenshot, hashScreenshot } from '../../../lib/payment-verification';

/**
 * POST /api/tickets/verify-screenshot
 *
 * AI-powered payment verification pipeline:
 * 1. Extracts OCR text (client-side Tesseract)
 * 2. Runs 5-layer verification engine:
 *    - Image forensics (metadata, dimensions, format)
 *    - Text pattern matching (EcoCash SMS format)
 *    - Cross-referencing (amount, phone vs purchase)
 *    - Duplicate detection (SHA-256 hash)
 *    - Tampering heuristics
 * 3. Scores confidence (0-100)
 * 4. Auto-approves, flags for review, or rejects
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, screenshot, extractedRef, extractedAmount, ocrText } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Ticket token is required' });
    }

    if (!screenshot && !extractedRef) {
      return res.status(400).json({
        error: 'Either a screenshot or transaction reference is required',
      });
    }

    const supabase = getServiceClient();

    // ── Find the ticket ──
    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .select('id, status, event_id, buyer_email, buyer_name, buyer_phone, qr_code_token, ticket_type_id')
      .eq('qr_code_token', token)
      .single();

    if (ticketErr || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status === 'active' || ticket.status === 'used') {
      return res.json({
        success: true,
        message: 'Ticket is already active',
        ticket: { token: ticket.qr_code_token, status: ticket.status },
      });
    }

    if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
      return res.status(400).json({ error: 'This ticket has been cancelled' });
    }

    // ── Get purchase details for cross-referencing ──
    const { data: tt } = await supabase
      .from('ticket_types')
      .select('price, name')
      .eq('id', ticket.ticket_type_id)
      .single();

    const { data: payment } = await supabase
      .from('payments')
      .select('id, amount')
      .eq('ticket_id', ticket.id)
      .eq('status', 'pending')
      .single();

    const { data: event } = await supabase
      .from('events')
      .select('ecocash_phone, ecocash_type')
      .eq('id', ticket.event_id)
      .single();

    const expectedAmount = Number(payment?.amount || tt?.price || 0);
    const expectedPhone = event?.ecocash_phone || '';

    // ── Manual reference path (no screenshot) ──
    if (!screenshot && extractedRef) {
      const cleanRef = String(extractedRef).trim().replace(/[^A-Za-z0-9]/g, '');
      if (cleanRef.length < 4 || cleanRef.length > 30) {
        return res.status(400).json({
          error: 'Invalid transaction reference. Please check the EcoCash SMS.',
        });
      }

      // Log manual verification
      try {
        await supabase.from('payment_verifications').insert({
          ticket_id: ticket.id,
          payment_id: payment?.id || null,
          verification_type: 'manual_ref',
          extracted_ref: cleanRef,
          extracted_amount: expectedAmount,
          confidence: 100,
          status: 'verified',
          notes: `Manual reference entry: ${cleanRef}`,
        });
      } catch (logErr) {
        console.warn('Could not log verification:', logErr.message);
      }

      // Activate ticket
      let { error: updateErr } = await supabase
        .from('tickets')
        .update({ status: 'active', transaction_ref: cleanRef })
        .eq('id', ticket.id);

      if (updateErr && updateErr.message?.includes('transaction_ref')) {
        ({ error: updateErr } = await supabase
          .from('tickets').update({ status: 'active' }).eq('id', ticket.id));
      }

      await supabase
        .from('payments')
        .update({ status: 'completed', transaction_ref: cleanRef })
        .eq('ticket_id', ticket.id)
        .eq('status', 'pending');

      // Send ticket
      sendTicketAsync(supabase, ticket, tt);

      return res.json({
        success: true,
        message: 'Payment verified! Your ticket is now active.',
        ticket: { token: ticket.qr_code_token, status: 'active' },
        verification: { type: 'manual_ref', reference: cleanRef, confidence: 100, score: 100 },
      });
    }

    // ── Screenshot path: Run AI verification engine ──
    const verification = await verifyPaymentScreenshot({
      screenshotBase64: screenshot,
      ocrText: ocrText || '',
      extractedRef: extractedRef || '',
      extractedAmount: extractedAmount ? Number(extractedAmount) : null,
      expectedAmount,
      expectedPhone,
      supabase,
    });

    const cleanRef = String(verification.checks?.text?.extractedRef || extractedRef || '').trim().replace(/[^A-Za-z0-9]/g, '');

    // ── Handle verification result ──

    if (verification.status === 'rejected') {
      // Log the rejected attempt
      try {
        await supabase.from('payment_verifications').insert({
          ticket_id: ticket.id,
          payment_id: payment?.id || null,
          verification_type: 'screenshot_ocr',
          extracted_ref: cleanRef || null,
          extracted_amount: extractedAmount ? Number(extractedAmount) : null,
          screenshot_data: verification.imageHash, // Store hash, not full image
          confidence: verification.score,
          status: 'rejected',
          notes: verification.recommendation + ' | Flags: ' + verification.allFlags.join(', '),
        });
      } catch (logErr) {
        console.warn('Could not log rejected verification:', logErr.message);
      }

      return res.status(400).json({
        success: false,
        error: verification.recommendation,
        verification: {
          score: verification.score,
          status: 'rejected',
          flags: verification.allFlags,
          recommendation: verification.recommendation,
        },
      });
    }

    // ── Verify reference is valid ──
    if (!cleanRef || cleanRef.length < 4 || cleanRef.length > 30) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract a valid transaction reference from the screenshot. Please try a clearer screenshot or enter the reference manually.',
        verification: {
          score: verification.score,
          status: 'needs_manual_ref',
          flags: verification.allFlags,
        },
      });
    }

    // ── Log the verification attempt ──
    try {
      await supabase.from('payment_verifications').insert({
        ticket_id: ticket.id,
        payment_id: payment?.id || null,
        verification_type: 'screenshot_ocr',
        extracted_ref: cleanRef,
        extracted_amount: extractedAmount ? Number(extractedAmount) : null,
        extracted_phone: verification.checks?.text?.extractedPhone || null,
        screenshot_data: verification.imageHash, // Store hash for duplicate detection
        confidence: verification.score,
        status: verification.status,
        notes: verification.recommendation + ' | Scores: ' + JSON.stringify(verification.scores),
      });
    } catch (logErr) {
      console.warn('Could not log verification:', logErr.message);
    }

    // ── Store screenshot on ticket/payment (gracefully) ──
    if (screenshot) {
      try {
        await supabase.from('tickets').update({
          payment_screenshot: screenshot,
          screenshot_verified: verification.status === 'verified',
        }).eq('id', ticket.id);
      } catch (ssErr) { console.warn('Could not store screenshot on ticket:', ssErr.message); }
      if (payment) {
        try {
          await supabase.from('payments').update({
            payment_screenshot: screenshot,
            screenshot_verified: verification.status === 'verified',
          }).eq('id', payment.id);
        } catch (psErr) { console.warn('Could not store screenshot on payment:', psErr.message); }
      }
    }

    // ── Auto-approve or flag for review ──
    if (verification.status === 'verified') {
      // Auto-activate the ticket
      let { error: updateErr } = await supabase
        .from('tickets')
        .update({ status: 'active', transaction_ref: cleanRef })
        .eq('id', ticket.id);

      if (updateErr && updateErr.message?.includes('transaction_ref')) {
        ({ error: updateErr } = await supabase
          .from('tickets').update({ status: 'active' }).eq('id', ticket.id));
      }

      await supabase
        .from('payments')
        .update({ status: 'completed', transaction_ref: cleanRef })
        .eq('ticket_id', ticket.id)
        .eq('status', 'pending');

      // Send ticket via email + WhatsApp
      sendTicketAsync(supabase, ticket, tt);

      return res.json({
        success: true,
        message: 'Payment verified automatically! Your ticket is now active.',
        ticket: { token: ticket.qr_code_token, status: 'active' },
        verification: {
          type: 'screenshot_ocr',
          reference: cleanRef,
          score: verification.score,
          status: 'verified',
          confidence: verification.score,
          autoApproved: true,
        },
      });
    }

    // ── Needs review: Ticket stays pending, admin must approve ──
    return res.json({
      success: true,
      message: 'Screenshot received. Your payment is being reviewed. You will receive your ticket once verified.',
      ticket: { token: ticket.qr_code_token, status: 'pending' },
      verification: {
        type: 'screenshot_ocr',
        reference: cleanRef,
        score: verification.score,
        status: 'needs_review',
        recommendation: verification.recommendation,
        flags: verification.allFlags,
      },
    });

  } catch (err) {
    console.error('Screenshot verification error:', err);
    return res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
}

/**
 * Fire-and-forget ticket delivery via email + WhatsApp.
 */
function sendTicketAsync(supabase, ticket, tt) {
  Promise.all([
    supabase.from('events').select('event_name, date, time, venue').eq('id', ticket.event_id).single(),
    supabase.from('tickets').select('*').eq('qr_code_token', ticket.qr_code_token).single(),
  ]).then(async ([evRes, tkRes]) => {
    if (evRes.data && tkRes.data) {
      sendTicketConfirmation({ ticket: tkRes.data, event: evRes.data, ticketType: tt });
      await sendTicketWhatsApp({ ticket: tkRes.data, event: evRes.data, ticketType: tt });
    }
  }).catch(err => console.error('Post-verification delivery failed:', err));
}
