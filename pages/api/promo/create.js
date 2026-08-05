import { getServiceClient } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    await requireRole(req, 'super_admin', 'organiser');
    const { event_id, code, discount_percent, max_uses, expires_at } = req.body;
    if (!event_id || !code || !discount_percent) return res.status(400).json({ error: 'Missing required fields' });
    const supabase = getServiceClient();
    const { data, error } = await supabase.from('promo_codes').insert({
      event_id, code: code.toUpperCase().trim(),
      discount_percent: Number(discount_percent),
      max_uses: Number(max_uses) || 100,
      times_used: 0,
      expires_at: expires_at || null,
      is_active: true,
    }).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ promo: data });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
}
