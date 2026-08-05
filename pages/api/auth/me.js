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
    res.json({ user: user || null });
  } catch {
    res.status(500).json({ user: null });
  }
}
