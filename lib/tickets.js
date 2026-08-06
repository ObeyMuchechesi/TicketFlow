// Ticket delivery helpers — sends the digital QR ticket via email and
// generates a branded TiketFlow WhatsApp handoff link.
// Fire-and-forget: failures are logged, never block the reservation.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tiketflow.vercel.app';

/**
 * Build the branded TiketFlow WhatsApp message for a ticket.
 * The message is pre-filled so the buyer only needs to tap send.
 */
export function buildTiketFlowWhatsAppMessage({ ticket, event, ticketType, isFree = false }) {
  const ticketUrl = `${SITE_URL}/ticket/${ticket?.qr_code_token || ''}`;
  const eventName = event?.event_name || 'your event';
  const priceLabel = isFree || Number(ticketType?.price || 0) === 0
    ? 'Free Admission'
    : `USD ${Number(ticketType?.price || 0).toFixed(2)}`;
  const dateLine = event?.date
    ? `${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}${event?.time ? ` at ${event.time}` : ''}`
    : '';

  return [
    `🎟️ Your TiketFlow ticket for ${eventName} is ready!`,
    '',
    `📋 Ticket: ${ticketType?.name || 'Ticket'}`,
    `💵 Price: ${priceLabel}`,
    `👤 Name: ${ticket?.buyer_name || '—'}`,
    dateLine ? `📅 Date: ${dateLine}` : '',
    event?.venue ? `📍 Venue: ${event.venue}` : '',
    '',
    'Open your digital ticket (QR code) here 👇',
    ticketUrl,
    '',
    'Show the QR code at the gate for entry. This ticket can only be scanned once.',
    '',
    '— TiketFlow',
  ].filter(Boolean).join('\n');
}

/**
 * WhatsApp handoff link. Uses the buyer's own number when provided, otherwise
 * opens the share sheet. Zero-setup: no WhatsApp Business API keys needed.
 */
export function buildWhatsAppHandoffUrl({ phone, message }) {
  const text = encodeURIComponent(message || '');
  if (phone) {
    // Normalise to international digits for wa.me
    let digits = String(phone).replace(/\D/g, '');
    if (digits.startsWith('0')) digits = `263${digits.slice(1)}`;
    return `https://wa.me/${digits}?text=${text}`;
  }
  return `https://wa.me/?text=${text}`;
}

/**
 * Send the ticket to the buyer's WhatsApp via the Meta WhatsApp Cloud API.
 * Returns the wa.me handoff URL in all cases so the frontend can show a
 * one-tap button even when no API credentials are configured.
 */
export async function sendTicketWhatsApp({ ticket, event, ticketType, isFree = false }) {
  const message = buildTiketFlowWhatsAppMessage({ ticket, event, ticketType, isFree });
  const handoffUrl = buildWhatsAppHandoffUrl({ phone: ticket?.buyer_phone, message });

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = ticket?.buyer_phone;

  if (token && phoneNumberId && to) {
    // Fire-and-forget: never block the purchase response on the external API.
    fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: String(to).replace(/\D/g, ''),
        type: 'text',
        text: { body: message },
      }),
    }).catch(err => console.error('WhatsApp send error:', err));
  }

  return handoffUrl;
}

export async function sendTicketConfirmation({ ticket, event, ticketType, isFree = false }) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !ticket?.buyer_email) return;

    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    const siteUrl = SITE_URL;
    const ticketUrl = `${siteUrl}/ticket/${ticket.qr_code_token}`;
    const isFreeTicket = isFree || Number(ticketType?.price || 0) === 0;
    const priceLabel = isFreeTicket ? 'Free Admission' : `$${Number(ticketType?.price || 0).toFixed(2)}`;

    const eventName = event?.event_name || 'your event';
    const dateLine = event?.date
      ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}${event?.time ? ` · ${event.time}` : ''}</p>`
      : '';

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'TiketFlow <onboarding@resend.dev>',
      to: ticket.buyer_email,
      subject: isFreeTicket
        ? `🎉 Your free ticket for ${eventName}`
        : `🎟️ Your ticket for ${eventName}`,
      html: `
        <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
          <div style="text-align:center;padding:28px;border-radius:16px;background:linear-gradient(135deg,#a855f7,#ec4899);">
            <div style="font-size:15px;font-weight:800;color:#fff;letter-spacing:2px;">TIKETFLOW</div>
            <div style="font-size:22px;font-weight:800;color:#fff;margin-top:8px;">${eventName}</div>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:24px;">
            <p style="margin:0 0 12px;font-size:15px;">Hi ${ticket.buyer_name || 'there'},</p>
            <p style="margin:0 0 12px;font-size:14px;color:#374151;">
              ${isFreeTicket
                ? 'Your free ticket has been reserved. Show the QR code at the gate for entry.'
                : 'Thank you for your purchase. Your ticket is ready — show the QR code at the gate for entry.'}
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:13px;margin:16px 0;">
              <tr><td style="padding:6px 0;color:#6b7280;">Ticket</td><td style="text-align:right;font-weight:700;">${ticketType?.name || 'Ticket'}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Price</td><td style="text-align:right;font-weight:700;${isFreeTicket ? 'color:#059669;' : ''}">${priceLabel}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Ticket Holder</td><td style="text-align:right;font-weight:700;">${ticket.buyer_name || '—'}</td></tr>
              ${event?.venue ? `<tr><td style="padding:6px 0;color:#6b7280;">Venue</td><td style="text-align:right;font-weight:700;">${event.venue}</td></tr>` : ''}
            </table>
            ${dateLine}
            <div style="margin:24px 0 8px;text-align:center;">
              <a href="${ticketUrl}" style="display:inline-block;padding:14px 28px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;font-weight:800;text-decoration:none;font-size:15px;">
                View My Digital Ticket
              </a>
            </div>
            <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
              Your ticket is unique and can only be scanned once at the gate.
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Ticket email error:', err);
  }
}
