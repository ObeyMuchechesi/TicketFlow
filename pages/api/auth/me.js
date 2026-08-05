import { getUserFromRequest } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  const session = getUserFromRequest(req);
  if (!session) return res.status(401).json({ user: null });

  try {
    const supabase = getServiceClient();
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, role, phone')
      .eq('id', session.userId)
      .single();

    if (!user || user.is_active === false) {
      return res.status(401).json({ user: null });
    }
    res.json({ user });
  } catch {
    // Transient server error — the client should NOT log the user out on this.
    res.status(503).json({ user: null, error: 'Failed to load session' });
  }
}
