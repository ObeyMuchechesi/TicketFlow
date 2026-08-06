import { getServiceClient } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { buildEcocashShortcode, generateEcocashReference, dialableShortcode } from '../../../lib/ecocash';
import { sendTicketConfirmation } from '../../../lib/tickets';

const MAX_QUANTITY = 50;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { eventId, ticketTypeId, quantity, buyerName, buyerEmail, buyerPhone, paymentMethod, promoCode } = req.body;
  if (!eventId || !ticketTypeId || !buyerName || !buyerEmail)
    return res.status(400).json({ error: 'Missing required fields' });

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QUANTITY)
    return res.status(400).json({ error: `Quantity must be between 1 and ${MAX_QUANTITY}` });

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
    if (remaining < qty) return res.status(400).json({ error: `Only ${remaining} tickets remaining` });

    // Free events = ticket types priced at $0. They skip payment entirely but
    // still get unique QR tokens, capacity tracking and gate scanning.
    const isFree = Number(tt.price) === 0;

    // SECURITY: paid tickets must go through a real payment method. Deriving the
    // flow from price means a client can never mint paid tickets for free by
    // sending `paymentMethod: 'free'` — reject anything that isn't a valid flow.
    if (!isFree && paymentMethod !== 'stripe' && paymentMethod !== 'ecocash') {
      return res.status(400).json({ error: 'Invalid payment method for this ticket' });
    }

    // Per-person reservation limit (0 / NULL = unlimited). Counts existing
    // reservations for the same email AND the same phone, whichever is higher.
    const maxPerPerson = Number(tt.max_per_person) || 0;
    if (maxPerPerson > 0) {
      const email = String(buyerEmail || '').trim().toLowerCase();
      const phone = String(buyerPhone || '').trim();
      let existing = 0;

      const { count: emailCount } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('ticket_type_id', ticketTypeId)
        .eq('buyer_email', email);
      existing = Math.max(existing, emailCount || 0);

      if (phone) {
        const { count: phoneCount } = await supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .eq('ticket_type_id', ticketTypeId)
          .eq('buyer_phone', phone);
        existing = Math.max(existing, phoneCount || 0);
      }

      if (existing + qty > maxPerPerson) {
        const remainingAllowed = Math.max(0, maxPerPerson - existing);
        return res.status(400).json({
          error: `Maximum ${maxPerPerson} ticket${maxPerPerson > 1 ? 's' : ''} per person for "${tt.name}". You already have ${existing} reserved${remainingAllowed > 0 ? ` — ${remainingAllowed} more allowed` : ''}.`,
        });
      }
    }

    // Promo codes only apply to paid tickets
    let discount = 0;
    if (!isFree && promoCode) {
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

    const unitPrice = Number(tt.price);
    const baseTotal = unitPrice * qty;
    const discountAmt = Math.round(baseTotal * discount / 100 * 100) / 100;
    const serviceFee = Math.round(baseTotal * 0.05 * 100) / 100;
    const total = Math.round((baseTotal - discountAmt + serviceFee) * 100) / 100;

    // ─────────────────────────────────────────────────────────
    // PAID flows — Stripe & EcoCash only (skipped entirely for free tickets)
    // ─────────────────────────────────────────────────────────
    if (!isFree && paymentMethod === 'stripe') {
      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

      // Pre-generate tokens to embed in metadata
      const tokens = Array.from({ length: qty }, () => uuidv4());

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: `${tt.name} — TiketFlow` },
            unit_amount: Math.round(discountedUnitPrice(unitPrice, discount) * 100),
          },
          quantity: qty,
        }],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/tickets/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/events/${req.body.slug || ''}`,
        customer_email: buyerEmail,
        metadata: {
          eventId, ticketTypeId, quantity: String(qty),
          buyerName, buyerEmail, buyerPhone: buyerPhone || '',
          tokens: tokens.join(','), discount: String(discount),
        },
      });

      return res.json({ checkoutUrl: session.url });
    }

    // EcoCash: auto-generate the USSD payment instructions. We validate the
    // organiser's config BEFORE creating any tickets so we never mint unpaid
    // tickets the customer can't actually pay for.
    let ecocash = null;
    if (!isFree && paymentMethod === 'ecocash') {
      const reference = generateEcocashReference();
      const { data: event } = await supabase
        .from('events')
        .select('ecocash_type, ecocash_code, ecocash_phone')
        .eq('id', eventId)
        .single();

      const shortcode = buildEcocashShortcode({
        type: event?.ecocash_type,
        code: event?.ecocash_code,
        amount: total,
        reference,
      });

      ecocash = {
        shortcode,
        dialUrl: dialableShortcode(shortcode),
        reference,
        amount: total.toFixed(2),
        type: event?.ecocash_type || 'none',
        phone: event?.ecocash_phone || null,
        configured: Boolean(shortcode),
      };

      if (!ecocash.configured) {
        return res.status(400).json({
          error: 'EcoCash is not configured for this event yet. Please pay by card or contact the organiser.',
        });
      }
    }

    // ─────────────────────────────────────────────────────────
    // Create tickets (free & paid share this path)
    // ─────────────────────────────────────────────────────────
    const tokens = [];
    const ticketInserts = [];
    for (let i = 0; i < qty; i++) {
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

    // Atomic capacity increment (capacity tracking for both paid & free).
    // The conditional .eq('quantity_sold', tt.quantity_sold) makes the update
    // fail-safe against two concurrent reservations overselling the same tier.
    const { data: incResult, error: incErr } = await supabase
      .from('ticket_types')
      .update({ quantity_sold: tt.quantity_sold + qty })
      .eq('id', ticketTypeId)
      .eq('quantity_sold', tt.quantity_sold)
      .select('quantity_sold');

    if (incErr || !incResult || incResult.length === 0) {
      // Sold out between our check and this write — roll back the tickets
      await supabase.from('tickets').delete().in('qr_code_token', tokens);
      return res.status(400).json({ error: `Only ${Math.max(0, remaining)} tickets remaining` });
    }

    // Record payment ONLY for paid tickets — free reservations create no
    // payment record (revenue stays $0.00).
    if (!isFree) {
      const { data: firstTicket } = await supabase.from('tickets').select('id').eq('qr_code_token', tokens[0]).single();
      if (firstTicket) {
        await supabase.from('payments').insert({
          ticket_id: firstTicket.id,
          amount: total,
          currency: 'USD',
          payment_method: paymentMethod,
          status: paymentMethod === 'ecocash' ? 'pending' : 'completed',
          transaction_ref: ecocash?.reference || null,
          paid_at: new Date().toISOString(),
        });
      }
    }

    // Fire-and-forget digital ticket email — never blocks the reservation response
    Promise.all([
      supabase.from('events').select('event_name, date, time, venue').eq('id', eventId).single(),
      supabase.from('tickets').select('*').eq('qr_code_token', tokens[0]).single(),
    ]).then(([evRes, tkRes]) => {
      if (evRes.data && tkRes.data) {
        sendTicketConfirmation({ ticket: tkRes.data, event: evRes.data, ticketType: tt, isFree });
      }
    }).catch(err => console.error('Ticket email failed:', err));

    return res.json({ success: true, tokens, orderId: tokens[0], ecocash, free: isFree });
  } catch (err) {
    console.error('Purchase error:', err);
    return res.status(500).json({ error: 'Purchase failed. Please try again.' });
  }
}

function discountedUnitPrice(unitPrice, discount) {
  return unitPrice * (1 - discount / 100);
}
