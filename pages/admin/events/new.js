import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { Card, Badge, Button, Input, StepIndicator, Progress } from '../../../components/ui';

const WIZARD_STEPS = [
  'Basic Info',
  'Branding',
  'Tickets',
  'Venue',
  'Schedule',
  'Payments',
  'Publish',
];

const stepBadgeVariants = [
  'primary',
  'info',
  'success',
  'warning',
  'primary',
  'info',
  'success',
];

const stepIcons = ['📝', '🎨', '🎟️', '📍', '📅', '💳', '🚀'];

export default function NewEvent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    event_name: '',
    slug: '',
    date: '',
    time: '',
    venue: '',
    description: '',
    poster_image: '',
    theme_color: '#e94560',
    capacity: '',
    venue_description: '',
    latitude: '',
    longitude: '',
    parking_info: '',
    accessibility_info: '',
    schedule_notes: '',
    doors_open: '',
    end_time: '',
    payment_methods: 'stripe',
    refund_policy: '',
    status: 'draft',
  });
  const [ticketTypes, setTicketTypes] = useState([
    { name: 'General Admission', price: '', quantity_available: '', color: '#e94560' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stepErrors, setStepErrors] = useState({});
  const [autosaveStatus, setAutosaveStatus] = useState('Saved');
  const autosaveTimer = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tf_new_event_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.form) setForm(f => ({ ...f, ...parsed.form }));
        if (parsed.ticketTypes) setTicketTypes(parsed.ticketTypes);
        if (typeof parsed.currentStep === 'number') setCurrentStep(parsed.currentStep);
      }
    } catch {}
  }, []);

  useEffect(() => {
    clearTimeout(autosaveTimer.current);
    setAutosaveStatus('Saving...');
    autosaveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem('tf_new_event_draft', JSON.stringify({ form, ticketTypes, currentStep }));
        setAutosaveStatus('Saved');
      } catch {}
    }, 5000);
    return () => clearTimeout(autosaveTimer.current);
  }, [form, ticketTypes, currentStep]);

  function setF(k, v) {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === 'event_name') next.slug = v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return next;
    });
  }

  function addTicketType() {
    setTicketTypes(t => [...t, { name: '', price: '', quantity_available: '', color: '#e94560' }]);
  }
  function removeTicketType(i) {
    setTicketTypes(t => t.filter((_, idx) => idx !== i));
  }
  function setTT(i, k, v) {
    setTicketTypes(t => t.map((tt, idx) => idx === i ? { ...tt, [k]: v } : tt));
  }

  function validateStep(step) {
    const errors = {};
    switch (step) {
      case 0:
        if (!form.event_name?.trim()) errors.event_name = 'Event name is required';
        if (!form.slug?.trim()) errors.slug = 'URL slug is required';
        if (!form.date) errors.date = 'Event date is required';
        if (!form.venue?.trim()) errors.venue = 'Venue is required';
        break;
      case 1:
        if (!form.capacity || Number(form.capacity) <= 0) errors.capacity = 'Valid capacity required';
        break;
      case 2: {
        const hasValid = ticketTypes.some(t => t.name?.trim() && t.price !== '' && Number(t.price) >= 0 && t.quantity_available !== '' && Number(t.quantity_available) > 0);
        if (!hasValid) errors.tickets = 'Add at least 1 complete ticket type (name, price, qty)';
        break;
      }
      case 6:
        break;
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function goNext() {
    if (validateStep(currentStep)) {
      if (currentStep < WIZARD_STEPS.length - 1) setCurrentStep(s => s + 1);
    }
  }
  function goPrev() {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!validateStep(currentStep)) return;
    setLoading(true);
    setError('');
    try {
      const submitForm = {
        event_name: form.event_name,
        slug: form.slug,
        date: form.date,
        time: form.time,
        venue: form.venue,
        description: form.description,
        poster_image: form.poster_image,
        theme_color: form.theme_color,
        capacity: form.capacity,
        status: form.status,
      };
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create event'); setLoading(false); return; }
      const eventId = data.event.id;
      await Promise.all(
        ticketTypes
          .filter(t => t.name && t.price && t.quantity_available)
          .map(t =>
            fetch('/api/ticket-types', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event_id: eventId,
                ...t,
                price: Number(t.price),
                quantity_available: Number(t.quantity_available),
              }),
            })
          )
      );
      try { localStorage.removeItem('tf_new_event_draft'); } catch {}
      router.push(`/admin/events/${eventId}`);
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  }

  return (
    <AdminLayout title="New Event">
      <div style={{ padding: 'clamp(20px, 3vw, 40px)', maxWidth: '880px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }} className="fade-in-up">
          <button
            onClick={() => router.back()}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '13px',
              cursor: 'pointer',
              marginBottom: '10px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ← Back to events
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontSize: 'clamp(24px, 3vw, 32px)',
                fontWeight: 800,
                marginBottom: '4px',
                background: 'var(--accent-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Create New Event</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Step {currentStep + 1} of {WIZARD_STEPS.length} ·{' '}
                <span style={{ color: autosaveStatus === 'Saving...' ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>
                  {autosaveStatus === 'Saving...' ? '⏳ ' : '✓ '}{autosaveStatus}
                </span>
              </p>
            </div>
            <Badge variant={stepBadgeVariants[currentStep]} icon={stepIcons[currentStep]}>
              {WIZARD_STEPS[currentStep]}
            </Badge>
          </div>
        </div>

        <div style={{ marginBottom: '28px' }}>
          <Card style={{ padding: '20px' }}>
            <StepIndicator steps={WIZARD_STEPS} currentStep={currentStep} />
            <div style={{ marginTop: '16px' }}>
              <Progress value={currentStep + 1} max={WIZARD_STEPS.length} showLabel height={5} />
            </div>
          </Card>
        </div>

        {error && (
          <Card style={{
            padding: '14px 18px',
            marginBottom: '20px',
            background: 'rgba(239,68,68,0.08)',
            borderColor: 'rgba(239,68,68,0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>❌</span>
              <span style={{ color: '#fca5a5', fontSize: '14px', fontWeight: 500 }}>{error}</span>
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Card accent style={{ padding: 'clamp(20px, 3vw, 32px)', marginBottom: '24px' }} className="fade-in-up">
            <StepHeader
              stepNum={currentStep}
              icon={stepIcons[currentStep]}
              title={WIZARD_STEPS[currentStep]}
              description={getStepDescription(currentStep)}
            />

            <div style={{ height: '20px' }} />

            {currentStep === 0 && (
              <StepBasicInfo form={form} setF={setF} errors={stepErrors} />
            )}
            {currentStep === 1 && (
              <StepBranding form={form} setF={setF} errors={stepErrors} />
            )}
            {currentStep === 2 && (
              <StepTickets
                ticketTypes={ticketTypes}
                addTicketType={addTicketType}
                removeTicketType={removeTicketType}
                setTT={setTT}
                errors={stepErrors}
              />
            )}
            {currentStep === 3 && (
              <StepVenue form={form} setF={setF} />
            )}
            {currentStep === 4 && (
              <StepSchedule form={form} setF={setF} />
            )}
            {currentStep === 5 && (
              <StepPayments form={form} setF={setF} />
            )}
            {currentStep === 6 && (
              <StepPublish
                form={form}
                ticketTypes={ticketTypes}
                setF={setF}
                onEdit={(step) => setCurrentStep(step)}
              />
            )}
          </Card>

          <div style={{ display: 'flex', gap: '12px' }}>
            {currentStep === 0 ? (
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            ) : (
              <Button type="button" variant="secondary" fullWidth onClick={goPrev}>
                ← Previous
              </Button>
            )}
            {currentStep < WIZARD_STEPS.length - 1 ? (
              <Button type="button" variant="primary" fullWidth onClick={goNext}>
                Continue →
              </Button>
            ) : (
              <Button type="submit" variant="primary" fullWidth loading={loading}>
                {loading ? 'Creating...' : (form.status === 'published' ? '🚀 Publish Event' : '💾 Save as Draft')}
              </Button>
            )}
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

function getStepDescription(step) {
  return [
    "Name your event and set the core details.",
    "Customize the look and feel of your event page.",
    "Configure ticket tiers, pricing, and availability.",
    "Add venue details and accessibility information.",
    "Outline your event schedule and key timing.",
    "Set up payment processing and refund policies.",
    "Review everything before going live.",
  ][step] || '';
}

function StepHeader({ stepNum, icon, title, description }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '18px',
        background: 'var(--accent-gradient)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '26px',
        flexShrink: 0,
        boxShadow: 'var(--shadow-glow)',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: '22px',
            fontWeight: 700,
            margin: 0,
          }}>{title}</h2>
          <Badge variant="glass">Step {stepNum + 1}</Badge>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function Wrapper({ children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{children}</div>;
}

function StepBasicInfo({ form, setF, errors }) {
  return (
    <Wrapper>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <Input
          label="Event Name *"
          placeholder="e.g. Harare Summer Festival 2026"
          value={form.event_name}
          onChange={e => setF('event_name', e.target.value)}
          error={errors.event_name}
        />
        <Input
          label="URL Slug *"
          placeholder="harare-summer-festival"
          value={form.slug}
          onChange={e => setF('slug', e.target.value)}
          error={errors.slug}
          helper="Auto-generated, edit if needed"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Input
          label="Date *"
          type="date"
          value={form.date}
          onChange={e => setF('date', e.target.value)}
          error={errors.date}
        />
        <Input
          label="Start Time"
          placeholder="e.g. 6:00 PM"
          value={form.time}
          onChange={e => setF('time', e.target.value)}
          helper="Main event start time"
        />
      </div>
      <Input
        label="Venue *"
        placeholder="e.g. National Sports Stadium, Harare"
        value={form.venue}
        onChange={e => setF('venue', e.target.value)}
        error={errors.venue}
      />
      <div className="field-group">
        <label>Event Description</label>
        <textarea
          className="premium-input"
          rows="6"
          placeholder="Tell attendees what makes your event special... lineup, experiences, vibe, etc."
          value={form.description}
          onChange={e => setF('description', e.target.value)}
        />
        <p style={{ fontSize: '12px', color: 'var(--text-dimmed)', marginTop: '6px' }}>
          Markdown friendly · This appears on the public event page
        </p>
      </div>
    </Wrapper>
  );
}

function StepBranding({ form, setF, errors }) {
  return (
    <Wrapper>
      <Input
        label="Poster Image URL"
        type="url"
        placeholder="https://yourbucket.s3.amazonaws.com/poster.jpg"
        value={form.poster_image}
        onChange={e => setF('poster_image', e.target.value)}
        helper="Recommended: 1200x630 · JPG or PNG"
      />

      {form.poster_image && (
        <div style={{
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--panel-border)',
          aspectRatio: '16/9',
          background: 'var(--panel-bg)',
        }}>
          <img
            src={form.poster_image}
            alt="Preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div>
          <div className="field-group">
            <label>Theme Color</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
              <input
                type="color"
                value={form.theme_color}
                onChange={e => setF('theme_color', e.target.value)}
                style={{
                  width: '56px',
                  height: '52px',
                  borderRadius: '12px',
                  border: '1px solid var(--panel-border)',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              />
              <input
                className="premium-input"
                value={form.theme_color}
                onChange={e => setF('theme_color', e.target.value)}
                placeholder="#e94560"
                style={{ flex: 1 }}
              />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-dimmed)', marginTop: '6px' }}>
              Used for gradients, buttons, and highlights
            </p>
          </div>
        </div>

        <Input
          label="Total Capacity *"
          type="number"
          min="1"
          placeholder="e.g. 500"
          value={form.capacity}
          onChange={e => setF('capacity', e.target.value)}
          error={errors.capacity}
          helper="Venue maximum · includes all ticket types"
        />
      </div>

      <div className="field-group">
        <label>Theme Presets</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
          {[
            ['#e94560', 'Sunset'],
            ['#a855f7', 'Royal'],
            ['#3b82f6', 'Ocean'],
            ['#10b981', 'Emerald'],
            ['#f59e0b', 'Amber'],
            ['#ec4899', 'Bubblegum'],
            ['#d4a853', 'Gold'],
            ['#6366f1', 'Indigo'],
          ].map(([c, name]) => (
            <button
              key={c}
              type="button"
              onClick={() => setF('theme_color', c)}
              style={{
                background: 'var(--panel-bg)',
                border: form.theme_color === c ? `2px solid ${c}` : '1px solid var(--panel-border)',
                borderRadius: '12px',
                padding: '10px 8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: '100%',
                height: '36px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${c}, ${c}aa)`,
                marginBottom: '6px',
              }} />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{name}</div>
            </button>
          ))}
        </div>
      </div>
    </Wrapper>
  );
}

function StepTickets({ ticketTypes, addTicketType, removeTicketType, setTT, errors }) {
  return (
    <Wrapper>
      {errors.tickets && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          color: '#fca5a5',
          fontSize: '13px',
          fontWeight: 500,
        }}>⚠️ {errors.tickets}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {ticketTypes.map((tt, i) => (
          <Card key={i} style={{ padding: '18px' }} className="card-lift">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: tt.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#fff',
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>Ticket Tier {i + 1}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dimmed)' }}>
                    {tt.name || 'Unnamed tier'}
                  </div>
                </div>
              </div>
              {ticketTypes.length > 1 && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removeTicketType(i)}
                >
                  Remove
                </Button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
              <Input
                label="Tier Name"
                placeholder="VIP / General / Early Bird"
                value={tt.name}
                onChange={e => setTT(i, 'name', e.target.value)}
              />
              <Input
                label="Price ($)"
                type="number"
                min="0"
                step="0.01"
                placeholder="25.00"
                value={tt.price}
                onChange={e => setTT(i, 'price', e.target.value)}
              />
              <Input
                label="Quantity"
                type="number"
                min="1"
                placeholder="100"
                value={tt.quantity_available}
                onChange={e => setTT(i, 'quantity_available', e.target.value)}
              />
            </div>

            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="color"
                value={tt.color}
                onChange={e => setTT(i, 'color', e.target.value)}
                style={{
                  width: '44px',
                  height: '40px',
                  borderRadius: '10px',
                  border: '1px solid var(--panel-border)',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '3px',
                  flexShrink: 0,
                }}
              />
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Ticket badge & ribbon color · used for visual differentiation on event page
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        fullWidth
        onClick={addTicketType}
        style={{ borderStyle: 'dashed', borderWidth: '2px' }}
      >
        ＋ Add Another Ticket Tier
      </Button>
    </Wrapper>
  );
}

function StepVenue({ form, setF }) {
  return (
    <Wrapper>
      <Card style={{ padding: '18px' }}>
        <div style={{
          width: '100%',
          aspectRatio: '16/6',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(59,130,246,0.12))',
          border: '1px dashed var(--panel-hover-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '6px' }}>🗺️</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Map Preview · Coordinates below</div>
          </div>
        </div>
        <Badge variant="info" style={{ marginBottom: '0' }}>📍 Current Venue: {form.venue || 'TBD'}</Badge>
      </Card>

      <div className="field-group">
        <label>Venue Description</label>
        <textarea
          className="premium-input"
          rows="4"
          placeholder="e.g. Outdoor amphitheater in the heart of Harare. Beautiful lawn seating with skyline views."
          value={form.venue_description}
          onChange={e => setF('venue_description', e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Input
          label="Latitude"
          type="number"
          step="any"
          placeholder="-17.8252"
          value={form.latitude}
          onChange={e => setF('latitude', e.target.value)}
        />
        <Input
          label="Longitude"
          type="number"
          step="any"
          placeholder="31.0335"
          value={form.longitude}
          onChange={e => setF('longitude', e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <div className="field-group">
          <label>Parking & Transportation</label>
          <textarea
            className="premium-input"
            rows="3"
            placeholder="e.g. Free parking lot on south side · Shuttle from downtown every 30 min."
            value={form.parking_info}
            onChange={e => setF('parking_info', e.target.value)}
          />
        </div>
        <div className="field-group">
          <label>Accessibility Notes</label>
          <textarea
            className="premium-input"
            rows="3"
            placeholder="e.g. Wheelchair ramps · ASL interpreters · Accessible seating available"
            value={form.accessibility_info}
            onChange={e => setF('accessibility_info', e.target.value)}
          />
        </div>
      </div>
    </Wrapper>
  );
}

function StepSchedule({ form, setF }) {
  return (
    <Wrapper>
      <Card style={{ padding: '20px' }}>
        <div className="timeline">
          <div className="timeline-item">
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>Doors Open</div>
            <div style={{ fontSize: '12px', color: 'var(--text-dimmed)' }}>
              {form.doors_open || 'Set below'}
            </div>
          </div>
          <div className="timeline-item">
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>Event Starts</div>
            <div style={{ fontSize: '12px', color: 'var(--text-dimmed)' }}>
              {form.date ? `${new Date(form.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ` : ''}
              {form.time || 'TBD'}
            </div>
          </div>
          <div className="timeline-item" style={{ paddingBottom: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>End Time</div>
            <div style={{ fontSize: '12px', color: 'var(--text-dimmed)' }}>
              {form.end_time || 'Set below'}
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Input
          label="Event Date (confirm)"
          type="date"
          value={form.date}
          onChange={e => setF('date', e.target.value)}
        />
        <Input
          label="Doors Open"
          placeholder="e.g. 5:00 PM"
          value={form.doors_open}
          onChange={e => setF('doors_open', e.target.value)}
        />
        <Input
          label="Start Time (confirm)"
          placeholder="e.g. 6:00 PM"
          value={form.time}
          onChange={e => setF('time', e.target.value)}
        />
        <Input
          label="End Time"
          placeholder="e.g. 11:00 PM"
          value={form.end_time}
          onChange={e => setF('end_time', e.target.value)}
        />
      </div>

      <div className="field-group">
        <label>Schedule Notes</label>
        <textarea
          className="premium-input"
          rows="5"
          placeholder={`e.g.\n• 5:00 PM — Doors open & food trucks\n• 6:30 PM — Opening act: Ammara Brown\n• 8:00 PM — Intermission (30 min)\n• 8:30 PM — Main performance\n• 10:30 PM — Finale & fireworks`}
          value={form.schedule_notes}
          onChange={e => setF('schedule_notes', e.target.value)}
        />
      </div>
    </Wrapper>
  );
}

function StepPayments({ form, setF }) {
  return (
    <Wrapper>
      <Card style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #635bff, #00d4ff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            flexShrink: 0,
          }}>⚡</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>Stripe Connect</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Secure payouts · Payment processing enabled
            </div>
          </div>
          <Badge variant="success" style={{ marginLeft: 'auto' }}>Connected</Badge>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-dimmed)', lineHeight: 1.6 }}>
          All ticket sales are processed via Stripe. Payouts are sent automatically to your linked bank account after the event completes. Standard Stripe fees apply per transaction.
        </p>
      </Card>

      <div className="field-group">
        <label>Accepted Payment Methods</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {[
            { id: 'stripe', name: 'Cards (Stripe)', icon: '💳', def: true },
            { id: 'mobile', name: 'Mobile Money', icon: '📱' },
            { id: 'transfer', name: 'Bank Transfer', icon: '🏦' },
            { id: 'cash', name: 'Cash at Gate', icon: '💵' },
          ].map(opt => (
            <label
              key={opt.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px',
                borderRadius: '12px',
                background: 'var(--panel-bg)',
                border: '1px solid var(--panel-border)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <input
                type="checkbox"
                checked={(form.payment_methods || '').includes(opt.id)}
                onChange={e => {
                  const current = (form.payment_methods || '').split(',').filter(Boolean);
                  if (e.target.checked) {
                    if (!current.includes(opt.id)) current.push(opt.id);
                  } else {
                    const idx = current.indexOf(opt.id);
                    if (idx > -1) current.splice(idx, 1);
                  }
                  setF('payment_methods', current.join(','));
                }}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
              />
              <span style={{ fontSize: '18px' }}>{opt.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{opt.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label>Refund Policy</label>
        <textarea
          className="premium-input"
          rows="4"
          placeholder={`e.g.\n• Full refund available up to 7 days before event\n• 50% refund within 3–7 days\n• No refunds within 48 hours of start`}
          value={form.refund_policy}
          onChange={e => setF('refund_policy', e.target.value)}
        />
      </div>
    </Wrapper>
  );
}

function StepPublish({ form, ticketTypes, setF, onEdit }) {
  const validTickets = ticketTypes.filter(t => t.name && t.price !== '' && t.quantity_available !== '');
  const totalQty = validTickets.reduce((sum, t) => sum + Number(t.quantity_available || 0), 0);
  const minPrice = validTickets.length ? Math.min(...validTickets.map(t => Number(t.price))) : 0;
  const maxPrice = validTickets.length ? Math.max(...validTickets.map(t => Number(t.price))) : 0;

  return (
    <Wrapper>
      <Card style={{ padding: '18px', background: form.theme_color ? `linear-gradient(135deg, ${form.theme_color}15, transparent)` : undefined }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{
            width: '96px',
            height: '96px',
            borderRadius: '18px',
            background: form.theme_color ? `linear-gradient(135deg, ${form.theme_color}, ${form.theme_color}aa)` : 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            flexShrink: 0,
          }}>🎪</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <h3 style={{
                fontFamily: "var(--font-display)",
                fontSize: '22px',
                fontWeight: 800,
                margin: 0,
              }}>{form.event_name || 'Unnamed Event'}</h3>
              <Badge variant={form.status === 'published' ? 'success' : 'warning'}>
                {form.status === 'published' ? 'PUBLISH' : 'DRAFT'}
              </Badge>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
              {form.date ? `${new Date(form.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}` : 'No date'}
              {form.time ? ` · ${form.time}` : ''}
              {form.venue ? ` · 📍 ${form.venue}` : ''}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Badge variant="primary">🎟️ {validTickets.length} tiers</Badge>
              <Badge variant="success">👥 {totalQty.toLocaleString()} tickets</Badge>
              <Badge variant="info">
                💵 {minPrice === maxPrice ? `$${minPrice}` : `$${minPrice} – $${maxPrice}`}
              </Badge>
              {form.capacity && <Badge variant="warning">🏟️ Cap {Number(form.capacity).toLocaleString()}</Badge>}
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[
          ['Basic Info', '✓', 0, 'primary'],
          ['Branding', form.theme_color ? '✓' : '!', 1, 'info'],
          ['Tickets', `${validTickets.length} tiers`, 2, 'success'],
          ['Venue', form.venue_description ? '✓' : '—', 3, 'warning'],
          ['Schedule', form.schedule_notes ? '✓' : '—', 4, 'primary'],
          ['Payments', 'Stripe', 5, 'info'],
        ].map(([label, val, step, variant]) => (
          <Card
            key={label}
            hoverable
            onClick={() => onEdit(step)}
            style={{ padding: '14px' }}
            className="card-lift"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '0.3px', fontWeight: 700, marginBottom: '4px' }}>
                  {label}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{val}</div>
              </div>
              <Badge variant={variant}>Edit</Badge>
            </div>
          </Card>
        ))}
      </div>

      <div className="field-group">
        <label>Publishing Status</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label
            style={{
              padding: '18px',
              borderRadius: '14px',
              background: form.status === 'draft' ? 'var(--accent-muted)' : 'var(--panel-bg)',
              border: `2px solid ${form.status === 'draft' ? 'var(--accent)' : 'var(--panel-border)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <input
              type="radio"
              name="status"
              checked={form.status === 'draft'}
              onChange={() => setF('status', 'draft')}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(245,158,11,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}>💾</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>Save as Draft</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dimmed)' }}>Not visible to public</div>
              </div>
            </div>
          </label>

          <label
            style={{
              padding: '18px',
              borderRadius: '14px',
              background: form.status === 'published' ? 'rgba(16,185,129,0.1)' : 'var(--panel-bg)',
              border: `2px solid ${form.status === 'published' ? 'var(--success)' : 'var(--panel-border)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <input
              type="radio"
              name="status"
              checked={form.status === 'published'}
              onChange={() => setF('status', 'published')}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(16,185,129,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}>🚀</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>Publish Now</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dimmed)' }}>Live · tickets on sale</div>
              </div>
            </div>
          </label>
        </div>
      </div>
    </Wrapper>
  );
}

NewEvent.getLayout = (page) => page;
