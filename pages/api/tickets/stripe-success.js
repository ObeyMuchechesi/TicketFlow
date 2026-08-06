import { getServiceClient } from '../../../lib/supabase';
import { sendTicketConfirmation } from '../../../lib/tickets';

export default async function handler(req, res) {
  const { session_id } = req.query;
  if (!session_id) return res.redirect('/');

  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') return res.redirect('/?error=payment_failed');

    const { eventId, ticketTypeId, quantity, buyerName, buyerEmail, buyerPhone, tokens: tokensStr, discount } = session.metadata;
    const tokens = tokensStr.split(',');
    const supabase = getServiceClient();

    // Get ticket type for price
    const { data: tt } = await supabase.from('ticket_types').select('*').eq('id', ticketTypeId).single();
    if (!tt) return res.redirect('/?error=invalid_event');

    const qty = Number(quantity);
    const discountPct = Number(discount || 0);
    const unitPrice = tt.price * (1 - discountPct / 100);

    // Create tickets
    const ticketInserts = tokens.map(token => ({
      event_id: eventId, ticket_type_id: ticketTypeId,
      buyer_name: buyerName, buyer_email: buyerEmail,
      buyer_phone: buyerPhone || null,
      qr_code_token: token, status: 'active',
    }));

    await supabase.from('tickets').insert(ticketInserts);
    await supabase.from('ticket_types').update({ quantity_sold: tt.quantity_sold + qty }).eq('id', ticketTypeId);

    // Record payment
    const { data: firstTicket } = await supabase.from('tickets').select('id').eq('qr_code_token', tokens[0]).single();
    if (firstTicket) {
      await supabase.from('payments').insert({
        ticket_id: firstTicket.id, amount: unitPrice * qty,
        currency: 'USD', payment_method: 'stripe',
        transaction_ref: session.payment_intent, status: 'completed',
        paid_at: new Date().toISOString(),
      });
    }

    // Fire-and-forget digital ticket email — never blocks the redirect
    Promise.all([
      supabase.from('events').select('event_name, date, time, venue').eq('id', eventId).single(),
      supabase.from('tickets').select('*').eq('qr_code_token', tokens[0]).single(),
    ]).then(([evRes, tkRes]) => {
      if (evRes.data && tkRes.data) {
        sendTicketConfirmation({ ticket: tkRes.data, event: evRes.data, ticketType: tt });
      }
    }).catch(err => console.error('Ticket email failed:', err));

    // Redirect to first ticket page
    return res.redirect(`/ticket/${tokens[0]}`);
  } catch (err) {
    console.error('Stripe success error:', err);
    return res.redirect('/?error=processing_failed');
  }
}
