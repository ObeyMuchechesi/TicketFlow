import { getServiceClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { code, eventId } = req.body;
  if (!code || !eventId) return res.status(400).json({ error: 'code and eventId required' });

  try {
    const supabase = getServiceClient();
    const { data: promo } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('event_id', eventId)
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single();

    if (!promo) return res.json({ valid: false, error: 'Invalid promo code' });
    if (promo.times_used >= promo.max_uses) return res.json({ valid: false, error: 'Promo code has reached its usage limit' });
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) return res.json({ valid: false, error: 'Promo code has expired' });

    return res.json({ valid: true, promo: { code: promo.code, discount_percent: promo.discount_percent } });
  } catch {
    return res.status(500).json({ error: 'Could not validate promo code' });
  }
}
