import { getServiceClient } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    await requireRole(req, 'super_admin', 'organiser', 'gate_staff');
    const { eventId } = req.query;
    if (!eventId) return res.status(400).json({ error: 'eventId required' });

    const supabase = getServiceClient();
    const [{ count: total }, { count: checkedIn }, { data: recent }] = await Promise.all([
      supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'active'),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('is_checked_in', true),
      supabase.from('check_ins').select('*, tickets (buyer_name, ticket_types (name))').eq('event_id', eventId).order('scanned_at', { ascending: false }).limit(20),
    ]);

    const { data: event } = await supabase.from('events').select('capacity, event_name').eq('id', eventId).single();

    res.json({
      total: (total || 0) + (checkedIn || 0),
      checkedIn: checkedIn || 0,
      capacity: event?.capacity || 0,
      eventName: event?.event_name,
      recent: recent || [],
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
