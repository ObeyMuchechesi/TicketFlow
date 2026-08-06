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

    // Gate staff: ONLY their assigned event. Fail closed — if the account has
    // no assignment (or the DB column is missing), they see NOTHING, never all
    // events. Staff must be assigned before they can access any event.
    if (user.role === 'gate_staff') {
      const assignedEventId = user.assignedEventId;
      if (!assignedEventId) {
        return res.json({ events: [], assignedEventId: null });
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
