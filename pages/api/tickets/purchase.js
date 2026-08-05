import { getServiceClient } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { eventId, ticketTypeId, quantity, buyerName, buyerEmail, buyerPhone, paymentMethod, promoCode } = req.body;
  if (!eventId || !ticketTypeId || !quantity || !buyerName || !buyerEmail)
    return res.status(400).json({ error: 'Missing required fields' });

  const supabase = getServiceClient();

  try {
    // Verify ticket type and check availability
    const { data: tt, error: ttErr } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('id', ticketTypeId)
      .eq('event_id', eventId)
      .single();

    if (ttErr || !tt) return res.status(404).json({ error: 'Ticket type not found' });

    const remaining = tt.quantity_available - tt.quantity_sold;
    if (remaining < quantity) return res.status(400).json({ error: `Only ${remaining} tickets remaining` });

    // Apply promo code if provided
    let discount = 0;
    if (promoCode) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('event_id', eventId)
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();
      if (promo && promo.times_used < promo.max_uses && (!promo.expires_at || new Date(promo.expires_at) > new Date())) {
        discount = promo.discount_percent;
        await supabase.from('promo_codes').update({ times_used: promo.times_used + 1 }).eq('id', promo.id);
      }
    }

    const unitPrice = tt.price;
    const discountedPrice = unitPrice * (1 - discount / 100);

    // If Stripe, create a Checkout session
    if (paymentMethod === 'stripe') {
      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

      // Pre-generate tokens to embed in metadata
      const tokens = Array.from({ length: Number(quantity) }, () => uuidv4());

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: `${tt.name} — TiketFlow` },
            unit_amount: Math.round(discountedPrice * 100),
          },
          quantity: Number(quantity),
        }],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/tickets/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/events/${req.body.slug || ''}`,
        customer_email: buyerEmail,
        metadata: {
          eventId, ticketTypeId, quantity: String(quantity),
          buyerName, buyerEmail, buyerPhone: buyerPhone || '',
          tokens: tokens.join(','), discount: String(discount),
        },
      });

      return res.json({ checkoutUrl: session.url });
    }

    // For other payment methods (EcoCash, PayPal) — create tickets immediately
    // In production: integrate with payment gateway, verify payment, then create tickets
    const tokens = [];
    const ticketInserts = [];
    for (let i = 0; i < Number(quantity); i++) {
      const token = uuidv4();
      tokens.push(token);
      ticketInserts.push({
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone || null,
        qr_code_token: token,
        status: 'active',
      });
    }

    const { error: insertErr } = await supabase.from('tickets').insert(ticketInserts);
    if (insertErr) return res.status(500).json({ error: 'Failed to create tickets' });

    // Increment quantity_sold
    await supabase.from('ticket_types')
      .update({ quantity_sold: tt.quantity_sold + Number(quantity) })
      .eq('id', ticketTypeId);

    // Record payment
    const { data: firstTicket } = await supabase.from('tickets').select('id').eq('qr_code_token', tokens[0]).single();
    if (firstTicket) {
      await supabase.from('payments').insert({
        ticket_id: firstTicket.id,
        amount: discountedPrice * quantity,
        currency: 'USD',
        payment_method: paymentMethod,
        status: paymentMethod === 'ecocash' ? 'pending' : 'completed',
        paid_at: new Date().toISOString(),
      });
    }

    return res.json({ success: true, tokens, orderId: tokens[0] });
  } catch (err) {
    console.error('Purchase error:', err);
    return res.status(500).json({ error: 'Purchase failed. Please try again.' });
  }
}
