import { getServiceClient } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

export default async function handler(req, res) {
  const supabase = getServiceClient();

  if (req.method === 'POST') {
    try {
      await requireRole(req, 'super_admin', 'organiser');
      const { event_id, name, price, quantity_available, color, max_per_person } = req.body;
      if (!event_id || !name || price == null || !quantity_available)
        return res.status(400).json({ error: 'Missing required fields' });

      const payload = {
        event_id, name, price: Number(price),
        quantity_available: Number(quantity_available),
        quantity_sold: 0,
        color: color || '#e94560',
      };
      if (max_per_person !== undefined && max_per_person !== null && max_per_person !== '') {
        payload.max_per_person = Math.max(0, Number(max_per_person) || 0);
      }

      let { data, error } = await supabase.from('ticket_types').insert(payload).select().single();

      // Graceful fallback: databases not yet migrated with max_per_person
      if (error && /max_per_person|column .* does not exist/.test(error.message)) {
        delete payload.max_per_person;
        ({ data, error } = await supabase.from('ticket_types').insert(payload).select().single());
      }

      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ ticketType: data });
    } catch (err) { return res.status(err.status || 500).json({ error: err.message }); }
  }

  if (req.method === 'PUT') {
    try {
      await requireRole(req, 'super_admin', 'organiser');
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      if (updates.max_per_person !== undefined && updates.max_per_person !== null && updates.max_per_person !== '') {
        updates.max_per_person = Math.max(0, Number(updates.max_per_person) || 0);
      }
      let { data, error } = await supabase.from('ticket_types').update(updates).eq('id', id).select().single();
      if (error && /max_per_person|column .* does not exist/.test(error.message)) {
        const safe = { ...updates };
        delete safe.max_per_person;
        ({ data, error } = await supabase.from('ticket_types').update(safe).eq('id', id).select().single());
      }
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
