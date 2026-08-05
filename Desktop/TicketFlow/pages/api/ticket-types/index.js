import { getServiceClient } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

export default async function handler(req, res) {
  const supabase = getServiceClient();

  if (req.method === 'POST') {
    try {
      await requireRole(req, 'super_admin', 'organiser');
      const { event_id, name, price, quantity_available, color } = req.body;
      if (!event_id || !name || price == null || !quantity_available)
        return res.status(400).json({ error: 'Missing required fields' });

      const { data, error } = await supabase.from('ticket_types').insert({
        event_id, name, price: Number(price),
        quantity_available: Number(quantity_available),
        quantity_sold: 0,
        color: color || '#e94560',
      }).select().single();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ ticketType: data });
    } catch (err) { return res.status(err.status || 500).json({ error: err.message }); }
  }

  if (req.method === 'PUT') {
    try {
      await requireRole(req, 'super_admin', 'organiser');
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const { data, error } = await supabase.from('ticket_types').update(updates).eq('id', id).select().single();
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ ticketType: data });
    } catch (err) { return res.status(err.status || 500).json({ error: err.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      await requireRole(req, 'super_admin', 'organiser');
      const { id } = req.body;
      const { error } = await supabase.from('ticket_types').delete().eq('id', id);
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    } catch (err) { return res.status(err.status || 500).json({ error: err.message }); }
  }

  res.status(405).end();
}
