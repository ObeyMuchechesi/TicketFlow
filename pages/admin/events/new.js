import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { Card, Badge, Button, Input, StepIndicator, Progress } from '../../../components/ui';
import { buildEcocashShortcode } from '../../../lib/ecocash';
import {
  FileText, Palette, Ticket, MapPin, CalendarDays, CreditCard, Rocket, AlertCircle,
  PartyPopper, DollarSign, Zap, Smartphone, Landmark, Banknote, X, User, Users, Map,
  Loader2, CheckCircle2, AlertTriangle, Save, Gift, Image as ImageIcon,
} from 'lucide-react';

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

const stepIcons = [FileText, Palette, Ticket, MapPin, CalendarDays, CreditCard, Rocket];

export default function NewEvent() {
  const router = useRouter();
  const isEdit = !!router.query.id;
  const eventId = isEdit ? router.query.id : null;
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingEvent, setLoadingEvent] = useState(isEdit);
  const StepIcon = stepIcons[currentStep];
  const [form, setForm] = useState({
    event_name: '',
    slug: '',
    date: '',
    time: '',
    venue: '',
    description: '',
    poster_image: '',
    cover_image: '',
    theme_image: '',
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
    ecocash_type: 'none',
    ecocash_code: '',
    ecocash_phone: '',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    status: 'draft',
  });
  const [ticketTypes, setTicketTypes] = useState([
    { name: 'General Admission', price: '', quantity_available: '', color: '#e94560', max_per_person: '' },
  ]);
  const [eventType, setEventType] = useState('paid'); // 'paid' | 'free'
  const [loading, setLoading] = useState(false);
  const [mediaStatus, setMediaStatus] = useState(''); // '' | 'saving' | 'saved' | 'error'
  const mediaSaveTimer = useRef(null);
  const mediaSaveSeq = useRef(0); // guards against out-of-order PUT responses
  const [error, setError] = useState('');
  const [stepErrors, setStepErrors] = useState({});
  const [autosaveStatus, setAutosaveStatus] = useState('Saved');
  const autosaveTimer = useRef(null);

  // Edit mode: load the existing event + its ticket types and prefill the wizard.
  useEffect(() => {
    if (!router.isReady || !eventId) return;
    setLoadingEvent(true);
    setCurrentStep(0);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();
        if (cancelled || !data.event) return;
        const ev = data.event;
        setForm(f => ({
          ...f,
          event_name: ev.event_name || '',
          slug: ev.slug || '',
          date: ev.date || '',
          time: ev.time || '',
          venue: ev.venue || '',
          description: ev.description || '',
          poster_image: ev.poster_image || '',
          cover_image: ev.cover_image || '',
          theme_image: ev.theme_image || '',
          theme_color: ev.theme_color || '#e94560',
          capacity: ev.capacity || '',
          venue_description: ev.venue_description || '',
          latitude: ev.latitude ?? '',
          longitude: ev.longitude ?? '',
          parking_info: ev.parking_info || '',
          accessibility_info: ev.accessibility_info || '',
          schedule_notes: ev.schedule_notes || '',
          doors_open: ev.doors_open || '',
          end_time: ev.end_time || '',
          payment_methods: ev.payment_methods || 'stripe',
          refund_policy: ev.refund_policy || '',
          ecocash_type: ev.ecocash_type || 'none',
          ecocash_code: ev.ecocash_code || '',
          ecocash_phone: ev.ecocash_phone || '',
          bank_name: ev.bank_name || '',
          bank_account_name: ev.bank_account_name || '',
          bank_account_number: ev.bank_account_number || '',
          status: ev.status || 'draft',
        }));
        const types = (ev.ticket_types || []).map(tt => ({
          id: tt.id,
          name: tt.name || '',
          price: String(tt.price ?? ''),
          quantity_available: String(tt.quantity_available ?? ''),
          color: tt.color || '#e94560',
          max_per_person: tt.max_per_person != null ? String(tt.max_per_person) : '',
          quantity_sold: Number(tt.quantity_sold || 0),
        }));
        if (types.length) {
          setTicketTypes(types);
          // A free event = every tier priced at $0 (default to paid otherwise)
          setEventType(types.every(t => Number(t.price) === 0) ? 'free' : 'paid');
        }
      } catch {}
      if (!cancelled) setLoadingEvent(false);
    })();
    return () => { cancelled = true; };
  }, [eventId, router.isReady]);

  useEffect(() => {
    if (!router.isReady || isEdit) return; // never autosave over an existing event
    try {
      const saved = localStorage.getItem('tf_new_event_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.form) setForm(f => ({ ...f, ...parsed.form }));
        if (parsed.ticketTypes) setTicketTypes(parsed.ticketTypes);
        if (typeof parsed.currentStep === 'number') setCurrentStep(parsed.currentStep);
        if (parsed.eventType) setEventType(parsed.eventType);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (isEdit) return;
    clearTimeout(autosaveTimer.current);
    setAutosaveStatus('Saving...');
    autosaveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem('tf_new_event_draft', JSON.stringify({ form, ticketTypes, currentStep, eventType }));
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

  // Auto-save an uploaded image (or poster URL) immediately.
  // - Edit mode: PUT straight to the database so the image persists without
  //   having to submit the whole wizard.
  // - Create mode: the event row doesn't exist yet, so persist the image into
  //   the autosave draft instantly (it's submitted together with the event).
  function saveMedia(field, value) {
    setF(field, value);
    const seq = ++mediaSaveSeq.current;

    // poster_image exists on every database (cover_image/theme_image only after
    // the media migration). Keep it in sync so uploaded covers always persist
    // and display, even on databases that haven't been migrated yet.
    const posterSync = field === 'cover_image' ? { poster_image: value || '' } : {};

    if (!isEdit || !eventId) {
      try {
        const draft = JSON.parse(localStorage.getItem('tf_new_event_draft') || 'null');
        // Merge current form state on top of the draft so fresh edits aren't lost.
        const nextForm = { ...(draft?.form || {}), ...form, [field]: value, ...posterSync };
        localStorage.setItem('tf_new_event_draft', JSON.stringify({ ...draft, form: nextForm }));
      } catch {}
      setMediaStatus('saved');
      clearTimeout(mediaSaveTimer.current);
      mediaSaveTimer.current = setTimeout(() => setMediaStatus(''), 2500);
      return;
    }
    setMediaStatus('saving');
    fetch(`/api/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value || null, ...posterSync }),
    })
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        // Ignore stale responses from an older upload in the same field.
        if (seq !== mediaSaveSeq.current) return;
        if (ok) {
          setMediaStatus('saved');
        } else if (/ecocash_|bank_|cover_image|theme_image|column .* does not exist/.test(d?.error || '')) {
          // cover_image/theme_image columns are missing (unmigrated DB) but we
          // sent poster_image as a fallback — verify it actually persisted.
          fetch(`/api/events/${eventId}`)
            .then(r => r.json())
            .then(({ event }) => {
              if (seq !== mediaSaveSeq.current) return;
              setMediaStatus(event?.poster_image ? 'saved' : 'error');
            })
            .catch(() => setMediaStatus('error'));
        } else {
          setMediaStatus('error');
        }
        clearTimeout(mediaSaveTimer.current);
        mediaSaveTimer.current = setTimeout(() => setMediaStatus(''), 2500);
      })
      .catch(() => {
        if (seq !== mediaSaveSeq.current) return;
        setMediaStatus('error');
        clearTimeout(mediaSaveTimer.current);
        mediaSaveTimer.current = setTimeout(() => setMediaStatus(''), 2500);
      });
  }

  function addTicketType() {
    setTicketTypes(t => [...t, { name: '', price: eventType === 'free' ? '0' : '', quantity_available: '', color: '#e94560', max_per_person: '' }]);
  }

  function setEventTypeMode(mode) {
    setEventType(mode);
    if (mode === 'free') {
      // Free events lock every tier at $0.00
      setTicketTypes(t => t.map(tt => ({ ...tt, price: '0' })));
    }
  }
  function removeTicketType(i) {
    setTicketTypes(t => {
      const tier = t[i];
      if (isEdit && tier?.quantity_sold > 0) {
        setError(`\"${tier.name || 'This tier'}\" has ${tier.quantity_sold} sold ticket${tier.quantity_sold === 1 ? '' : 's'} and cannot be removed. It stays available for existing buyers.`);
        return t;
      }
      return t.filter((_, idx) => idx !== i);
    });
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
        const hasValid = ticketTypes.some(t =>
          t.name?.trim() &&
          (eventType === 'free' || (t.price !== '' && Number(t.price) >= 0)) &&
          t.quantity_available !== '' && Number(t.quantity_available) > 0
        );
        if (!hasValid) errors.tickets = eventType === 'free'
          ? 'Add at least 1 complete ticket type (name + capacity)'
          : 'Add at least 1 complete ticket type (name, price, qty)';
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

  async function handleSubmit(e, statusOverride) {
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
        // poster_image exists on every database — fall back to the uploaded
        // cover so the image always persists and displays (unmigrated DBs
        // strip cover_image but keep poster_image).
        poster_image: form.poster_image || form.cover_image || '',
        cover_image: form.cover_image || null,
        theme_image: form.theme_image || null,
        theme_color: form.theme_color,
        capacity: form.capacity,
        status: statusOverride ?? form.status,
        ecocash_type: form.ecocash_type,
        ecocash_code: form.ecocash_code,
        ecocash_phone: form.ecocash_phone,
        bank_name: form.bank_name || null,
        bank_account_name: form.bank_account_name || null,
        bank_account_number: form.bank_account_number || null,
      };

      const validTiers = ticketTypes
        .filter(t => t.name && t.quantity_available && (eventType === 'free' || (t.price !== '' && Number(t.price) >= 0)));

      let savedEventId;
      if (isEdit) {
        // Update the existing event
        const res = await fetch(`/api/events/${eventId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitForm),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Failed to update event'); setLoading(false); return; }
        savedEventId = data.event.id;
      } else {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitForm),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Failed to create event'); setLoading(false); return; }
        savedEventId = data.event.id;
      }

      // Reconcile ticket tiers: update existing (with id), create new ones,
      // and remove any previously-existing tiers that are no longer in the list.
      const existing = (await (await fetch(`/api/events/${savedEventId}`)).json()).event?.ticket_types || [];
      const existingIds = existing.map(t => t.id);
      const keptIds = new Set(validTiers.map(t => t.id).filter(Boolean));
      // Only delete tiers that have NO sold tickets — tiers with sales are
      // protected server-side too (they stay available for existing buyers).
      const removed = existingIds.filter(id =>
        !keptIds.has(id) && !(Number(existing.find(t => t.id === id)?.quantity_sold || 0) > 0)
      );

      await Promise.all(validTiers.map(t =>
        fetch('/api/ticket-types', {
          method: t.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(t.id ? { id: t.id } : { event_id: savedEventId }),
            name: t.name,
            price: eventType === 'free' ? 0 : Number(t.price || 0),
            quantity_available: Number(t.quantity_available),
            color: t.color,
            max_per_person: t.max_per_person,
          }),
        })
      ));

      const deleteResults = await Promise.all(removed.map(id =>
        fetch('/api/ticket-types', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
      ));
      for (const r of deleteResults) {
        if (!r.ok) {
          const msg = (await r.json().catch(() => ({}))).error;
          if (msg) setError(msg);
        }
      }

      try { localStorage.removeItem('tf_new_event_draft'); } catch {}
      router.push(`/admin/events/${savedEventId}`);
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  }

  if (loadingEvent) {
    return (
      <AdminLayout title={isEdit ? 'Edit Event' : 'New Event'}>
        <div style={{ padding: 'clamp(20px, 3vw, 40px)', maxWidth: '880px', margin: '0 auto' }}>
          <div className="adm-skeleton" style={{ height: '48px', width: '260px', marginBottom: '20px' }} />
          <div className="adm-skeleton" style={{ height: '120px', marginBottom: '20px' }} />
          <div className="adm-skeleton" style={{ height: '400px' }} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEdit ? 'Edit Event' : 'New Event'}>
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
              }}>{isEdit ? 'Edit Event' : 'Create New Event'}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                {isEdit
                  ? 'Update the event details and ticket tiers.'
                  : (<>
                      Step {currentStep + 1} of {WIZARD_STEPS.length} ·{' '}
                      <span style={{ color: autosaveStatus === 'Saving...' ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>
                        {autosaveStatus === 'Saving...' ? <Loader2 size={12} style={{ animation: 'spin-slow 0.8s linear infinite', verticalAlign: '-2px' }} /> : <CheckCircle2 size={12} style={{ verticalAlign: '-2px' }} />}{' '}{autosaveStatus}
                      </span>
                    </>)}
              </p>
            </div>
            <Badge variant={stepBadgeVariants[currentStep]} icon={<StepIcon size={14} strokeWidth={2} />}>
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
              <AlertCircle size={18} strokeWidth={2} />
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
              <StepBranding form={form} setF={setF} errors={stepErrors} saveMedia={saveMedia} mediaStatus={mediaStatus} />
            )}
            {currentStep === 2 && (
              <StepTickets
                ticketTypes={ticketTypes}
                eventType={eventType}
                setEventTypeMode={setEventTypeMode}
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
                eventType={eventType}
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
              <>
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                  onClick={() => handleSubmit(undefined, isEdit ? undefined : 'draft')}
                >
                  {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Save as Draft')}
                </Button>
                <Button
                  type="button"
                  variant="success"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                  onClick={() => handleSubmit(undefined, 'published')}
                >
                  {loading ? 'Publishing...' : 'Publish Event'}
                </Button>
              </>
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
        flexShrink: 0,
        boxShadow: 'var(--shadow-glow)',
      }}>
        <icon size={26} strokeWidth={1.9} style={{ color: '#fff' }} />
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

// Gallery image uploader — reads the file client-side, compresses it to a
// reasonable size and stores it as a base64 data URL (no storage service needed).
function ImageUploader({ label, description, value, onChange, onSave, aspect = '16/9' }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setBusy(true);
    try {
      const dataUrl = await compressImage(file, 1400, 0.82);
      onChange(dataUrl);
      onSave?.(dataUrl);
    } catch {
      // fall back to raw read if canvas fails
      const reader = new FileReader();
      reader.onload = () => { onChange(reader.result); onSave?.(reader.result); };
      reader.readAsDataURL(file);
    }
    setBusy(false);
  }

  return (
    <div className="field-group">
      <label>{label}</label>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          borderRadius: '16px',
          overflow: 'hidden',
          border: value
            ? '1px solid var(--panel-border)'
            : '2px dashed var(--panel-hover-border)',
          aspectRatio: aspect,
          background: value ? 'transparent' : 'var(--panel-bg)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={e => { if (!value) e.currentTarget.style.borderColor = 'var(--accent)'; }}
        onMouseLeave={e => { if (!value) e.currentTarget.style.borderColor = 'var(--panel-hover-border)'; }}
      >
        {busy ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px' }}>
            <Loader2 size={26} style={{ animation: 'spin-slow 0.8s linear infinite', color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Processing image…</span>
          </div>
        ) : value ? (
          <>
            <img src={value} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start',
              padding: '14px', background: 'linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.55))',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>Click to change</span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '16px',
              background: 'var(--accent-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ImageIcon size={24} strokeWidth={1.8} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>Upload from gallery</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '320px', margin: '0 auto', lineHeight: 1.5 }}>{description}</div>
            </div>
            <span className="tf-btn tf-btn-primary" style={{ padding: '8px 18px', fontSize: '12px' }}>Choose Image</span>
          </div>
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={() => { onChange(''); onSave?.(''); }}
          style={{ marginTop: '8px', fontSize: '12px', color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          ✕ Remove image
        </button>
      )}
    </div>
  );
}

// Read a file and downscale to maxDim px, output as a compressed JPEG data URL.
function compressImage(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function StepBranding({ form, setF, errors, saveMedia, mediaStatus }) {
  const lastPosterSaved = useRef(null);
  return (
    <Wrapper>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Images are saved automatically as soon as you upload them.
        </div>
        {mediaStatus && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600,
            padding: '4px 12px', borderRadius: '999px',
            color: mediaStatus === 'error' ? '#fca5a5' : mediaStatus === 'saving' ? 'var(--warning)' : '#34d399',
            background: mediaStatus === 'error' ? 'rgba(239,68,68,0.1)' : mediaStatus === 'saving' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
            border: `1px solid ${mediaStatus === 'error' ? 'rgba(239,68,68,0.3)' : mediaStatus === 'saving' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
          }}>
            {mediaStatus === 'saving' && <Loader2 size={12} style={{ animation: 'spin-slow 0.8s linear infinite' }} />}
            {mediaStatus === 'saving' ? 'Saving image…' : mediaStatus === 'error' ? 'Save failed — will save on submit' : '✓ Image saved'}
          </span>
        )}
      </div>

      <ImageUploader
        label="Cover Photo"
        description="The main banner shown on your event page and event cards — pick from your gallery."
        value={form.cover_image}
        onChange={v => setF('cover_image', v)}
        onSave={v => saveMedia('cover_image', v)}
        aspect="16/9"
      />

      <ImageUploader
        label="Theme Image"
        description="An optional background texture/atmosphere image that sets the mood of your event page."
        value={form.theme_image}
        onChange={v => setF('theme_image', v)}
        onSave={v => saveMedia('theme_image', v)}
        aspect="21/9"
      />

      <Input
        label="Poster Image URL (optional)"
        type="url"
        placeholder="https://yourbucket.s3.amazonaws.com/poster.jpg"
        value={form.poster_image}
        onChange={e => setF('poster_image', e.target.value)}
        onBlur={() => {
          // Only persist when the URL actually changed
          if (form.poster_image !== lastPosterSaved.current) {
            lastPosterSaved.current = form.poster_image;
            saveMedia('poster_image', form.poster_image);
          }
        }}
        helper="Alternative to uploading — link to an external image (saved on blur)"
      />

      {form.poster_image && !form.cover_image && (
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

function StepTickets({ ticketTypes, eventType, setEventTypeMode, addTicketType, removeTicketType, setTT, errors }) {
  return (
    <Wrapper>
      {/* Event Type toggle: Paid vs Free */}
      <Card style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
            background: eventType === 'free'
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : 'linear-gradient(135deg, #a855f7, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{eventType === 'free' ? <PartyPopper size={22} strokeWidth={2} style={{ color: '#fff' }} /> : <DollarSign size={22} strokeWidth={2} style={{ color: '#fff' }} />}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>Event Type</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {eventType === 'free'
                ? 'Tickets are free — customers reserve instantly with no payment step. QR codes still work at the gate.'
                : 'Customers pay at checkout via Stripe or EcoCash.'}
            </div>
          </div>
          <Badge variant={eventType === 'free' ? 'success' : 'primary'}>
            {eventType === 'free' ? 'FREE EVENT' : 'PAID EVENT'}
          </Badge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { id: 'paid', icon: CreditCard, label: 'Paid Event', desc: 'Sell tickets with pricing' },
            { id: 'free', icon: PartyPopper, label: 'Free Event', desc: 'Reserve tickets at $0.00' },
          ].map(opt => (
            <label
              key={opt.id}
              style={{
                padding: '16px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s',
                background: eventType === opt.id
                  ? (opt.id === 'free' ? 'rgba(16,185,129,0.1)' : 'rgba(168,85,247,0.1)')
                  : 'var(--panel-bg)',
                border: `2px solid ${eventType === opt.id ? (opt.id === 'free' ? '#10b981' : 'var(--accent)') : 'var(--panel-border)'}`,
              }}
            >
              <input
                type="radio"
                name="event_type"
                checked={eventType === opt.id}
                onChange={() => setEventTypeMode(opt.id)}
                style={{ display: 'none' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <opt.icon size={17} strokeWidth={2} />
                <span style={{ fontSize: '14px', fontWeight: 700 }}>{opt.label}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{opt.desc}</div>
            </label>
          ))}
        </div>
      </Card>

      {errors.tickets && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          color: '#fca5a5',
          fontSize: '13px',
          fontWeight: 500,
        }}><AlertTriangle size={16} style={{ verticalAlign: '-3px', marginRight: '6px' }} />{errors.tickets}</div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {tt.quantity_sold > 0 && (
                  <Badge variant="info" style={{ fontSize: '10px', padding: '2px 8px' }}>
                    {tt.quantity_sold} sold
                  </Badge>
                )}
                {ticketTypes.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={tt.quantity_sold > 0}
                    title={tt.quantity_sold > 0 ? 'This tier has sold tickets and cannot be removed' : undefined}
                    onClick={() => removeTicketType(i)}
                  >
                    {tt.quantity_sold > 0 ? 'Locked' : 'Remove'}
                  </Button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
              <Input
                label="Tier Name"
                placeholder="VIP / General / Early Bird"
                value={tt.name}
                onChange={e => setTT(i, 'name', e.target.value)}
              />
              <div>
                <div className="field-group">
                  <label>Price ($)</label>
                  {eventType === 'free' ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 14px', borderRadius: 'var(--radius-md)',
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      color: '#059669', fontWeight: 800, fontSize: '14px',
                    }}>
                      $0.00
                      <Badge variant="success" style={{ fontSize: '10px', padding: '2px 8px' }}>FREE</Badge>
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="25.00"
                      value={tt.price}
                      onChange={e => setTT(i, 'price', e.target.value)}
                      className="premium-input"
                      style={{ padding: '10px 14px', fontSize: '14px', borderRadius: 'var(--radius-md)', width: '100%' }}
                    />
                  )}
                </div>
              </div>
              <Input
                label="Quantity"
                type="number"
                min="1"
                placeholder="100"
                value={tt.quantity_available}
                onChange={e => setTT(i, 'quantity_available', e.target.value)}
              />
            </div>

            <div style={{ marginTop: '12px' }}>
              <Input
                label="Max tickets per person"
                type="number"
                min="0"
                placeholder="0 = unlimited"
                value={tt.max_per_person}
                onChange={e => setTT(i, 'max_per_person', e.target.value)}
                helper="Optional · caps how many tickets one email can reserve for this tier (prevents bulk grabbing)"
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

function getPaymentSummary(form) {
  const parts = ['Stripe'];
  if (form.ecocash_type && form.ecocash_type !== 'none' && form.ecocash_code) parts.push('EcoCash');
  if (form.bank_name && form.bank_account_number) parts.push('Bank');
  return parts.join(' · ');
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
            <Map size={34} strokeWidth={1.5} style={{ marginBottom: '6px', opacity: 0.7 }} />
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Map Preview · Coordinates below</div>
          </div>
        </div>
        <Badge variant="info" style={{ marginBottom: '0' }}><MapPin size={13} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '4px' }} />Current Venue: {form.venue || 'TBD'}</Badge>
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
  // Live preview of the USSD shortcode customers will dial
  const ecocashPreview = form.ecocash_type !== 'none' && form.ecocash_code
    ? buildEcocashShortcode({
        type: form.ecocash_type,
        code: form.ecocash_code,
        amount: '15.00',
        reference: 'TF8F3K2Q',
      })
    : null;

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
            flexShrink: 0,
          }}><Zap size={24} strokeWidth={2} style={{ color: '#fff' }} /></div>
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
            { id: 'stripe', name: 'Cards (Stripe)', icon: CreditCard, def: true },
            { id: 'mobile', name: 'Mobile Money', icon: Smartphone },
            { id: 'transfer', name: 'Bank Transfer', icon: Landmark },
            { id: 'cash', name: 'Cash at Gate', icon: Banknote },
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
              <opt.icon size={17} strokeWidth={2} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{opt.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* EcoCash Configuration */}
      <Card style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(59,130,246,0.05))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}><Smartphone size={22} strokeWidth={2} style={{ color: '#fff' }} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>EcoCash Configuration</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Optional · For mobile money payments in Zimbabwe
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              EcoCash Payment Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { id: 'none', label: 'Not Using', icon: X },
                { id: 'biller', label: 'Biller Code', icon: Landmark },
                { id: 'agent', label: 'Agent Code', icon: User },
              ].map(opt => (
                <label
                  key={opt.id}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: form.ecocash_type === opt.id ? 'rgba(16,185,129,0.1)' : 'var(--panel-bg)',
                    border: `2px solid ${form.ecocash_type === opt.id ? '#10b981' : 'var(--panel-border)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                  }}
                >
                  <input
                    type="radio"
                    name="ecocash_type"
                    checked={form.ecocash_type === opt.id}
                    onChange={() => setF('ecocash_type', opt.id)}
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}><opt.icon size={19} strokeWidth={2} /></div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>{opt.label}</div>
                </label>
              ))}
            </div>
          </div>

          {form.ecocash_type !== 'none' && (
            <>
              <Input
                label={form.ecocash_type === 'biller' ? 'Biller Code' : 'Agent Code'}
                placeholder={form.ecocash_type === 'biller' ? 'e.g. 12345' : 'e.g. 67890'}
                value={form.ecocash_code}
                onChange={e => setF('ecocash_code', e.target.value)}
                helper={form.ecocash_type === 'biller' ? 'Your EcoCash biller code for receiving payments' : 'Your EcoCash agent code for receiving payments'}
              />
              <Input
                label="Recipient Phone Number"
                type="tel"
                placeholder="e.g. 0771234567 or 0781234567"
                value={form.ecocash_phone}
                onChange={e => setF('ecocash_phone', e.target.value)}
                helper="Mobile number where EcoCash payments will be received"
              />

              {ecocashPreview && (
                <div style={{
                  padding: '14px 16px', borderRadius: '14px',
                  background: 'rgba(16,185,129,0.07)',
                  border: '1px dashed rgba(16,185,129,0.35)',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    <Zap size={13} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '4px' }} />Auto-generated customer shortcode (preview)
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '14px', fontWeight: 700, color: '#047857', wordBreak: 'break-all' }}>
                    {ecocashPreview}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px', lineHeight: 1.5 }}>
                    Customers tap-to-dial this when buying. The amount and a unique reference are added automatically at checkout.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Bank Transfer Configuration */}
      <Card style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(59,130,246,0.05))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}><Landmark size={22} strokeWidth={2} style={{ color: '#fff' }} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>Bank Account (Manual Transfer)</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Optional · Show customers your bank details for manual payments
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          <Input
            label="Bank Name"
            placeholder="e.g. CBZ Bank / Stanbic / EcoBank"
            value={form.bank_name}
            onChange={e => setF('bank_name', e.target.value)}
            helper="Where customers should transfer the money"
          />
          <Input
            label="Account Name"
            placeholder="e.g. EverAfter Hub (Pvt) Ltd"
            value={form.bank_account_name}
            onChange={e => setF('bank_account_name', e.target.value)}
          />
          <Input
            label="Account Number"
            placeholder="e.g. 01234567890123"
            value={form.bank_account_number}
            onChange={e => setF('bank_account_number', e.target.value)}
            helper="Customers will see these details at checkout"
          />
        </div>
      </Card>

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

function StepPublish({ form, ticketTypes, eventType, setF, onEdit }) {
  const validTickets = ticketTypes.filter(t => t.name && t.quantity_available !== '' && (eventType === 'free' || (t.price !== '' && Number(t.price) >= 0)));
  const totalQty = validTickets.reduce((sum, t) => sum + Number(t.quantity_available || 0), 0);
  const minPrice = validTickets.length ? Math.min(...validTickets.map(t => Number(t.price) || 0)) : 0;
  const maxPrice = validTickets.length ? Math.max(...validTickets.map(t => Number(t.price) || 0)) : 0;
  const isFreeEvent = eventType === 'free';

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
            flexShrink: 0,
          }}><PartyPopper size={38} strokeWidth={1.75} style={{ color: '#fff' }} /></div>
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
              {form.venue ? ` · ${form.venue}` : ''}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Badge variant="primary"><Ticket size={12} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{validTickets.length} tiers</Badge>
              <Badge variant="success"><Users size={12} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{totalQty.toLocaleString()} tickets</Badge>
              {isFreeEvent ? (
                <Badge variant="success"><Gift size={12} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '4px' }} />FREE · No payment required</Badge>
              ) : (
                <Badge variant="info">
                  <DollarSign size={12} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{minPrice === maxPrice ? `$${minPrice}` : `$${minPrice} – $${maxPrice}`}
                </Badge>
              )}
              {form.capacity && <Badge variant="warning"><Users size={12} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '4px' }} />Cap {Number(form.capacity).toLocaleString()}</Badge>}
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
          ['Payments', getPaymentSummary(form), 5, 'info'],
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
              }}><Save size={18} /></div>
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
              }}><Rocket size={18} /></div>
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
