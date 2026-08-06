import { getServiceClient } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const staff = await requireRole(req, 'super_admin', 'organiser', 'gate_staff');
    const { eventId } = req.query;
    if (!eventId) return res.status(400).json({ error: 'eventId required' });

    const supabase = getServiceClient();

    // Gate staff may ONLY view stats for the single event they are assigned to.
    // If the DB hasn't been migrated with assigned_event_id, scoping is not
    // available yet — allow (matches the pre-migration behaviour).
    if (staff.role === 'gate_staff') {
      const { data: profile } = await supabase.from('users').select('assigned_event_id').eq('id', staff.userId).single();
      if (profile && profile.assigned_event_id !== eventId) {
        return res.status(403).json({ error: 'You are not assigned to this event' });
      }
    }
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
