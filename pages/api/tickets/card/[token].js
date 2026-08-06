import { getServiceClient } from '../../../../lib/supabase';
import { generateTicketCardPng } from '../../../../lib/ticketCard';

// Renders the branded TiketFlow ticket card (QR + event details) as a PNG.
// Used by WhatsApp/email delivery and on-page card downloads.
export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).end();

  try {
    const supabase = getServiceClient();
    const { data: ticket } = await supabase
      .from('tickets')
      .select('*')
      .eq('qr_code_token', token)
      .single();

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const [{ data: event }, { data: ticketType }] = await Promise.all([
      supabase.from('events').select('event_name, date, time, venue, theme_color').eq('id', ticket.event_id).single(),
      supabase.from('ticket_types').select('name, color, price').eq('id', ticket.ticket_type_id).single(),
    ]);

    const png = await generateTicketCardPng({ ticket, event: event || null, ticketType: ticketType || null });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, immutable');
    res.setHeader('Content-Length', String(png.length));
    return res.end(png);
  } catch (err) {
    console.error('Ticket card error:', err);
    return res.status(500).json({ error: 'Could not generate ticket card' });
  }
}
