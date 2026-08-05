import { getServiceClient } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

export default async function handler(req, res) {
  const supabase = getServiceClient();

  if (req.method === 'GET') {
    // Public: list published events
    const { data, error } = await supabase
      .from('events')
      .select(`*, ticket_types (id, name, price, quantity_available, quantity_sold, color)`)
      .eq('status', 'published')
      .order('date', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ events: data });
  }

  if (req.method === 'POST') {
    try {
      const user = await requireRole(req, 'super_admin', 'organiser');
      const { event_name, slug, date, time, venue, description, poster_image, theme_color, capacity } = req.body;
      if (!event_name || !slug || !date || !venue) return res.status(400).json({ error: 'Missing required fields' });

      const { data, error } = await supabase.from('events').insert({
        organiser_id: user.userId,
        event_name, slug: slug.toLowerCase().replace(/\s+/g, '-'),
        date, time, venue, description, poster_image,
        theme_color: theme_color || '#e94560',
        capacity: capacity || 0,
        status: 'draft',
      }).select().single();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ event: data });
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  res.status(405).end();
}
