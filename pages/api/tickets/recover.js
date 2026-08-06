import { getServiceClient } from '../../../lib/supabase';

// Lost ticket recovery — looks up tickets by the buyer's email or phone and
// returns their ticket links so a customer who lost their ticket can get back in.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, phone } = req.body;
  const queryEmail = String(email || '').trim().toLowerCase();
  const queryPhone = String(phone || '').replace(/\D/g, '').trim();

  if (!queryEmail && !queryPhone) {
    return res.status(400).json({ error: 'Enter the email or phone number you used to buy tickets' });
  }

  const supabase = getServiceClient();

  try {
    let query = supabase
      .from('tickets')
      .select('*, events (id, slug, event_name, date, time, venue, theme_color), ticket_types (id, name, price, color)');

    if (queryEmail && queryPhone) {
      query = query.or(`buyer_email.eq.${queryEmail},buyer_phone.eq.${queryPhone}`);
    } else if (queryEmail) {
      query = query.eq('buyer_email', queryEmail);
    } else {
      query = query.eq('buyer_phone', queryPhone);
    }

    const { data: tickets, error } = await query.order('purchase_date', { ascending: false }).limit(50);

    if (error) return res.status(500).json({ error: 'Could not look up tickets. Please try again.' });

    if (!tickets || tickets.length === 0) {
      return res.json({ tickets: [] });
    }

    // De-duplicate by qr token and strip heavy fields
    const seen = new Set();
    const results = [];
    for (const t of tickets) {
      if (seen.has(t.qr_code_token)) continue;
      seen.add(t.qr_code_token);
      results.push({
        qr_code_token: t.qr_code_token,
        buyer_name: t.buyer_name,
        status: t.status,
        is_checked_in: t.is_checked_in,
        purchase_date: t.purchase_date,
        event: t.events || null,
        ticket_type: t.ticket_types || null,
      });
    }

    return res.json({ tickets: results });
  } catch (err) {
    console.error('Recover error:', err);
    return res.status(500).json({ error: 'Could not look up tickets. Please try again.' });
  }
}
