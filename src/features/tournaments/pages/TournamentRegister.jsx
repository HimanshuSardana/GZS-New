import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FiCheck, FiChevronDown, FiPlus, FiX,
  FiUpload, FiAlertCircle, FiArrowLeft,
} from 'react-icons/fi';

import { usePageTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/useAuth';
import { useTournament } from '@/services/mutators/useTournaments';
import tournamentService from '@/services/features/tournamentService';
import { adaptTournamentRecord } from '@/shared/adapters/contentAdapters';

/* ── Game-specific field configs (from spec) ─────────────── */

const GAME_FIELDS_CONFIG = {
  valorant: [
    {
      name: 'riot_id',
      label: 'Riot ID + Tagline',
      type: 'text',
      placeholder: 'PlayerName#0000',
      pattern: /^.+#\d{4,5}$/,
      required: true,
    },
    {
      name: 'peak_rank',
      label: 'Peak Rank',
      type: 'select',
      options: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'],
      required: true,
    },
    {
      name: 'server_region',
      label: 'Server Region',
      type: 'select',
      options: ['AP', 'NA', 'EU', 'LATAM', 'BR', 'KR'],
      required: true,
    },
    {
      name: 'primary_role',
      label: 'Primary Role',
      type: 'select',
      options: ['Duelist', 'Controller', 'Sentinel', 'Initiator', 'Flex'],
      required: true,
    },
  ],
  fifa: [
    { name: 'ea_id',        label: 'EA Account ID',         type: 'text',   required: true  },
    { name: 'platform',     label: 'Platform',              type: 'select', options: ['PS5', 'Xbox Series X/S', 'PC'], required: true },
    { name: 'division_rank',label: 'Current Division Rank', type: 'text',   required: false },
  ],
  default: [
    { name: 'ingame_username', label: 'In-Game Username', type: 'text',   required: true },
    {
      name: 'platform', label: 'Platform', type: 'select',
      options: ['PC', 'PlayStation', 'Xbox', 'Mobile'], required: true,
    },
    {
      name: 'skill_level', label: 'Skill Level', type: 'select',
      options: ['Beginner', 'Intermediate', 'Advanced', 'Professional'], required: true,
    },
  ],
};

/* ── Country fallback list ───────────────────────────────── */

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Brazil', 'Argentina', 'Japan', 'South Korea',
  'Singapore', 'Indonesia', 'Philippines', 'Malaysia', 'Thailand',
  'Vietnam', 'Pakistan', 'Nigeria', 'South Africa', 'Egypt',
  'Turkey', 'Russia', 'Ukraine', 'Poland', 'Spain', 'Italy',
  'Netherlands', 'Sweden', 'Mexico', 'Colombia', 'UAE', 'Saudi Arabia',
];

/* ── Helpers ─────────────────────────────────────────────── */

function parseMinTeamSize(format = '') {
  const match = format.match(/(\d+)v\d+/i);
  if (match) return parseInt(match[1], 10);
  if (format.toLowerCase().includes('team')) return 2;
  return 1;
}

