import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiArrowLeft, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useToast } from '@/shared/components/Toast';
import { mockApiService } from '@services/mockApiService';
import { AdminPageHero, AdminPanel, AdminMetrics, AdminEmptyState } from './AdminContentShell';
import AIFeaturePlaceholder from '@/shared/components/AIFeaturePlaceholder';
import { ensureArray, safeString, slugify, toIsoDate } from './adminFormUtils';

const DOMAIN_OPTIONS = ['Esports', 'Art', 'Writing', 'Music', 'Dev', 'General'];
const FORMAT_OPTIONS = ['1v1 Solo', 'Team', 'Battle Royale', 'Round Robin'];
const STATUS_OPTIONS = ['Draft', 'Registration Open', 'Registration Closed', 'Live', 'Completed', 'Cancelled'];
const PLATFORM_OPTIONS = ['PC', 'PlayStation', 'Xbox', 'Mobile'];
const REGION_OPTIONS = ['India', 'APAC', 'Europe', 'North America', 'LATAM', 'Middle East'];
const TIMEZONE_OPTIONS = ['IST', 'UTC', 'EST', 'CET'];

const emptyStage = () => ({ name: '', format: 'BO1', participants: '', advanceCount: '' });
const emptyField = () => ({ type: 'text', label: '', helper: '', required: true, options: '' });
const emptyPrize = () => ({ placement: '', prize: '', reward: '', proStatus: false });
const emptyHighlight = () => ({ label: '', description: '' });

const defaultForm = {
  name: '',
  slug: '',
  domain: 'Esports',
  game: '',
  bannerImage: '',
  heroBackground: '',
  format: '1v1 Solo',
  teamSize: 1,
  maxParticipants: 16,
  entryFeeType: 'Free',
  entryFeeAmount: '',
  status: 'Draft',
  registrationOpens: '',
  registrationCloses: '',
  bracketAnnouncement: '',
  checkInStart: '',
  checkInEnd: '',
  tournamentStart: '',
  expectedDuration: '',
  finalsDate: '',
  timezone: 'IST',
  stages: [emptyStage()],
  rulesSummary: '',
  fullRulesDocument: '',
  platforms: [],
  regions: [],
  importantNotes: '',
  customFields: [emptyField()],
  totalPrizePool: '',
  prizeDistribution: [emptyPrize()],
  distributionPolicy: '',
  highlights: [emptyHighlight(), emptyHighlight()],
  organiser: 'Gzone Admin',
  externalContact: '',
};

function hydrateTournament(tournament) {
  if (!tournament) return defaultForm;
  return {
    ...defaultForm,
    ...tournament,
    name: safeString(tournament.name || tournament.title),
    slug: safeString(tournament.slug || slugify(tournament.name || tournament.title)),
    domain: safeString(tournament.domain || tournament.type || defaultForm.domain),
    game: safeString(tournament.game),
    bannerImage: safeString(tournament.bannerImage || tournament.banner_url),
    heroBackground: safeString(tournament.heroBackground),
    format: safeString(tournament.format || tournament.bracket_type || defaultForm.format),
    teamSize: Number(tournament.teamSize || tournament.team_size || 1),
    maxParticipants: Number(tournament.maxParticipants || tournament.max_participants || tournament.slots || 16),
    entryFeeType: safeString(tournament.entryFeeType || 'Free'),
    entryFeeAmount: safeString(tournament.entryFeeAmount),
    status: safeString(tournament.status || defaultForm.status),
    registrationOpens: safeString(tournament.registrationOpens || tournament.registration_open),
    registrationCloses: safeString(tournament.registrationCloses || tournament.registration_close),
    bracketAnnouncement: safeString(tournament.bracketAnnouncement),
    checkInStart: safeString(tournament.checkInStart),
    checkInEnd: safeString(tournament.checkInEnd),
    tournamentStart: safeString(tournament.tournamentStart || tournament.start_date || tournament.date),
    expectedDuration: safeString(tournament.expectedDuration),
    finalsDate: safeString(tournament.finalsDate || tournament.end_date),
    timezone: safeString(tournament.timezone || defaultForm.timezone),
    stages: ensureArray(tournament.stages).length ? ensureArray(tournament.stages) : defaultForm.stages,
    rulesSummary: safeString(tournament.rulesSummary || tournament.rules),
    fullRulesDocument: safeString(tournament.fullRulesDocument),
    platforms: ensureArray(tournament.platforms),
    regions: ensureArray(tournament.regions),
    importantNotes: safeString(tournament.importantNotes),
    customFields: ensureArray(tournament.customFields).length ? ensureArray(tournament.customFields) : defaultForm.customFields,
    totalPrizePool: safeString(tournament.totalPrizePool || tournament.prize),
    prizeDistribution: ensureArray(tournament.prizeDistribution).length ? ensureArray(tournament.prizeDistribution) : defaultForm.prizeDistribution,
    distributionPolicy: safeString(tournament.distributionPolicy),
    highlights: ensureArray(tournament.highlights).length ? ensureArray(tournament.highlights) : defaultForm.highlights,
    organiser: safeString(tournament.organiser || defaultForm.organiser),
    externalContact: safeString(tournament.externalContact),
  };
}

