import { getServiceClient } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

// Gate staff event scoping. Returns ONLY the event(s) the logged-in staff
// member is assigned to — gate staff can never see other events.
// Admins/organisers get the full published list as before.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const user = await requireRole(req, 'super_admin', 'organiser', 'gate_staff');
    const supabase = getServiceClient();

    const select = 'id, slug, event_name, date, time, venue, status, theme_color';

    // Gate staff: only their assigned event
    if (user.role === 'gate_staff') {
      let assignedEventId = null;
      const { data: profile } = await supabase
        .from('users')
        .select('assigned_event_id')
        .eq('id', user.userId)
        .single();
      assignedEventId = profile?.assigned_event_id || null;

      // Fallback for DBs not migrated: staff see all published events as before
      if (!assignedEventId) {
        const { data: fallback } = await supabase
          .from('events')
          .select(`${select}, ticket_types (id, name, price, color, quantity_available, quantity_sold)`)
          .eq('status', 'published')
          .order('date', { ascending: true });
        return res.json({ events: fallback || [], assignedEventId: null });
      }

      const { data } = await supabase
        .from('events')
        .select(`${select}, ticket_types (id, name, price, color, quantity_available, quantity_sold)`)
        .eq('id', assignedEventId)
        .single();
      return res.json({ events: data ? [data] : [], assignedEventId });
    }

    // Admins / organisers: all published events (unchanged behaviour)
    const { data } = await supabase
      .from('events')
      .select(`${select}, ticket_types (id, name, price, color, quantity_available, quantity_sold)`)
      .eq('status', 'published')
      .order('date', { ascending: true });
    return res.json({ events: data || [], assignedEventId: null });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
