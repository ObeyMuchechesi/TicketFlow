import { getServiceClient } from '../../../lib/supabase';
import { requireRole, hashPassword } from '../../../lib/auth';

// Staff management (super_admin / organiser only).
// Each gate staff member is assigned to ONE event (assigned_event_id) which
// scopes their gate dashboard and check-in access.
// users has TWO foreign keys to events (organiser_id and assigned_event_id),
// so PostgREST needs an explicit relationship hint on the embed — otherwise it
// errors with "more than one relationship was found for 'users' and 'events'".
const STAFF_SELECT = 'id, email, full_name, phone, is_active, assigned_event_id, created_at, events!assigned_event_id (id, event_name)';
const STAFF_SELECT_NO_ASSIGN = 'id, email, full_name, phone, is_active, created_at';

function isMissingColumn(err) {
  return /assigned_event_id|column .* does not exist/.test(err?.message || '');
}

// Verify an organiser can only assign staff to their OWN event. Super admins
// can assign to any event. Returns an error string (or null when OK).
async function validateAssignment(requester, eventId, supabase) {
  if (!eventId) return null;
  if (requester.role === 'super_admin') return null;
  const { data: event, error } = await supabase
    .from('events')
    .select('id, organiser_id')
    .eq('id', eventId)
    .single();
  if (error || !event) return 'Assigned event not found';
  if (event.organiser_id !== requester.userId) return 'You can only assign staff to your own events';
  return null;
}

export default async function handler(req, res) {
  try {
    const requester = await requireRole(req, 'super_admin', 'organiser');
    const supabase = getServiceClient();

    if (req.method === 'GET') {
      let { data } = await supabase
        .from('users')
        .select(STAFF_SELECT)
        .eq('role', 'gate_staff')
        .order('created_at', { ascending: false });
      if (!data) {
        // DB not migrated with assigned_event_id — fall back gracefully
        ({ data } = await supabase
          .from('users')
          .select(STAFF_SELECT_NO_ASSIGN)
          .eq('role', 'gate_staff')
          .order('created_at', { ascending: false }));
      }
      return res.json({ staff: data || [] });
    }

    if (req.method === 'POST') {
      const { full_name, email, password, phone, assigned_event_id } = req.body;
      if (!full_name || !email || !password) return res.status(400).json({ error: 'Missing required fields' });
      if (!assigned_event_id) return res.status(400).json({ error: 'Gate staff must be assigned to an event' });
      const assignError = await validateAssignment(requester, assigned_event_id, supabase);
      if (assignError) return res.status(403).json({ error: assignError });
      const password_hash = await hashPassword(password);
      const basePayload = {
        email: email.toLowerCase().trim(),
        password_hash,
        full_name,
        phone: phone || null,
        role: 'gate_staff',
        is_active: true,
      };

      let { data, error } = await supabase
        .from('users')
        .insert({ ...basePayload, assigned_event_id: assigned_event_id || null })
        .select(STAFF_SELECT)
        .single();

      if (error && isMissingColumn(error)) {
        ({ data, error } = await supabase.from('users').insert(basePayload).select(STAFF_SELECT_NO_ASSIGN).single());
      }

      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ staff: data });
    }

    if (req.method === 'PUT') {
      const { id, full_name, email, phone, is_active, assigned_event_id, password } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing staff id' });
      if (assigned_event_id !== undefined && assigned_event_id !== null && assigned_event_id !== '') {
        const assignError = await validateAssignment(requester, assigned_event_id, supabase);
        if (assignError) return res.status(403).json({ error: assignError });
      }

      const updates = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (email !== undefined) updates.email = email.toLowerCase().trim();
      if (phone !== undefined) updates.phone = phone || null;
      if (is_active !== undefined) updates.is_active = !!is_active;
      if (assigned_event_id !== undefined) updates.assigned_event_id = assigned_event_id || null;
      if (password) updates.password_hash = await hashPassword(password);

      let { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .eq('role', 'gate_staff')
        .select(STAFF_SELECT)
        .single();

      if (error && isMissingColumn(error)) {
        const safe = { ...updates };
        delete safe.assigned_event_id;
        ({ data, error } = await supabase
          .from('users')
          .update(safe)
          .eq('id', id)
          .eq('role', 'gate_staff')
          .select(STAFF_SELECT_NO_ASSIGN)
          .single());
      }

      if (error) return res.status(400).json({ error: error.message });
      return res.json({ staff: data });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing staff id' });
      const { error } = await supabase.from('users').delete().eq('id', id).eq('role', 'gate_staff');
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    }

    res.status(405).end();
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
