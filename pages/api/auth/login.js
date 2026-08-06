import { getServiceClient } from '../../../lib/supabase';
import { verifyPassword, createSessionToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const supabase = getServiceClient();

    // Shared credentials: several gate-staff rows may share the same
    // email+password for the SAME event (one login per event, used by a
    // whole team at once). Fetch all active matches and verify the password
    // against each — the first valid row wins.
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('is_active', true);

    let user = null;
    if (users && users.length) {
      for (const candidate of users) {
        const valid = await verifyPassword(password, candidate.password_hash);
        if (valid) { user = candidate; break; }
      }
    }
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const token = createSessionToken(user.id, user.role);
    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader(
      'Set-Cookie',
      `tf_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}; Max-Age=${60 * 60 * 24 * 7}`
    );

    // Role-based redirect: each role lands in its own dashboard
    let redirect = '/admin';
    if (user.role === 'gate_staff') {
      redirect = '/staff';
    }

    res.json({
      success: true,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      redirect,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
}