function Input({ label, value, onChange, type = 'text', hint, placeholder }) {
  return (
    <label>
      <span>{label}</span>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} />
      {hint ? <small className="admin-field-hint">{hint}</small> : null}
    </label>
  );
}

function Area({ label, value, onChange, rows = 5, hint }) {
  return (
    <label>
      <span>{label}</span>
      <textarea value={value} onChange={onChange} rows={rows} />
      {hint ? <small className="admin-field-hint">{hint}</small> : null}
    </label>
  );
}

export default function TournamentEditorForm({ mode = 'create' }) {
  const navigate = useNavigate();
  const params = useParams();
  const { showToast } = useToast();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [games, setGames] = useState([]);
  const [openSections, setOpenSections] = useState({
    basic: true,
    schedule: true,
    rules: true,
    customFields: true,
    prizes: true,
    highlights: true,
  });

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      const [allTournaments, allGames] = await Promise.all([
        mockApiService.getAllTournaments(),
        mockApiService.getAllGames(),
      ]);
      if (!mounted) return;
      setGames(allGames);
      if (mode === 'edit') {
        const current = allTournaments.find((item) => String(item.id) === String(params.id));
        if (!current) {
          showToast('Tournament not found.', 'error');
          navigate('/admin/tournaments');
          return;
        }
        setForm(hydrateTournament(current));
      }
      setLoading(false);
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [mode, navigate, params.id, showToast]);

  const metrics = useMemo(() => [
    { label: 'Domain', value: form.domain },
    { label: 'Format', value: form.format },
    { label: 'Stages', value: `${form.stages.length}` },
    { label: 'Prize Pool', value: form.totalPrizePool || 'TBD' },
  ], [form]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateName(value) {
    setForm((prev) => ({ ...prev, name: value, slug: slugify(value) }));
  }

  function updateListItem(key, index, patch) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    }));
  }

  function addListItem(key, factory) {
    setForm((prev) => ({ ...prev, [key]: [...prev[key], factory()] }));
  }

  function removeListItem(key, index) {
    setForm((prev) => ({ ...prev, [key]: prev[key].filter((_, itemIndex) => itemIndex !== index) }));
  }

  function toggleArrayValue(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value],
    }));
  }

  async function saveTournament(nextStatus) {
    if (!form.name.trim()) {
      showToast('Tournament name is required.', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      title: form.name,
      name: form.name,
      slug: form.slug || slugify(form.name),
      status: nextStatus,
      banner_url: form.bannerImage,
      date: form.tournamentStart || toIsoDate(new Date()),
      type: form.domain,
      game: form.game,
      prize: form.totalPrizePool,
      max_participants: form.maxParticipants,
      current_participants: form.current_participants || 0,
      bracket_type: form.format,
      team_size: form.teamSize,
      registration_open: form.registrationOpens,
      registration_close: form.registrationCloses,
      start_date: form.tournamentStart,
      end_date: form.finalsDate,
      is_public: nextStatus !== 'Draft',
    };

    try {
      if (mode === 'edit') {
        await mockApiService.updateTournament(Number(params.id) || params.id, payload);
        showToast(nextStatus === 'Live' ? 'Tournament moved live.' : 'Tournament updated.', 'success');
      } else {
        await mockApiService.addTournament(payload);
        showToast(nextStatus === 'Live' ? 'Tournament created and marked live.' : 'Tournament saved.', 'success');
      }
      navigate('/admin/tournaments');
    } catch {
      showToast('Unable to save the tournament.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="admin-empty-state">Loading tournament editor...</div>;
  }

  return (
    <div className="admin-page-shell admin-table-page">
      <Helmet>
        <title>{mode === 'edit' ? `Edit ${form.name}` : 'Create Tournament'} | GzoneSphere Admin</title>
      </Helmet>

      <AdminPageHero
        kicker="Admin / Tournaments"
        title={mode === 'edit' ? 'Edit Tournament' : 'Create Tournament'}
        description="Single-page tournament editor with collapsible sections for schedule, rules, prize structure, and organiser details, aligned to the admin specification."
        actions={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => navigate('/admin/tournaments')}>
              <FiArrowLeft />
              Back to tournaments
            </button>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => saveTournament('Draft')} disabled={saving}>
              Save draft
            </button>
            <button type="button" className="admin-btn" onClick={() => saveTournament(form.status === 'Live' ? 'Live' : 'Registration Open')} disabled={saving}>
              {mode === 'edit' ? 'Update tournament' : 'Create tournament'}
            </button>
          </>
        )}
      />

      <AdminMetrics items={metrics} />

      <div className="admin-sticky-bar">
        <div className="admin-sticky-bar__meta">
          <strong>{form.name || 'Untitled tournament'}</strong>
          <span>{form.status}</span>
          <span>{form.maxParticipants} max participants</span>
        </div>
        <div className="admin-sticky-bar__actions">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => saveTournament('Draft')} disabled={saving}>Save</button>
          <button type="button" className="admin-btn" onClick={() => saveTournament('Registration Open')} disabled={saving}>Publish</button>
        </div>
      </div>

      <SectionCard title="Section 1: Basic Information" open={openSections.basic} onToggle={() => setOpenSections((prev) => ({ ...prev, basic: !prev.basic }))}>
        <div className="admin-form-grid cols-2">
          <Input label="Tournament Name" value={form.name} onChange={(event) => updateName(event.target.value)} />
          <label>
            <span>Tournament Domain</span>
            <select value={form.domain} onChange={(event) => updateField('domain', event.target.value)}>
              {DOMAIN_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span>Game</span>
            <select value={form.game} onChange={(event) => updateField('game', event.target.value)}>
              <option value="">No linked game</option>
              {games.map((game) => <option key={game.id} value={game.title}>{game.title}</option>)}
            </select>
          </label>
          <Input label="Slug" value={form.slug} onChange={(event) => updateField('slug', slugify(event.target.value))} />
          <Input label="Tournament Banner Image" value={form.bannerImage} onChange={(event) => updateField('bannerImage', event.target.value)} />
          <Input label="Hero Background" value={form.heroBackground} onChange={(event) => updateField('heroBackground', event.target.value)} />
          <label>
            <span>Format</span>
            <select value={form.format} onChange={(event) => updateField('format', event.target.value)}>
              {FORMAT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <Input label="Team Size" type="number" value={form.teamSize} onChange={(event) => updateField('teamSize', Number(event.target.value || 1))} />
          <Input label="Max Participants" type="number" value={form.maxParticipants} onChange={(event) => updateField('maxParticipants', Number(event.target.value || 0))} />
          <label>
            <span>Entry Fee Type</span>
            <select value={form.entryFeeType} onChange={(event) => updateField('entryFeeType', event.target.value)}>
              {['Free', 'GZS Coins', 'Cash'].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <Input label="Entry Fee Amount" value={form.entryFeeAmount} onChange={(event) => updateField('entryFeeAmount', event.target.value)} placeholder={form.entryFeeType === 'Free' ? 'Hidden on page' : 'e.g. 500 GZS Coins'} />
          <label>
            <span>Status</span>
            <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
              {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Section 2: Schedule" open={openSections.schedule} onToggle={() => setOpenSections((prev) => ({ ...prev, schedule: !prev.schedule }))}>
        <div className="admin-form-grid cols-3">
          <Input label="Registration Opens" type="datetime-local" value={form.registrationOpens} onChange={(event) => updateField('registrationOpens', event.target.value)} />
          <Input label="Registration Closes" type="datetime-local" value={form.registrationCloses} onChange={(event) => updateField('registrationCloses', event.target.value)} />
          <Input label="Bracket Announcement" type="datetime-local" value={form.bracketAnnouncement} onChange={(event) => updateField('bracketAnnouncement', event.target.value)} />
          <Input label="Check-in Start" type="datetime-local" value={form.checkInStart} onChange={(event) => updateField('checkInStart', event.target.value)} />
          <Input label="Check-in End" type="datetime-local" value={form.checkInEnd} onChange={(event) => updateField('checkInEnd', event.target.value)} />
          <Input label="Tournament Start" type="datetime-local" value={form.tournamentStart} onChange={(event) => updateField('tournamentStart', event.target.value)} />
          <Input label="Expected Duration" value={form.expectedDuration} onChange={(event) => updateField('expectedDuration', event.target.value)} placeholder="3 days" />
          <Input label="Finals Date" type="datetime-local" value={form.finalsDate} onChange={(event) => updateField('finalsDate', event.target.value)} />
          <AIFeaturePlaceholder
            title="Match Time Optimisation"
            description="Given participant timezones from registration data, AI suggests match time slots that minimise scheduling conflicts."
            phase="Phase 2"
            inputLabel="Paste participant timezone data or let system auto-collect"
            inputType="textarea"
            actionLabel="Optimise Schedule"
          />
          <label>
            <span>Timezone</span>
            <select value={form.timezone} onChange={(event) => updateField('timezone', event.target.value)}>
              {TIMEZONE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Section 3: Stages & Rules" open={openSections.rules} onToggle={() => setOpenSections((prev) => ({ ...prev, rules: !prev.rules }))}>
        <RepeatableSection
          title="Stages"
          items={form.stages}
          onAdd={() => addListItem('stages', emptyStage)}
          onRemove={(index) => removeListItem('stages', index)}
          render={(item, index) => (
            <div className="admin-form-grid cols-4">
              <Input label="Stage Name" value={item.name} onChange={(event) => updateListItem('stages', index, { name: event.target.value })} />
              <Input label="Format" value={item.format} onChange={(event) => updateListItem('stages', index, { format: event.target.value })} />
              <Input label="Participants" value={item.participants} onChange={(event) => updateListItem('stages', index, { participants: event.target.value })} />
              <Input label="Advance Count" value={item.advanceCount} onChange={(event) => updateListItem('stages', index, { advanceCount: event.target.value })} />
            </div>
          )}
        />
        <AIFeaturePlaceholder
          title="Smart Bracket Seeding"
          description="Use verified rank data from Esports sub-profiles to seed brackets fairly. Admin gets a seeding suggestion and can override."
          phase="Phase 2"
          inputLabel="Seeding runs after registration closes"
          inputType="url"
          actionLabel="Generate Seeding"
        />
        <Area label="Rules Summary" value={form.rulesSummary} onChange={(event) => updateField('rulesSummary', event.target.value)} hint="Shown inline on the public detail page." />
        <Input label="Full Rules Document" value={form.fullRulesDocument} onChange={(event) => updateField('fullRulesDocument', event.target.value)} placeholder="PDF URL or external link" />
        <Area label="Important Notes" value={form.importantNotes} onChange={(event) => updateField('importantNotes', event.target.value)} />
        <div className="admin-form-card">
          <div className="admin-form-card__header">
            <div>
              <h3 className="admin-form-card__title">Platform & Region</h3>
              <p className="admin-form-card__description">Multi-select filters used on the public tournament detail page.</p>
            </div>
          </div>
          <div className="admin-multi-select">
            {PLATFORM_OPTIONS.map((platform) => (
              <button key={platform} type="button" className={`admin-chip ${form.platforms.includes(platform) ? 'is-active' : ''}`} onClick={() => toggleArrayValue('platforms', platform)}>
                {platform}
              </button>
            ))}
          </div>
          <div className="admin-multi-select" style={{ marginTop: '0.75rem' }}>
            {REGION_OPTIONS.map((region) => (
              <button key={region} type="button" className={`admin-chip ${form.regions.includes(region) ? 'is-active' : ''}`} onClick={() => toggleArrayValue('regions', region)}>
                {region}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Section 4: Game-Specific Registration Fields" open={openSections.customFields} onToggle={() => setOpenSections((prev) => ({ ...prev, customFields: !prev.customFields }))}>
        <RepeatableSection
          title="Custom Field"
          items={form.customFields}
          onAdd={() => addListItem('customFields', emptyField)}
          onRemove={(index) => removeListItem('customFields', index)}
          render={(item, index) => (
            <div className="admin-form-grid cols-4">
              <label>
                <span>Field Type</span>
                <select value={item.type} onChange={(event) => updateListItem('customFields', index, { type: event.target.value })}>
                  {['text', 'dropdown', 'number', 'checkbox', 'file'].map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <Input label="Field Label" value={item.label} onChange={(event) => updateListItem('customFields', index, { label: event.target.value })} />
              <Input label="Helper Text" value={item.helper} onChange={(event) => updateListItem('customFields', index, { helper: event.target.value })} />
              <Input label="Options" value={item.options} onChange={(event) => updateListItem('customFields', index, { options: event.target.value })} placeholder="For dropdowns only" />
              <label className="admin-checkbox-row">
                <input type="checkbox" checked={item.required} onChange={(event) => updateListItem('customFields', index, { required: event.target.checked })} />
                <span>Required field</span>
              </label>
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Section 5: Prize Pool" open={openSections.prizes} onToggle={() => setOpenSections((prev) => ({ ...prev, prizes: !prev.prizes }))}>
        <Input label="Total Prize Pool" value={form.totalPrizePool} onChange={(event) => updateField('totalPrizePool', event.target.value)} placeholder="e.g. INR 50,000" />
        <RepeatableSection
          title="Prize Row"
          items={form.prizeDistribution}
          onAdd={() => addListItem('prizeDistribution', emptyPrize)}
          onRemove={(index) => removeListItem('prizeDistribution', index)}
          render={(item, index) => (
            <div className="admin-form-grid cols-4">
              <Input label="Placement" value={item.placement} onChange={(event) => updateListItem('prizeDistribution', index, { placement: event.target.value })} />
              <Input label="Prize" value={item.prize} onChange={(event) => updateListItem('prizeDistribution', index, { prize: event.target.value })} />
              <Input label="GZS Reward" value={item.reward} onChange={(event) => updateListItem('prizeDistribution', index, { reward: event.target.value })} />
              <label className="admin-checkbox-row">
                <input type="checkbox" checked={item.proStatus} onChange={(event) => updateListItem('prizeDistribution', index, { proStatus: event.target.checked })} />
                <span>Includes Pro status</span>
              </label>
            </div>
          )}
        />
        <Area label="Distribution Policy" value={form.distributionPolicy} onChange={(event) => updateField('distributionPolicy', event.target.value)} />
      </SectionCard>

      <SectionCard title="Section 6: Highlights & Organiser" open={openSections.highlights} onToggle={() => setOpenSections((prev) => ({ ...prev, highlights: !prev.highlights }))}>
        <RepeatableSection
          title="Highlight"
          items={form.highlights}
          onAdd={() => form.highlights.length < 4 && addListItem('highlights', emptyHighlight)}
          onRemove={(index) => removeListItem('highlights', index)}
          render={(item, index) => (
            <div className="admin-form-grid cols-2">
              <Input label="Label" value={item.label} onChange={(event) => updateListItem('highlights', index, { label: event.target.value })} />
              <Input label="Description" value={item.description} onChange={(event) => updateListItem('highlights', index, { description: event.target.value })} />
            </div>
          )}
        />
        <div className="admin-form-grid cols-2">
          <Input label="Organiser" value={form.organiser} onChange={(event) => updateField('organiser', event.target.value)} />
          <Input label="External Contact" value={form.externalContact} onChange={(event) => updateField('externalContact', event.target.value)} placeholder="Email or URL" />
        </div>
      </SectionCard>

      <div className="admin-form-footer">
        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => saveTournament('Draft')} disabled={saving}>Save as draft</button>
        <button type="button" className="admin-btn" onClick={() => saveTournament('Registration Open')} disabled={saving}>Publish tournament</button>
      </div>

      {!games.length ? <AdminEmptyState title="No games available" description="Game-linked tournaments can be connected once the games library has entries." /> : null}
    </div>
  );
}

function SectionCard({ title, open, onToggle, children }) {
  return (
    <AdminPanel
      title={title}
      meta={open ? 'Collapse section' : 'Expand section'}
      padded
    >
      <button type="button" className="admin-btn admin-btn--ghost" onClick={onToggle} style={{ marginBottom: '1rem' }}>
        {open ? 'Collapse' : 'Expand'}
      </button>
      {open ? children : null}
    </AdminPanel>
  );
}

function RepeatableSection({ title, items, onAdd, onRemove, render }) {
  return (
    <div className="admin-form-card">
      <div className="admin-form-card__header">
        <h3 className="admin-form-card__title">{title}</h3>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={onAdd}>
          <FiPlus />
          Add row
        </button>
      </div>
      {items.length ? (
        <div className="admin-repeatable-list">
          {items.map((item, index) => (
            <div key={`${title}-${index}`} className="admin-repeatable-item">
              <div className="admin-repeatable-item__header">
                <strong className="admin-repeatable-item__title">{title} {index + 1}</strong>
                {items.length > 1 ? (
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => onRemove(index)}>
                    <FiTrash2 />
                    Remove
                  </button>
                ) : null}
              </div>
              {render(item, index)}
            </div>
          ))}
        </div>
      ) : (
        <AdminEmptyState title={`No ${title.toLowerCase()} configured`} description="Use Add row to create the first entry." />
      )}
    </div>
  );
}

