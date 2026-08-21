// GET /api/tickets/paynow-status?token=<qr_code_token>
// Polls the Paynow payment status for a pending ticket.
// The frontend calls this every few seconds after initiating a Paynow payment.

import { getServiceClient } from '../../../lib/supabase';
import { checkPaymentStatus } from '../../../lib/paynow';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const supabase = getServiceClient();

  try {
    // Get the ticket and its payment
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, status, event_id')
      .eq('qr_code_token', token)
      .single();

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // If already active, no need to poll
    if (ticket.status === 'active') {
      return res.json({ status: 'active', paid: true });
    }

    // Check if we have a poll URL stored (from the paynow-init response)
    // For now, check the payment status directly
    const { data: payment } = await supabase
      .from('payments')
      .select('status, transaction_ref')
      .eq('ticket_id', ticket.id)
      .single();

    if (!payment) {
      return res.json({ status: ticket.status, paid: false });
    }

    // If payment is already completed in our DB, activate the ticket
    if (payment.status === 'completed') {
      if (ticket.status !== 'active') {
        await supabase
          .from('tickets')
          .update({ status: 'active' })
          .eq('id', ticket.id);
      }
      return res.json({ status: 'active', paid: true });
    }

    return res.json({ status: ticket.status, paid: false });
  } catch (err) {
    console.error('Paynow status error:', err);
    return res.status(500).json({ error: 'Status check failed' });
  }
}
