// POST /api/tickets/paynow-init
// Initiates a Paynow EcoCash payment — sends a payment prompt to the buyer's phone.
//
// Body: { ticketToken, buyerPhone }
//   ticketToken — the qr_code_token of the pending ticket
//   buyerPhone  — the EcoCash number to send the prompt to
//
// Returns: { success, instructions, pollUrl, reference, ticketId }

import { getServiceClient } from '../../../lib/supabase';
import { initiateMobilePayment, initiateCheckout, isPaynowConfigured } from '../../../lib/paynow';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { ticketToken, buyerPhone } = req.body;
  if (!ticketToken || !buyerPhone) {
    return res.status(400).json({ error: 'Missing ticketToken or buyerPhone' });
  }

  if (!isPaynowConfigured()) {
    return res.status(400).json({ error: 'Paynow is not configured for this platform.' });
  }

  const supabase = getServiceClient();

  try {
    // Look up the pending ticket
    const { data: ticket, error: tkErr } = await supabase
      .from('tickets')
      .select('id, event_id, buyer_email, buyer_phone, status, qr_code_token')
      .eq('qr_code_token', ticketToken)
      .single();

    if (tkErr || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status === 'active') {
      return res.status(400).json({ error: 'This ticket is already active' });
    }

    // Look up the event and ticket type for pricing
    const { data: event } = await supabase
      .from('events')
      .select('event_name, ecocash_type, ecocash_phone')
      .eq('id', ticket.event_id)
      .single();

    const { data: payment } = await supabase
      .from('payments')
      .select('amount, transaction_ref')
      .eq('ticket_id', ticket.id)
      .single();

    if (!payment) {
      return res.status(400).json({ error: 'No payment record found for this ticket' });
    }

    const reference = payment.transaction_ref || `TF${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const amount = Number(payment.amount);
    const phone = (buyerPhone || '').replace(/[^0-9]/g, '');

    if (phone.length < 9) {
      return res.status(400).json({ error: 'Please enter a valid phone number (e.g. 0774401643)' });
    }

    // Try mobile prompt first (sends USSD prompt directly to phone)
    let result = await initiateMobilePayment({
      reference,
      amount,
      buyerPhone: phone,
      description: `Ticket — ${event?.event_name || 'Event'}`,
    });

    // If mobile prompt fails (e.g. desktop browser), fall back to hosted checkout
    if (!result.success) {
      result = await initiateCheckout({
        reference,
        amount,
        description: `Ticket — ${event?.event_name || 'Event'}`,
      });
    }

    if (!result.success) {
      return res.status(502).json({ error: result.error || 'Payment initiation failed' });
    }

    // Update the payment record with the poll URL so we can check status later
    await supabase
      .from('payments')
      .update({ transaction_ref: reference })
      .eq('ticket_id', ticket.id);

    return res.json({
      success: true,
      instructions: result.instructions || null,
      redirectUrl: result.redirectUrl || null,
      pollUrl: result.pollUrl || null,
      reference,
      ticketId: ticket.id,
      amount,
    });
  } catch (err) {
    console.error('Paynow init error:', err);
    return res.status(500).json({ error: 'Payment initiation failed. Please try again.' });
  }
}
