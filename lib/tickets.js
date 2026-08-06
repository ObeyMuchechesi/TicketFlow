// Ticket delivery helpers — sends the digital QR ticket via email.
// Fire-and-forget: failures are logged, never block the reservation.

export async function sendTicketConfirmation({ ticket, event, ticketType, isFree = false }) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !ticket?.buyer_email) return;

    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tiketflow.vercel.app';
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
