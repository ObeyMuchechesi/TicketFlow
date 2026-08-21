// POST /api/tickets/paynow-webhook
// Paynow calls this endpoint when a payment status changes.
// It receives { pollurl, reference, paynowreference, amount, status } and
// activates the ticket if the payment was successful.
//
// Paynow sends form-encoded data (application/x-www-form-urlencoded).

import { getServiceClient } from '../../../lib/supabase';
import { sendTicketConfirmation, sendTicketWhatsApp } from '../../../lib/tickets';

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Paynow sends form-encoded data
  const body = req.body || {};
  const status = String(body.status || '').toLowerCase();
  const reference = body.reference || body.pollurl || '';
  const paynowRef = body.paynowreference || '';
  const amount = Number(body.amount) || 0;

  console.log('Paynow webhook received:', { status, reference, paynowRef, amount });

  // Paynow statuses: "pending", "awaiting delivery", "delivered", "paid", "cancelled", "expired", "failed"
  const isPaid = status === 'paid' || status === 'delivered';

  if (!isPaid) {
    // Non-final status — just acknowledge receipt
    return res.json({ received: true, status });
  }

  const supabase = getServiceClient();

  try {
    // Find the payment by transaction reference
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .select('id, ticket_id, amount, status')
      .eq('transaction_ref', reference)
      .single();

    if (payErr || !payment) {
      console.log('Paynow webhook: payment not found for ref', reference);
      return res.json({ received: true, note: 'payment not found' });
    }

    if (payment.status === 'completed') {
      // Already processed (idempotent)
      return res.json({ received: true, note: 'already processed' });
    }

    // Update payment status
    await supabase
      .from('payments')
      .update({
        status: 'completed',
        paid_at: new Date().toISOString(),
        transaction_ref: paynowRef || reference,
      })
      .eq('id', payment.id);

    // Activate the ticket
    await supabase
      .from('tickets')
      .update({ status: 'active' })
      .eq('id', payment.ticket_id);

    // Fire-and-forget: send ticket confirmation via email + WhatsApp
    const { data: ticket } = await supabase
      .from('tickets')
      .select('*, ticket_types(*)')
      .eq('id', payment.ticket_id)
      .single();

    if (ticket) {
      const { data: event } = await supabase
        .from('events')
        .select('event_name, date, time, venue')
        .eq('id', ticket.event_id)
        .single();

      if (event) {
        sendTicketConfirmation({
          ticket,
          event,
          ticketType: ticket.ticket_types,
          isFree: false,
        }).catch(err => console.error('Email delivery failed:', err));

        sendTicketWhatsApp({
          ticket,
          event,
          ticketType: ticket.ticket_types,
          isFree: false,
        }).catch(err => console.error('WhatsApp delivery failed:', err));
      }
    }

    console.log(`Paynow webhook: ticket ${payment.ticket_id} activated`);
    return res.json({ received: true, activated: true });
  } catch (err) {
    console.error('Paynow webhook error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
