import { getServiceClient } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

/**
 * GET /api/admin/payment-verifications
 * Fetches all payment verification records with ticket and event details.
 * Supports filtering by status, event_id, and verification_type.
 *
 * PATCH /api/admin/payment-verifications
 * Updates a verification record's status (approve/reject) and updates the ticket accordingly.
 */
export default async function handler(req, res) {
  const supabase = getServiceClient();

  if (req.method === 'GET') {
    try {
      await requireRole(req, 'super_admin', 'organiser');

      const { status, event_id, type, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let data = [];
      let count = 0;
      let statsData = [];

      // Check if the payment_verifications table exists
      const { error: tableCheck } = await supabase.from('payment_verifications').select('id').limit(1);

      if (!tableCheck || !tableCheck.message?.includes('does not exist')) {
        // Table exists — fetch the data
        let query = supabase
        .from('payment_verifications')
        .select(`
          id,
          verification_type,
          extracted_ref,
          extracted_amount,
          extracted_phone,
          screenshot_data,
          confidence,
          status,
          notes,
          created_at,
          ticket_id
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (type && type !== 'all') {
        query = query.eq('verification_type', type);
      }
      if (event_id) {
        query = query.eq('tickets.event_id', event_id);
      }

      const { count: total } = await supabase
        .from('payment_verifications')
        .select('id', { count: 'exact', head: true });
      count = total || 0;

      const { data: qData, error: qErr } = await query
        .range(offset, offset + Number(limit) - 1);

      if (qErr) {
        console.error('Fetch verifications error:', qErr);
      } else {
        data = qData || [];
      }

      const { data: sData } = await supabase
        .from('payment_verifications')
        .select('status, verification_type');
      statsData = sData || [];
      } // end table-exists check

      const stats = {
        total: statsData.length || 0,
        pending: statsData.filter(v => v.status === 'pending').length || 0,
        verified: statsData.filter(v => v.status === 'verified').length || 0,
        rejected: statsData.filter(v => v.status === 'rejected').length || 0,
        needs_review: statsData.filter(v => v.status === 'needs_review').length || 0,
        screenshot_ocr: statsData.filter(v => v.verification_type === 'screenshot_ocr').length || 0,
        manual_ref: statsData.filter(v => v.verification_type === 'manual_ref').length || 0,
        admin_review: statsData.filter(v => v.verification_type === 'admin_review').length || 0,
      };

      return res.json({
        verifications: data,
        stats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          pages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  if (req.method === 'PATCH') {
    try {
      await requireRole(req, 'super_admin', 'organiser');

      const { id, status: newStatus, notes } = req.body;

      if (!id || !newStatus) {
        return res.status(400).json({ error: 'ID and status are required' });
      }

      if (!['verified', 'rejected', 'needs_review'].includes(newStatus)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      // Get the verification record
      const { data: verification, error: fetchErr } = await supabase
        .from('payment_verifications')
        .select('id, ticket_id, extracted_ref, screenshot_data')
        .eq('id', id)
        .single();

      if (fetchErr || !verification) {
        return res.status(404).json({ error: 'Verification record not found' });
      }

      // Update the verification record
      const { error: updateErr } = await supabase
        .from('payment_verifications')
        .update({
          status: newStatus,
          notes: notes || undefined,
        })
        .eq('id', id);

      if (updateErr) {
        return res.status(500).json({ error: updateErr.message });
      }

      // If approved, activate the ticket (gracefully handle missing columns)
      if (newStatus === 'verified' && verification.ticket_id) {
        let { error: actErr } = await supabase
          .from('tickets')
          .update({ status: 'active', transaction_ref: verification.extracted_ref || 'admin_verified' })
          .eq('id', verification.ticket_id);
        if (actErr && actErr.message?.includes('transaction_ref')) {
          await supabase.from('tickets').update({ status: 'active' }).eq('id', verification.ticket_id);
        }

        // Also update the payment record
        await supabase
          .from('payments')
          .update({ status: 'completed', transaction_ref: verification.extracted_ref || 'admin_verified' })
          .eq('ticket_id', verification.ticket_id)
          .eq('status', 'pending');
      }

      // If rejected, mark the ticket as needing attention
      if (newStatus === 'rejected' && verification.ticket_id) {
        // Don't cancel the ticket, just leave it pending for the user to retry
      }

      return res.json({ success: true, status: newStatus });
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  res.status(405).end();
}
