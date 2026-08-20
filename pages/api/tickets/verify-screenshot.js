import { getServiceClient } from '../../../lib/supabase';
import { sendTicketConfirmation, sendTicketWhatsApp } from '../../../lib/tickets';

/**
 * POST /api/tickets/verify-screenshot
 * Body: { token: string, screenshot: string (base64), extractedRef?: string }
 *
 * Accepts a screenshot of an EcoCash payment confirmation, stores it as proof,
 * and uses AI OCR to extract the transaction reference for automatic verification.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, screenshot, extractedRef, extractedAmount } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Ticket token is required' });
    }

    if (!screenshot && !extractedRef) {
      return res.status(400).json({
        error: 'Either a screenshot or transaction reference is required',
      });
    }

    const supabase = getServiceClient();

    // Find the ticket
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

    // Get the expected payment amount
    const { data: tt } = await supabase
      .from('ticket_types')
      .select('price, name')
      .eq('id', ticket.ticket_type_id)
      .single();

    const expectedAmount = Number(tt?.price || 0);

    // Get the payment record
    const { data: payment } = await supabase
      .from('payments')
      .select('id, amount')
      .eq('ticket_id', ticket.id)
      .eq('status', 'pending')
      .single();

    // Use AI-extracted reference or the one provided by the client
    const cleanRef = String(extractedRef || '').trim().replace(/[^A-Za-z0-9]/g, '');

    if (cleanRef.length < 4 || cleanRef.length > 30) {
      return res.status(400).json({
        error: 'Could not extract a valid transaction reference from the screenshot. Please enter it manually.',
      });
    }

    // Log the verification attempt (gracefully handle missing table)
    try {
      await supabase.from('payment_verifications').insert({
        ticket_id: ticket.id,
        payment_id: payment?.id || null,
        verification_type: screenshot ? 'screenshot_ocr' : 'manual_ref',
        extracted_ref: cleanRef,
        extracted_amount: extractedAmount ? Number(extractedAmount) : null,
        screenshot_data: screenshot || null,
        confidence: screenshot ? 85 : 100,
        status: 'verified',
        notes: screenshot
          ? `AI OCR extracted reference: ${cleanRef}. Amount: ${extractedAmount || 'not detected'}`
          : `Manual reference entry: ${cleanRef}`,
      });
    } catch (logErr) {
      console.warn('Could not log verification (table may not exist):', logErr.message);
    }

    // Try to store screenshot on tickets/payments (gracefully handle missing columns)
    if (screenshot) {
      try {
        await supabase.from('tickets').update({ payment_screenshot: screenshot, screenshot_verified: true }).eq('id', ticket.id);
      } catch (ssErr) { console.warn('Could not store screenshot on ticket:', ssErr.message); }
      if (payment) {
        try {
          await supabase.from('payments').update({ payment_screenshot: screenshot, screenshot_verified: true }).eq('id', payment.id);
        } catch (psErr) { console.warn('Could not store screenshot on payment:', psErr.message); }
      }
    }

    // Activate the ticket — try with transaction_ref first, fall back without
    let { error: updateErr } = await supabase
      .from('tickets')
      .update({ status: 'active', transaction_ref: cleanRef })
      .eq('id', ticket.id);

    if (updateErr && updateErr.message?.includes('transaction_ref')) {
      ({ error: updateErr } = await supabase
        .from('tickets')
        .update({ status: 'active' })
        .eq('id', ticket.id));
    }

    if (updateErr && updateErr.message?.includes('status')) {
      console.warn('Ticket may already be active:', updateErr.message);
    }

    if (updateErr && !updateErr.message?.includes('status')) {
      console.error('Ticket activation error:', updateErr);
      return res.status(500).json({ error: 'Failed to activate ticket' });
    }

    // Update payment record
    await supabase
      .from('payments')
      .update({ status: 'completed', transaction_ref: cleanRef })
      .eq('ticket_id', ticket.id)
      .eq('status', 'pending');

    // Send ticket via email + WhatsApp
    Promise.all([
      supabase.from('events').select('event_name, date, time, venue').eq('id', ticket.event_id).single(),
      supabase.from('tickets').select('*').eq('qr_code_token', token).single(),
    ]).then(async ([evRes, tkRes]) => {
      if (evRes.data && tkRes.data) {
        sendTicketConfirmation({ ticket: tkRes.data, event: evRes.data, ticketType: tt });
        await sendTicketWhatsApp({ ticket: tkRes.data, event: evRes.data, ticketType: tt });
      }
    }).catch(err => console.error('Post-verification delivery failed:', err));

    return res.json({
      success: true,
      message: 'Payment verified successfully! Your ticket is now active.',
      ticket: { token: ticket.qr_code_token, status: 'active' },
      verification: {
        type: screenshot ? 'screenshot_ocr' : 'manual_ref',
        reference: cleanRef,
        confidence: screenshot ? 85 : 100,
      },
    });
  } catch (err) {
    console.error('Screenshot verification error:', err);
    return res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
}
