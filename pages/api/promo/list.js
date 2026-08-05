import { getServiceClient } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    await requireRole(req, 'super_admin', 'organiser');
    const { eventId } = req.query;
    if (!eventId) return res.status(400).json({ error: 'eventId required' });
    const supabase = getServiceClient();
    const { data } = await supabase.from('promo_codes').select('*').eq('event_id', eventId).order('created_at', { ascending: false });
    res.json({ promos: data || [] });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
}
