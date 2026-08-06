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
      const requester = await requireRole(req, 'super_admin', 'organiser');
      const updates = req.body;
      delete updates.id; delete updates.organiser_id; delete updates.created_at;
      if (updates.slug) updates.slug = updates.slug.toLowerCase().replace(/\s+/g, '-');

      // Organisers may only edit their own events
      let query = supabase.from('events').update(updates).eq('id', id);
      if (requester.role !== 'super_admin') query = query.eq('organiser_id', requester.userId);
      let { data, error } = await query.select().single();

      // Zero rows matched — either the event doesn't exist or it belongs to
      // another organiser. Don't leak which.
      if (error && /single JSON object|multiple \(or no\) rows/.test(error.message)) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Graceful fallback for databases not yet migrated with EcoCash / bank /
      // media columns
      if (error && /ecocash_|bank_|cover_image|theme_image|column .* does not exist/.test(error.message)) {
        const safe = { ...updates };
        delete safe.ecocash_type; delete safe.ecocash_code; delete safe.ecocash_phone;
        delete safe.bank_name; delete safe.bank_account_name; delete safe.bank_account_number;
        delete safe.cover_image; delete safe.theme_image;
        if (Object.keys(safe).length > 0) {
          ({ data, error } = await supabase.from('events').update(safe).eq('id', id).select().single());
        } else {
          // Only media fields were sent and the columns don't exist yet —
          // return the current row unchanged (media persists on wizard submit).
          error = null;
          ({ data } = await supabase.from('events').select().eq('id', id).single());
        }
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
