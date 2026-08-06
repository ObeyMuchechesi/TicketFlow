import { getServiceClient } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;
  const supabase = getServiceClient();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('events')
      .select(`*, ticket_types (*)`)
      .eq('id', id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Event not found' });
    return res.json({ event: data });
  }

  if (req.method === 'PUT') {
    try {
      await requireRole(req, 'super_admin', 'organiser');
      const updates = req.body;
      delete updates.id; delete updates.organiser_id; delete updates.created_at;
      if (updates.slug) updates.slug = updates.slug.toLowerCase().replace(/\s+/g, '-');

      let { data, error } = await supabase.from('events').update(updates).eq('id', id).select().single();

      // Graceful fallback for databases not yet migrated with EcoCash / bank /
      // media columns
      if (error && /ecocash_|bank_|cover_image|theme_image|column .* does not exist/.test(error.message)) {
        const safe = { ...updates };
        delete safe.ecocash_type; delete safe.ecocash_code; delete safe.ecocash_phone;
        delete safe.bank_name; delete safe.bank_account_name; delete safe.bank_account_number;
        delete safe.cover_image; delete safe.theme_image;
        ({ data, error } = await supabase.from('events').update(safe).eq('id', id).select().single());
      }

      if (error) return res.status(400).json({ error: error.message });
      return res.json({ event: data });
    } catch (err) { return res.status(err.status || 500).json({ error: err.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      await requireRole(req, 'super_admin', 'organiser');
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    } catch (err) { return res.status(err.status || 500).json({ error: err.message }); }
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
