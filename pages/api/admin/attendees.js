import { getServiceClient } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const user = await requireRole(req, 'super_admin', 'organiser', 'gate_staff');
    const { eventId, search } = req.query;
    if (!eventId) return res.status(400).json({ error: 'eventId required' });

    // Gate staff may ONLY list attendees for the single event they are assigned
    // to. Fail closed: no assignment (or missing column) means no access at all.
    if (user.role === 'gate_staff') {
      if (!user.assignedEventId || user.assignedEventId !== eventId) {
        return res.status(403).json({ error: 'You are not assigned to this event' });
      }
    }

    const supabase = getServiceClient();
    let query = supabase
      .from('tickets')
      .select('*, ticket_types (name, color, price)')
      .eq('event_id', eventId)
      .order('purchase_date', { ascending: false });

    if (search) {
      query = query.or(`buyer_name.ilike.%${search}%,buyer_email.ilike.%${search}%,buyer_phone.ilike.%${search}%,qr_code_token.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ attendees: data || [] });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