function genRefId() {
  return `GZS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function isTeamFmt(format = '') {
  const f = format.toLowerCase();
  return f.includes('team') || f.includes('5v5') || /\dv\d/.test(f);
}

/* ── Razorpay script loader ──────────────────────────────── */

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    document.body.appendChild(script);
  });
}

/* ── Main component ──────────────────────────────────────── */

export default function TournamentRegister() {
  usePageTheme('tournaments-page');
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const { data: rawTournament } = useTournament(slug);
  const tournament = rawTournament ? adaptTournamentRecord(rawTournament) : null;

  /* ── Derived config ──────────────────────────────────── */

  const fmt          = tournament?.format || '';
  const isTeamFormat = isTeamFmt(fmt);
  const minTeamSize  = parseMinTeamSize(fmt);
  const gameSlug     = (tournament?.game_slug || tournament?.game || '').toLowerCase();
  const gameKey      = Object.keys(GAME_FIELDS_CONFIG).find(k => gameSlug.includes(k)) || 'default';
  const gameFields   = GAME_FIELDS_CONFIG[gameKey];
  const customFields = Array.isArray(tournament?.custom_registration_fields) ? tournament.custom_registration_fields : [];
  const regions      = tournament?.eligible_regions?.length ? tournament.eligible_regions : COUNTRIES;

  const captainName  = user?.username || user?.name || '';
  const captainEmail = user?.email || '';

  /* ── Form state ──────────────────────────────────────── */

  const [formData, setFormData] = useState({
    player_name:       isTeamFormat ? '' : captainName,
    email:             captainEmail,
    region:            '',
    team_name:         '',
    team_logo:         null,
    team_logo_preview: null,
    members:           [],           // extra members (captain is always index 0)
    game_fields:       {},
    custom_fields:     {},
    competitive_level: '',
    past_experience:   '',
    rules_agreed:      false,
    info_accurate:     false,
    data_consent:      false,
    payment_method:    'GZS Coins',
  });

  const [errors,      setErrors]      = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registered,  setRegistered]  = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [showFullRules, setShowFullRules] = useState(false);
  const [gzsBalance,  setGzsBalance]  = useState(null);

  const logoInputRef = useRef(null);

  useEffect(() => {
    if (!tournament?.entry_fee || tournament.entry_fee <= 0) return;
    if (formData.payment_method !== 'GZS Coins') return;
    tournamentService.createPaymentOrder(tournament.id || slug, 'GZS Coins')
      .then(data => setGzsBalance(data))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament?.id, tournament?.entry_fee, formData.payment_method]);

  /* ── Handlers ────────────────────────────────────────── */

  const set = (field, value) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const setGameField = (name, value) =>
    setFormData(prev => ({
      ...prev,
      game_fields: { ...prev.game_fields, [name]: value },
    }));

  const setCustomField = (name, value) =>
    setFormData(prev => ({
      ...prev,
      custom_fields: { ...prev.custom_fields, [name]: value },
    }));

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set('team_logo', file);
    set('team_logo_preview', URL.createObjectURL(file));
  };

  const addMember = (username) => {
    const u = username.trim();
    if (!u || formData.members.includes(u)) return;
    set('members', [...formData.members, u]);
  };

  const removeMember = (idx) =>
    set('members', formData.members.filter((_, i) => i !== idx));

  /* ── Validation ──────────────────────────────────────── */

  const validate = () => {
    const errs = {};

    if (!isTeamFormat && !formData.player_name.trim())
      errs.player_name = 'Player name is required';
    if (isTeamFormat && !formData.team_name.trim())
      errs.team_name = 'Team name is required';
    if (!formData.email.trim())
      errs.email = 'Contact email is required';
    if (!formData.region)
      errs.region = 'Country / Region is required';

    if (isTeamFormat) {
      const total = 1 + formData.members.length;
      if (total < minTeamSize)
        errs.members = `Need at least ${minTeamSize} members (including captain). Add ${minTeamSize - total} more.`;
    }

    gameFields.forEach(field => {
      if (field.required) {
        const val = (formData.game_fields[field.name] || '').trim();
        if (!val) {
          errs[`game_${field.name}`] = `${field.label} is required`;
        } else if (field.pattern && !field.pattern.test(val)) {
          errs[`game_${field.name}`] = `Invalid format — expected e.g. ${field.placeholder || field.label}`;
        }
      }
    });

    customFields.forEach(field => {
      if (field.required) {
        const val = formData.custom_fields[field.name];
        const isEmpty = field.type === 'checkbox'
          ? !val
          : !(String(val || '')).trim();
        if (isEmpty) errs[`custom_${field.name}`] = `${field.label} is required`;
      }
    });

    if (!formData.competitive_level)
      errs.competitive_level = 'Please select your competitive level';
    if (!formData.rules_agreed)
      errs.rules_agreed = 'You must agree to the tournament rules';
    if (!formData.info_accurate)
      errs.info_accurate = 'You must confirm your information is accurate';
    if (!formData.data_consent)
      errs.data_consent = 'You must consent to data usage';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const canSubmit = formData.rules_agreed && formData.info_accurate && formData.data_consent;

  /* ── Submit ──────────────────────────────────────────── */

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const hasFee = tournament?.entry_fee > 0;
      let razorpayPaymentId = null;

      if (hasFee) {
        const orderData = await tournamentService.createPaymentOrder(
          tournament.id || slug,
          formData.payment_method,
        );

        if (formData.payment_method === 'GZS Coins') {
          if (!orderData.sufficient) {
            setErrors(prev => ({
              ...prev,
              payment: `Insufficient GZS Coins. Balance: ${orderData.balance ?? 0}, Required: ${orderData.required ?? tournament.entry_fee}`,
            }));
            setIsSubmitting(false);
            return;
          }
        } else {
          // Razorpay checkout flow
          await loadRazorpayScript();
          razorpayPaymentId = await new Promise((resolve, reject) => {
            const rzp = new window.Razorpay({
              key: orderData.key || 'rzp_test_placeholder',
              amount: orderData.amount || Math.round(tournament.entry_fee * 100),
              currency: orderData.currency || 'INR',
              order_id: orderData.order_id,
              name: orderData.name || 'GzoneSphere',
              description: `Entry fee — ${tournament.name || 'Tournament'}`,
              handler: (response) => resolve(response.razorpay_payment_id),
              modal: { ondismiss: () => reject(new Error('Payment cancelled by user')) },
            });
            rzp.open();
          });
        }
      }

      const payload = {
        player_name:       formData.player_name,
        team_name:         formData.team_name,
        email:             formData.email,
        region:            formData.region,
        team_members:      isTeamFormat ? [captainName, ...formData.members] : [],
        game_fields: {
          ...formData.game_fields,
          ...formData.custom_fields,
          ...(hasFee ? { payment_method: formData.payment_method } : {}),
          ...(razorpayPaymentId ? { razorpay_payment_id: razorpayPaymentId } : {}),
        },
        competitive_level: formData.competitive_level,
        past_experience:   formData.past_experience,
        payment_method:    hasFee ? formData.payment_method : null,
      };
      await tournamentService.register(tournament?.id || slug, payload);
      setReferenceId(genRefId());
      setRegistered(true);
    } catch (err) {
      const msg = err?.message || 'Registration failed. Please try again.';
      setErrors(prev => ({ ...prev, _server: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Confirmation screen ─────────────────────────────── */

  if (registered) {
    return (
      <div className="tr-page">
        <Helmet><title>Registered | GzoneSphere</title></Helmet>
        <div className="tr-confirmation">
          <div className="tr-confirmation__icon">
            <FiCheck size={36} strokeWidth={2.5} />
          </div>
          <h2 className="tr-confirmation__title">You&apos;re In!</h2>
          <p className="tr-confirmation__tournament">{tournament?.name}</p>
          <p className="tr-confirmation__ref">
            Registration ID: <strong>{referenceId}</strong>
          </p>
          <p className="tr-confirmation__detail">
            A confirmation email has been sent to{' '}
            <strong>{formData.email}</strong>
          </p>
          <div className="tr-confirmation__actions">
            <Link to={`/tournaments/${slug}`} className="tr-btn tr-btn--primary">
              View Tournament
            </Link>
            <Link to="/tournaments" className="tr-btn tr-btn--secondary">
              Browse Tournaments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form render ─────────────────────────────────────── */

  return (
    <div className="tr-page">
      <Helmet>
        <title>Register — {tournament?.name || 'Tournament'} | GzoneSphere</title>
      </Helmet>

      {/* Hero */}
      <section className="tr-hero">
        {tournament?.heroImage && (
          <img
            src={tournament.heroImage}
            alt=""
            className="tr-hero__bg"
            aria-hidden="true"
            loading="eager"
          />
        )}
        <div className="tr-hero__overlay" />
        <div className="tr-hero__content">
          <button
            type="button"
            className="tr-back-btn"
            onClick={() => navigate(-1)}
            style={{ marginBottom: '0.5rem', padding: '0' }}
          >
            <FiArrowLeft size={16} /> Back
          </button>
          <p className="tr-hero__label">Tournament Registration</p>
          <h1 className="tr-hero__title">
            {tournament?.name || 'Loading Tournament…'}
          </h1>
          {tournament && (
            <div className="tr-hero__meta">
              {tournament.prize && (
                <span className="tr-hero__prize">Prize: {tournament.prize}</span>
              )}
              {tournament.date && (
                <span className="tr-hero__date">{tournament.date}</span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Form */}
      <div className="tr-form-wrapper">
        <form className="tr-register-form" onSubmit={handleSubmit} noValidate>

          {/* Server error */}
          {errors._server && (
            <div className="tr-server-error">
              <FiAlertCircle size={16} />
              {errors._server}
            </div>
          )}

          {/* ── SECTION 1: Universal fields ────────────────── */}
          <section className="tr-section">
            <h2 className="tr-section__title">Player Information</h2>

            {/* Player name (solo) or Team name (team) */}
            {isTeamFormat ? (
              <div className="tr-field-group">
                <span className="tr-label">
                  <span>Team Name <span className="tr-label__required">*</span></span>
                  <span
                    className={`tr-label__counter${
                      formData.team_name.length >= 30 ? ' tr-label__counter--limit' : ''
                    }`}
                  >
                    {formData.team_name.length}/30
                  </span>
                </span>
                <input
                  className={`tr-input${errors.team_name ? ' tr-input--error' : ''}`}
                  value={formData.team_name}
                  onChange={e => set('team_name', e.target.value)}
                  maxLength={30}
                  placeholder="Enter your team name"
                />
                {errors.team_name && (
                  <p className="tr-error-msg">{errors.team_name}</p>
                )}
              </div>
            ) : (
              <div className="tr-field-group">
                <span className="tr-label">Player Name</span>
                <input
                  className="tr-input tr-input--readonly"
                  value={formData.player_name}
                  readOnly
                  tabIndex={-1}
                />
              </div>
            )}

            {/* Contact email */}
            <div className="tr-field-group">
              <span className="tr-label">
                Contact Email <span className="tr-label__required">*</span>
              </span>
              <input
                type="email"
                className={`tr-input${errors.email ? ' tr-input--error' : ''}`}
                value={formData.email}
                onChange={e => set('email', e.target.value)}
                placeholder="your@email.com"
              />
              {errors.email && <p className="tr-error-msg">{errors.email}</p>}
            </div>

            {/* Country / Region */}
            <div className="tr-field-group">
              <span className="tr-label">
                Country / Region <span className="tr-label__required">*</span>
              </span>
              <div className="tr-select-wrap">
                <select
                  className={`tr-select${errors.region ? ' tr-input--error' : ''}`}
                  value={formData.region}
                  onChange={e => set('region', e.target.value)}
                >
                  <option value="">Select your region…</option>
                  {regions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <FiChevronDown className="tr-select-wrap__chevron" />
              </div>
              {errors.region && <p className="tr-error-msg">{errors.region}</p>}
            </div>
          </section>

          {/* ── SECTION 2: Team-specific fields ───────────────── */}
          {isTeamFormat && (
            <section className="tr-section tr-team-fields">
              <h2 className="tr-section__title">Team Details</h2>

              {/* Team logo */}
              <div className="tr-field-group">
                <span className="tr-label">
                  Team Logo{' '}
                  <span className="tr-label__optional">(Optional · 200×200 px)</span>
                </span>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="tr-logo-upload__input"
                  onChange={handleLogoChange}
                />
                {formData.team_logo_preview ? (
                  <div className="tr-logo-preview">
                    <img src={formData.team_logo_preview} alt="Team logo preview" />
                    <button
                      type="button"
                      className="tr-logo-preview__remove"
                      onClick={() => {
                        set('team_logo', null);
                        set('team_logo_preview', null);
                      }}
                    >
                      <FiX size={14} /> Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="tr-logo-upload"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <FiUpload size={20} />
                    <span>Upload team logo</span>
                  </button>
                )}
              </div>

              {/* Team members */}
              <div className="tr-field-group">
                <span className="tr-label">
                  Team Members{' '}
                  <span className="tr-label__optional">
                    (min {minTeamSize} including captain)
                  </span>
                </span>

                {/* Captain card */}
                <div className="tr-member-card tr-member-card--captain">
                  <img
                    className="tr-member-card__avatar"
                    src={`https://i.pravatar.cc/100?u=${captainName || 'captain'}`}
                    alt=""
                  />
                  <div className="tr-member-card__info">
                    <span className="tr-member-card__name">
                      {captainName || 'You'}
                    </span>
                    <span className="tr-member-card__badge">Captain</span>
                  </div>
                </div>

                {/* Added members */}
                {formData.members.map((m, i) => (
                  <div key={`${m}-${i}`} className="tr-member-card">
                    <img
                      className="tr-member-card__avatar"
                      src={`https://i.pravatar.cc/100?u=${m}`}
                      alt=""
                    />
                    <div className="tr-member-card__info">
                      <span className="tr-member-card__name">{m}</span>
                    </div>
                    <button
                      type="button"
                      className="tr-member-card__remove"
                      onClick={() => removeMember(i)}
                    >
                      <FiX size={14} /> Remove
                    </button>
                  </div>
                ))}

                <AddMemberRow onAdd={addMember} />
                {errors.members && (
                  <p className="tr-error-msg">{errors.members}</p>
                )}
              </div>
            </section>
          )}

          {/* ── SECTION 3: Game-specific fields ───────────────── */}
          <section className="tr-section tr-game-fields">
            <h2 className="tr-section__title">Game Details</h2>

            {gameFields.map(field => (
              <div key={field.name} className="tr-field-group">
                <span className="tr-label">
                  {field.label}
                  {field.required && <span className="tr-label__required"> *</span>}
                </span>

                {field.type === 'select' ? (
                  <div className="tr-select-wrap">
                    <select
                      className={`tr-select${
                        errors[`game_${field.name}`] ? ' tr-input--error' : ''
                      }`}
                      value={formData.game_fields[field.name] || ''}
                      onChange={e => setGameField(field.name, e.target.value)}
                    >
                      <option value="">Select {field.label}…</option>
                      {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <FiChevronDown className="tr-select-wrap__chevron" />
                  </div>
                ) : (
                  <input
                    type="text"
                    className={`tr-input${
                      errors[`game_${field.name}`] ? ' tr-input--error' : ''
                    }`}
                    placeholder={field.placeholder || ''}
                    value={formData.game_fields[field.name] || ''}
                    onChange={e => setGameField(field.name, e.target.value)}
                  />
                )}

                {errors[`game_${field.name}`] && (
                  <p className="tr-error-msg">{errors[`game_${field.name}`]}</p>
                )}
              </div>
            ))}
          </section>

          {/* ── SECTION 3b: Game-Specific Details (custom fields) ── */}
          {customFields.length > 0 && (
            <section className="tr-section tr-game-fields">
              <h2 className="tr-section__title">Game-Specific Details</h2>

              {customFields.map(field => (
                <div key={field.name} className="tr-field-group">
                  <span className="tr-label">
                    {field.label}
                    {field.required && <span className="tr-label__required"> *</span>}
                  </span>

                  {field.type === 'dropdown' ? (
                    <div className="tr-select-wrap">
                      <select
                        className={`tr-select${errors[`custom_${field.name}`] ? ' tr-input--error' : ''}`}
                        value={formData.custom_fields[field.name] || ''}
                        onChange={e => setCustomField(field.name, e.target.value)}
                      >
                        <option value="">Select {field.label}…</option>
                        {(field.options || []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <FiChevronDown className="tr-select-wrap__chevron" />
                    </div>
                  ) : field.type === 'checkbox' ? (
                    <label className={`tr-checkbox${formData.custom_fields[field.name] ? ' tr-checkbox--checked' : ''}`}>
                      <input
                        type="checkbox"
                        className="tr-checkbox__input"
                        checked={!!formData.custom_fields[field.name]}
                        onChange={e => setCustomField(field.name, e.target.checked)}
                      />
                      <span className="tr-checkbox__box">
                        {formData.custom_fields[field.name] && <FiCheck size={11} strokeWidth={3} />}
                      </span>
                      <span className="tr-checkbox__label">{field.placeholder || field.label}</span>
                    </label>
                  ) : field.type === 'file' ? (
                    <input
                      type="file"
                      className={`tr-input${errors[`custom_${field.name}`] ? ' tr-input--error' : ''}`}
                      onChange={e => setCustomField(field.name, e.target.files?.[0]?.name || '')}
                    />
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      className={`tr-input${errors[`custom_${field.name}`] ? ' tr-input--error' : ''}`}
                      placeholder={field.placeholder || ''}
                      value={formData.custom_fields[field.name] || ''}
                      onChange={e => setCustomField(field.name, e.target.value)}
                    />
                  )}

                  {errors[`custom_${field.name}`] && (
                    <p className="tr-error-msg">{errors[`custom_${field.name}`]}</p>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* ── SECTION 4: Competitive declaration ────────────── */}
          <section className="tr-section">
            <h2 className="tr-section__title">Competitive Declaration</h2>

            <div className="tr-field-group">
              <span className="tr-label">
                How would you rate your competitive level?{' '}
                <span className="tr-label__required">*</span>
              </span>
              <div className="tr-select-wrap">
                <select
                  className={`tr-select${errors.competitive_level ? ' tr-input--error' : ''}`}
                  value={formData.competitive_level}
                  onChange={e => set('competitive_level', e.target.value)}
                >
                  <option value="">Select level…</option>
                  {['Beginner', 'Intermediate', 'Advanced', 'Professional'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <FiChevronDown className="tr-select-wrap__chevron" />
              </div>
              {errors.competitive_level && (
                <p className="tr-error-msg">{errors.competitive_level}</p>
              )}
            </div>

            <div className="tr-field-group">
              <span className="tr-label">
                <span>Past Tournament Experience</span>
                <span className="tr-label__optional">
                  Optional · {formData.past_experience.length}/300
                </span>
              </span>
              <textarea
                className="tr-textarea"
                placeholder="Describe any previous tournament participation…"
                maxLength={300}
                rows={4}
                value={formData.past_experience}
                onChange={e => set('past_experience', e.target.value)}
              />
            </div>
          </section>

          {/* ── SECTION 5: Rules & consent ─────────────────────── */}
          <section className="tr-section tr-consent-section">
            <h2 className="tr-section__title">Rules &amp; Consent</h2>

            {/* Expandable rules */}
            <div className="tr-rules">
              <div
                className={`tr-rules__preview${
                  showFullRules ? ' tr-rules__preview--expanded' : ''
                }`}
              >
                {tournament?.rules ||
                  tournament?.rules_summary ||
                  tournament?.notes ||
                  'Standard competitive integrity rules apply. No scripting, hacking, or unsportsmanlike behaviour. All decisions by tournament organizers are final.'}
              </div>
              <button
                type="button"
                className="tr-rules__toggle"
                onClick={() => setShowFullRules(p => !p)}
              >
                {showFullRules ? 'Hide rules' : 'Show full rules'}
                <FiChevronDown
                  style={{
                    transition: 'transform 0.2s',
                    transform: showFullRules ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>
            </div>

            {/* Three required checkboxes */}
            <div className="tr-checkboxes">
              {[
                {
                  key: 'rules_agreed',
                  text: 'I agree to the tournament rules and code of conduct',
                },
                {
                  key: 'info_accurate',
                  text: 'I confirm all information provided is accurate',
                },
                {
                  key: 'data_consent',
                  text: 'I consent to my GZS profile data being used for tournament registration and results display',
                },
              ].map(({ key, text }) => (
                <label
                  key={key}
                  className={`tr-checkbox${formData[key] ? ' tr-checkbox--checked' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="tr-checkbox__input"
                    checked={formData[key]}
                    onChange={() => set(key, !formData[key])}
                  />
                  <span className="tr-checkbox__box">
                    {formData[key] && <FiCheck size={11} strokeWidth={3} />}
                  </span>
                  <span className="tr-checkbox__label">{text}</span>
                </label>
              ))}
            </div>
          </section>

          {/* ── SECTION 6: Payment (conditional) ──────────────── */}
          {tournament?.entry_fee > 0 && (
            <section className="tr-section tr-payment">
              <h2 className="tr-section__title">Entry Fee</h2>

              <div className="tr-payment__fee">
                <span className="tr-payment__fee-amount">
                  ₹{tournament.entry_fee}
                </span>
                <span className="tr-payment__fee-label">Entry Fee</span>
              </div>

              <div className="tr-payment__radio-group">
                {[
                  { id: 'GZS Coins',        label: 'GZS Coins' },
                  { id: 'External Payment', label: 'Pay via Razorpay' },
                ].map(m => (
                  <label
                    key={m.id}
                    className={`tr-payment__radio${
                      formData.payment_method === m.id
                        ? ' tr-payment__radio--active'
                        : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={m.id}
                      checked={formData.payment_method === m.id}
                      onChange={() => set('payment_method', m.id)}
                      className="tr-payment__radio-input"
                    />
                    <span className="tr-payment__radio-dot" />
                    {m.label}
                  </label>
                ))}
              </div>

              {/* GZS Coins balance info */}
              {formData.payment_method === 'GZS Coins' && gzsBalance !== null && (
                <div className={`mt-4 px-4 py-3 rounded-2xl border text-xs font-bold ${
                  gzsBalance.sufficient
                    ? 'border-green-500/30 bg-green-500/5 text-green-400'
                    : 'border-red-500/30 bg-red-500/5 text-red-400'
                }`}>
                  {gzsBalance.sufficient
                    ? `GZS Balance: ${gzsBalance.balance} coins — sufficient for entry.`
                    : `Insufficient GZS Coins. Balance: ${gzsBalance.balance ?? 0}, Required: ${gzsBalance.required ?? tournament.entry_fee}.`
                  }
                </div>
              )}

              {errors.payment && (
                <p className="tr-error-msg">{errors.payment}</p>
              )}

              {tournament.refund_policy && (
                <p className="tr-payment__refund">{tournament.refund_policy}</p>
              )}
            </section>
          )}

          {/* ── Submit ─────────────────────────────────────────── */}
          <div className="tr-submit-row">
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={`tr-submit-btn${!canSubmit ? ' tr-submit-btn--disabled' : ''}${
                isSubmitting ? ' tr-submit-btn--loading' : ''
              }`}
            >
              {isSubmitting ? 'Registering…' : 'Complete Registration'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

/* ── Add-member sub-component ────────────────────────────── */

function AddMemberRow({ onAdd }) {
  const [value, setValue] = useState('');

  const commit = () => {
    if (!value.trim()) return;
    onAdd(value.trim());
    setValue('');
  };

  return (
    <div className="tr-add-member">
      <input
        type="text"
        className="tr-input tr-add-member__input"
        placeholder="Add member by GZS username"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
        }}
      />
      <button
        type="button"
        className="tr-add-member__btn"
        onClick={commit}
      >
        <FiPlus size={16} /> Add
      </button>
    </div>
  );
}
