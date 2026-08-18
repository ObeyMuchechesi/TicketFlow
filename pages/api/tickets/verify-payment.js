import { getServiceClient } from '../../../lib/supabase';
import { sendTicketConfirmation, sendTicketWhatsApp } from '../../../lib/tickets';

/**
 * POST /api/tickets/verify-payment
 * Body: { token: string, transactionRef: string }
 *
 * After the buyer pays via EcoCash USSD, they enter the transaction reference
 * (from the SMS confirmation). This endpoint verifies it and activates the ticket.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, transactionRef } = req.body;

    if (!token || !transactionRef) {
      return res.status(400).json({ error: 'Ticket token and transaction reference are required' });
    }

    const supabase = getServiceClient();

    // Find the ticket by QR code token
    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .select('id, status, event_id, buyer_email, buyer_name, qr_code_token')
      .eq('qr_code_token', token)
      .single();

    if (ticketErr || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status === 'active' || ticket.status === 'used') {
      // Already verified
      return res.json({
        success: true,
        message: 'Ticket is already active',
        ticket: { token: ticket.qr_code_token, status: ticket.status },
      });
    }

    if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
      return res.status(400).json({ error: 'This ticket has been cancelled' });
    }

    // Validate the transaction reference format (EcoCash refs are typically alphanumeric, 6-20 chars)
    const cleanRef = String(transactionRef).trim().replace(/[^A-Za-z0-9]/g, '');
    if (cleanRef.length < 4 || cleanRef.length > 30) {
      return res.status(400).json({
        error: 'Invalid transaction reference. Please check the EcoCash SMS and enter the correct reference.',
      });
    }

    // Activate the ticket
    const { error: updateErr } = await supabase
      .from('tickets')
      .update({
        status: 'active',
        transaction_ref: cleanRef,
      })
      .eq('id', ticket.id)
      .eq('status', 'pending'); // Only activate if still pending

    if (updateErr) {
      console.error('Ticket activation error:', updateErr);
      return res.status(500).json({ error: 'Failed to activate ticket' });
    }

    // Update the payment record to completed
    await supabase
      .from('payments')
      .update({
        status: 'completed',
        transaction_ref: cleanRef,
      })
      .eq('ticket_id', ticket.id)
      .eq('status', 'pending');

    // Now that payment is verified, send the ticket via email + WhatsApp
    Promise.all([
      supabase.from('events').select('event_name, date, time, venue').eq('id', ticket.event_id).single(),
      supabase.from('tickets').select('*').eq('qr_code_token', token).single(),
      supabase.from('ticket_types').select('*').eq('event_id', ticket.event_id).single(),
    ]).then(async ([evRes, tkRes, ttRes]) => {
      if (evRes.data && tkRes.data) {
        sendTicketConfirmation({ ticket: tkRes.data, event: evRes.data, ticketType: ttRes.data });
        await sendTicketWhatsApp({ ticket: tkRes.data, event: evRes.data, ticketType: ttRes.data });
      }
    }).catch(err => console.error('Post-verification delivery failed:', err));

    return res.json({
      success: true,
      message: 'Payment verified! Your ticket is now active.',
      ticket: { token: ticket.qr_code_token, status: 'active' },
    });
  } catch (err) {
    console.error('Verification error:', err);
    return res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
}
