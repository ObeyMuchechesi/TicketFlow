import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';

const inp = { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
const label = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' };

function Field({ label: l, children }) {
  return <div style={{ marginBottom: '18px' }}><label style={label}>{l}</label>{children}</div>;
}

export default function NewEvent() {
  const router = useRouter();
  const [form, setForm] = useState({ event_name: '', slug: '', date: '', time: '', venue: '', description: '', poster_image: '', theme_color: '#e94560', capacity: '' });
  const [ticketTypes, setTicketTypes] = useState([{ name: 'General Admission', price: '', quantity_available: '', color: '#e94560' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function setF(k, v) {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === 'event_name') next.slug = v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return next;
    });
  }

  function addTicketType() { setTicketTypes(t => [...t, { name: '', price: '', quantity_available: '', color: '#e94560' }]); }
  function removeTicketType(i) { setTicketTypes(t => t.filter((_, idx) => idx !== i)); }
  function setTT(i, k, v) { setTicketTypes(t => t.map((tt, idx) => idx === i ? { ...tt, [k]: v } : tt)); }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create event'); setLoading(false); return; }
      const eventId = data.event.id;
      // Create ticket types
      await Promise.all(ticketTypes.filter(t => t.name && t.price && t.quantity_available).map(t =>
        fetch('/api/ticket-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_id: eventId, ...t, price: Number(t.price), quantity_available: Number(t.quantity_available) }) })
      ));
      router.push(`/admin/events/${eventId}`);
    } catch { setError('Something went wrong'); setLoading(false); }
  }

  return (
    <AdminLayout title="New Event">
      <div style={{ padding: 'clamp(20px,3vw,40px)', maxWidth: '760px' }}>
        <div style={{ marginBottom: '28px' }}>
          <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '14px', cursor: 'pointer', marginBottom: '12px' }}>← Back</button>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '28px', fontWeight: 700 }}>Create New Event</h1>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '12px', color: '#fca5a5', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <Section title="Event Details">
            <Field label="Event Name *"><input style={inp} required value={form.event_name} onChange={e => setF('event_name', e.target.value)} placeholder="e.g. Harare Summer Festival" /></Field>
            <Field label="URL Slug *"><input style={inp} required value={form.slug} onChange={e => setF('slug', e.target.value)} placeholder="harare-summer-festival" /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="Date *"><input style={inp} type="date" required value={form.date} onChange={e => setF('date', e.target.value)} /></Field>
              <Field label="Time"><input style={inp} value={form.time} onChange={e => setF('time', e.target.value)} placeholder="6:00 PM – 11:00 PM" /></Field>
            </div>
            <Field label="Venue *"><input style={inp} required value={form.venue} onChange={e => setF('venue', e.target.value)} placeholder="Venue name and address" /></Field>
            <Field label="Description"><textarea style={{ ...inp, height: '100px', resize: 'vertical' }} value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Describe your event..." /></Field>
          </Section>

          <Section title="Media & Theme">
            <Field label="Poster Image URL"><input style={inp} type="url" value={form.poster_image} onChange={e => setF('poster_image', e.target.value)} placeholder="https://..." /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="Theme Color"><div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><input type="color" value={form.theme_color} onChange={e => setF('theme_color', e.target.value)} style={{ width: '48px', height: '40px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }} /><input style={{ ...inp, flex: 1 }} value={form.theme_color} onChange={e => setF('theme_color', e.target.value)} /></div></Field>
              <Field label="Capacity"><input style={inp} type="number" min="0" value={form.capacity} onChange={e => setF('capacity', e.target.value)} placeholder="500" /></Field>
            </div>
          </Section>

          <Section title="Ticket Types">
            {ticketTypes.map((tt, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>Ticket Type {i + 1}</span>
                  {ticketTypes.length > 1 && <button type="button" onClick={() => removeTicketType(i)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#fca5a5', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Remove</button>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                  <Field label="Name"><input style={inp} value={tt.name} onChange={e => setTT(i, 'name', e.target.value)} placeholder="VIP / General / Early Bird" /></Field>
                  <Field label="Price ($)"><input style={inp} type="number" min="0" step="0.01" value={tt.price} onChange={e => setTT(i, 'price', e.target.value)} placeholder="25.00" /></Field>
                  <Field label="Quantity"><input style={inp} type="number" min="1" value={tt.quantity_available} onChange={e => setTT(i, 'quantity_available', e.target.value)} placeholder="100" /></Field>
                </div>
                <Field label="Color"><input type="color" value={tt.color} onChange={e => setTT(i, 'color', e.target.value)} style={{ width: '48px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer' }} /></Field>
              </div>
            ))}
            <button type="button" onClick={addTicketType} style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', padding: '12px', width: '100%', fontSize: '14px', cursor: 'pointer' }}>+ Add Ticket Type</button>
          </Section>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={() => router.back()} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50px', padding: '14px', color: '#fff', fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 2, background: loading ? 'rgba(233,69,96,0.5)' : '#e94560', border: 'none', borderRadius: '50px', padding: '14px', color: '#fff', fontWeight: 700, fontSize: '16px' }}>
              {loading ? '⏳ Creating...' : '✓ Create Event'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '17px', fontWeight: 600, marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{title}</h3>
      {children}
    </div>
  );
}

NewEvent.getLayout = (page) => page;
