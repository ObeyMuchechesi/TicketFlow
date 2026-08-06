import { getServiceClient } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const user = await requireRole(req, 'super_admin', 'organiser');
    const supabase = getServiceClient();

    const isSuper = user.role === 'super_admin';
    let eventsQuery = supabase.from('events').select('id, event_name, status, date, capacity');
    if (!isSuper) eventsQuery = eventsQuery.eq('organiser_id', user.userId);
    const { data: events } = await eventsQuery;

    const eventIds = (events || []).map(e => e.id);
    if (!eventIds.length) return res.json({ totalRevenue: 0, totalTicketsSold: 0, totalEvents: 0, events: [] });

    const [{ data: payments }, { data: tickets }, { data: ticketTypes }] = await Promise.all([
      supabase.from('payments').select('amount, status').in('ticket_id',
        (await supabase.from('tickets').select('id').in('event_id', eventIds)).data?.map(t => t.id) || []
      ).eq('status', 'completed'),
      supabase.from('tickets').select('event_id, status').in('event_id', eventIds),
      supabase.from('ticket_types').select('event_id, price, quantity_sold').in('event_id', eventIds),
    ]);

    const totalRevenue = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
    const totalTicketsSold = (tickets || []).filter(t => t.status !== 'cancelled' && t.status !== 'refunded').length;

    // Per-event breakdown — real revenue, average price and free-event detection
    const eventStats = (events || []).map(ev => {
      const evTickets = (tickets || []).filter(t => t.event_id === ev.id);
      const sold = evTickets.filter(t => t.status !== 'cancelled' && t.status !== 'refunded').length;
      const checkedIn = evTickets.filter(t => t.status === 'used').length;
      const evTypes = (ticketTypes || []).filter(t => t.event_id === ev.id);
      const revenue = evTypes.reduce((s, t) => s + (Number(t.quantity_sold) || 0) * Number(t.price || 0), 0);
      const isFree = evTypes.length > 0 && evTypes.every(t => Number(t.price) === 0);
      const avgPrice = sold > 0 ? revenue / sold : 0;
      return { ...ev, sold, checkedIn, revenue, avgPrice, isFree };
    });

    res.json({ totalRevenue, totalTicketsSold, totalEvents: events?.length || 0, events: eventStats });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
