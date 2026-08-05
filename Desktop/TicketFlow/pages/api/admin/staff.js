import { getServiceClient } from '../../../lib/supabase';
import { requireRole, hashPassword } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    await requireRole(req, 'super_admin', 'organiser');
    const supabase = getServiceClient();

    if (req.method === 'GET') {
      const { data } = await supabase.from('users').select('id, email, full_name, phone, is_active, created_at').eq('role', 'gate_staff').order('created_at', { ascending: false });
      return res.json({ staff: data || [] });
    }

    if (req.method === 'POST') {
      const { full_name, email, password, phone } = req.body;
      if (!full_name || !email || !password) return res.status(400).json({ error: 'Missing required fields' });
      const password_hash = await hashPassword(password);
      const { data, error } = await supabase.from('users').insert({ email: email.toLowerCase().trim(), password_hash, full_name, phone: phone || null, role: 'gate_staff', is_active: true }).select().single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ staff: data });
    }

    res.status(405).end();
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
