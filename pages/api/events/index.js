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
      const {
        event_name, slug, date, time, venue, description, poster_image,
        cover_image, theme_image, theme_color, capacity,
        ecocash_type, ecocash_code, ecocash_phone,
        bank_name, bank_account_name, bank_account_number,
      } = req.body;
      if (!event_name || !slug || !date || !venue) return res.status(400).json({ error: 'Missing required fields' });

      const basePayload = {
        organiser_id: user.userId,
        event_name, slug: slug.toLowerCase().replace(/\s+/g, '-'),
        date, time, venue, description, poster_image,
        theme_color: theme_color || '#e94560',
        capacity: capacity || 0,
        status: 'draft',
      };

      const mediaPayload = {
        ...basePayload,
        cover_image: cover_image || null,
        theme_image: theme_image || null,
        ecocash_type: ecocash_type || 'none',
        ecocash_code: ecocash_code || null,
        ecocash_phone: ecocash_phone || null,
        bank_name: bank_name || null,
        bank_account_name: bank_account_name || null,
        bank_account_number: bank_account_number || null,
      };

      let { data, error } = await supabase.from('events').insert(mediaPayload).select().single();

      // Graceful fallback: if the database hasn't been migrated with the
      // EcoCash / bank / media columns yet, retry without them so event
      // creation still works.
      if (error && /ecocash_|bank_|cover_image|theme_image|column .* does not exist/.test(error.message)) {
        ({ data, error } = await supabase.from('events').insert(basePayload).select().single());
      }

      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ event: data });
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  res.status(405).end();
}

export const config = {
  api: {
    bodyParser: {
      // Cover/theme images are uploaded as base64 data URLs
      sizeLimit: '10mb',
    },
  },
};
