import { getServiceClient } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const staff = await requireRole(req, 'super_admin', 'organiser', 'gate_staff');
    const { token, eventId, method = 'qr_scan', deviceInfo } = req.body;
    if (!token || !eventId) return res.status(400).json({ error: 'token and eventId required' });

    const supabase = getServiceClient();

    const { data: ticket } = await supabase
      .from('tickets')
      .select('*, ticket_types (name, color), events (event_name)')
      .eq('qr_code_token', token)
      .eq('event_id', eventId)
      .single();

    if (!ticket) return res.json({ valid: false, reason: 'INVALID', message: 'Ticket not found or not for this event' });
    if (ticket.status === 'cancelled') return res.json({ valid: false, reason: 'CANCELLED', message: 'Ticket has been cancelled' });
    if (ticket.status === 'refunded') return res.json({ valid: false, reason: 'REFUNDED', message: 'Ticket has been refunded' });
    if (ticket.is_checked_in) return res.json({
      valid: false, reason: 'ALREADY_USED',
      message: `Already checked in at ${new Date(ticket.checked_in_at).toLocaleTimeString()}`,
      ticket: { buyer_name: ticket.buyer_name, ticket_type: ticket.ticket_types?.name, checked_in_at: ticket.checked_in_at },
    });

    // Mark as checked in
    const now = new Date().toISOString();
    await supabase.from('tickets').update({ is_checked_in: true, checked_in_at: now, checked_in_by: staff.userId, status: 'used' }).eq('id', ticket.id);
    await supabase.from('check_ins').insert({ ticket_id: ticket.id, event_id: eventId, staff_id: staff.userId, scanned_at: now, method, device_info: deviceInfo || null });

    return res.json({
      valid: true, reason: 'SUCCESS',
      message: 'Welcome! Entry granted.',
      ticket: { buyer_name: ticket.buyer_name, ticket_type: ticket.ticket_types?.name, buyer_phone: ticket.buyer_phone },
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}
