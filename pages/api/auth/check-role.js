import { getServiceClient } from '../../../lib/supabase';

// Public helper: returns the role for an email address so login pages can
// tailor their navigation (e.g. "Back to Admin Login" for organisers).
// Only the role is returned — never hashes, phone numbers, or tokens.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const email = String(req.query.email || '').toLowerCase().trim();
  if (!email) return res.status(400).json({ role: null });

  try {
    const supabase = getServiceClient();
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('email', email)
      .limit(1);

    const role = data && data.length ? data[0].role : null;
    res.json({ role });
  } catch (err) {
    console.error('[check-role]', err);
    res.status(500).json({ role: null, error: 'Failed to look up role' });
  }
}
