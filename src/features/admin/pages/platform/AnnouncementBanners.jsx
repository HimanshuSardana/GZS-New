import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiAlertTriangle } from 'react-icons/fi';
import { AdminPageHero } from '@/features/admin/components/AdminContentShell';
import { useToast } from '@/shared/components/Toast';

const MOCK_BANNERS = [
  {
    id: 'b1',
    message: '🚀 New tournament season starting May 25! Register now.',
    type: 'info',
    pages: 'All pages',
    dismissible: true,
    start: '2026-05-20T00:00:00Z',
    end: '2026-05-26T00:00:00Z',
    active: true,
  },
  {
    id: 'b2',
    message: '⚠️ Scheduled maintenance on May 22, 2am–4am IST. Save your work.',
    type: 'warning',
    pages: 'All pages',
    dismissible: false,
    start: '2026-05-21T00:00:00Z',
    end: '2026-05-22T04:00:00Z',
    active: false,
  },
];

const BANNER_COLOURS = {
  info:    'bg-blue-500/10 border-blue-500/30 text-blue-300',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  error:   'bg-rose-500/10 border-rose-500/30 text-rose-300',
};

const TYPE_DOT = {
  info:    'bg-blue-400',
  warning: 'bg-amber-400',
  success: 'bg-emerald-400',
  error:   'bg-rose-400',
};

const EMPTY_FORM = {
  message: '',
  type: 'info',
  pages: 'All pages',
  custom_path: '',
  dismissible: true,
  start_at: '',
  end_at: '',
  active: false,
};

function ToggleSwitch({ value, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
        value ? 'bg-emerald-500' : 'bg-slate-600'
      } cursor-pointer`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function BannerPreview({ message, type, dismissible }) {
  const colours = BANNER_COLOURS[type] || BANNER_COLOURS.info;
  if (!message) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[var(--theme-border)] p-4 text-center text-xs text-[var(--theme-text-muted)] opacity-40 italic">
        Live preview appears here as you type
      </div>
    );
  }
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${colours}`}>
      <span>{message}</span>
      {dismissible && <FiX size={14} className="shrink-0 opacity-70" />}
    </div>
  );
}

function BannerModal({ banner, onClose, onSave }) {
  const [form, setForm] = useState(banner || EMPTY_FORM);
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <h3 className="text-lg font-black uppercase tracking-tight italic text-[var(--theme-text)]">
            {banner ? 'Edit Banner' : 'Create New Banner'}
          </h3>
          <button onClick={onClose} className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] transition-colors">
            <FiX size={20} />
          </button>
        </div>

        <div className="px-8 pb-8 space-y-5">
          {/* Live Preview */}
          <div>
            <p className="admin-label">Live preview</p>
            <BannerPreview message={form.message} type={form.type} dismissible={form.dismissible} />
          </div>

          {/* Message */}
          <div className="admin-field">
            <label className="admin-label">Message <span className="text-[var(--theme-text-muted)] opacity-40 font-normal">{form.message.length}/120</span></label>
            <textarea
              className="admin-textarea w-full"
              maxLength={120}
              rows={2}
              placeholder="Enter banner message…"
              value={form.message}
              onChange={e => set('message', e.target.value)}
            />
          </div>

          {/* Type */}
          <div className="admin-field">
            <label className="admin-label">Type</label>
            <div className="flex gap-3 flex-wrap">
              {['info', 'warning', 'success', 'error'].map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="banner-type"
                    value={t}
                    checked={form.type === t}
                    onChange={() => set('type', t)}
                    className="sr-only"
                  />
                  <span className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                    form.type === t
                      ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]'
                      : 'border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)]/30'
                  }`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${TYPE_DOT[t]}`} />
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Pages */}
          <div className="admin-field">
            <label className="admin-label">Show on</label>
            <div className="flex gap-3">
              {['All pages', 'Custom path'].map(p => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="banner-pages"
                    value={p}
                    checked={form.pages === p}
                    onChange={() => set('pages', p)}
                    className="sr-only"
                  />
                  <span className={`px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                    form.pages === p
                      ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]'
                      : 'border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)]/30'
                  }`}>
                    {p}
                  </span>
                </label>
              ))}
            </div>
            {form.pages === 'Custom path' && (
              <input
                className="admin-input mt-3 w-full"
                placeholder="/tournaments or /jobs…"
                value={form.custom_path}
                onChange={e => set('custom_path', e.target.value)}
              />
            )}
          </div>

          {/* Options row */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-[var(--theme-text)] cursor-pointer">
              <input
                type="checkbox"
                checked={form.dismissible}
                onChange={e => set('dismissible', e.target.checked)}
                className="rounded border-[var(--theme-border)] accent-[var(--theme-primary)]"
              />
              Users can dismiss this banner
            </label>
            <div className="flex items-center gap-2 text-sm text-[var(--theme-text)]">
              <ToggleSwitch value={form.active} onChange={val => set('active', val)} />
              <span>{form.active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div className="admin-field">
              <label className="admin-label">Show from (IST)</label>
              <input
                className="admin-input w-full"
                type="datetime-local"
                value={form.start_at}
                onChange={e => set('start_at', e.target.value)}
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">Hide after (IST)</label>
              <input
                className="admin-input w-full"
                type="datetime-local"
                value={form.end_at}
                onChange={e => set('end_at', e.target.value)}
              />
            </div>
          </div>

          {form.active && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-300 text-xs leading-relaxed">
              <FiAlertTriangle size={13} className="mt-0.5 shrink-0" />
              Only one banner can be active at a time. Activating this will deactivate any current active banner.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              className="admin-btn flex-1"
              disabled={!form.message.trim()}
              onClick={() => onSave(form)}
            >
              {banner ? 'Save changes' : 'Create banner'}
            </button>
            <button className="admin-btn--secondary" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AnnouncementBanners() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState(MOCK_BANNERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const activeBanner = banners.find(b => b.active);

  const handleSave = (form) => {
    if (form.active) {
      setBanners(prev => prev.map(b => ({ ...b, active: false })));
    }
    if (editTarget) {
      setBanners(prev => prev.map(b => b.id === editTarget.id ? { ...b, ...form } : b));
      showToast('Banner updated.', 'success');
    } else {
      const newId = `b${Date.now()}`;
      setBanners(prev => [...prev, { id: newId, ...form }]);
      showToast('Banner created.', 'success');
    }
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleToggleActive = (id) => {
    setBanners(prev =>
      prev.map(b => {
        if (b.id === id) {
          const next = !b.active;
          if (next) showToast('Banner activated. Others deactivated.', 'success');
          return { ...b, active: next };
        }
        return { ...b, active: false };
      })
    );
  };

  const handleDelete = (id) => {
    setBanners(prev => prev.filter(b => b.id !== id));
    setDeleteId(null);
    showToast('Banner deleted.', 'success');
  };

  return (
    <div className="admin-page">
      <AdminPageHero
        kicker="Platform"
        title="Banners"
        description="Create and schedule announcement banners displayed across the platform."
        actions={
          <button className="admin-btn flex items-center gap-2" onClick={() => { setEditTarget(null); setModalOpen(true); }}>
            <FiPlus size={14} /> Create banner
          </button>
        }
      />

      {/* Active banner preview */}
      <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2rem] p-6 mb-8">
        <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-40 mb-4">
          Active banner preview
        </p>
        {activeBanner ? (
          <BannerPreview message={activeBanner.message} type={activeBanner.type} dismissible={activeBanner.dismissible} />
        ) : (
          <p className="text-sm text-[var(--theme-text-muted)] opacity-40 italic text-center py-4">No banner currently active</p>
        )}
      </div>

      {/* Banners table */}
      <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2rem] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--theme-border)] text-left">
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40">Message</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40">Type</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40">Active</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40">Schedule</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40"></th>
            </tr>
          </thead>
          <tbody>
            {banners.map(banner => (
              <tr key={banner.id} className="border-b border-[var(--theme-border)]/40 last:border-0 hover:bg-[var(--theme-bg-alt)]/20 transition-colors">
                <td className="px-6 py-4 text-[var(--theme-text)] max-w-xs">
                  <span className="line-clamp-2 text-sm">
                    {banner.message.length > 60 ? banner.message.slice(0, 60) + '…' : banner.message}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${BANNER_COLOURS[banner.type]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${TYPE_DOT[banner.type]}`} />
                    {banner.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <ToggleSwitch value={banner.active} onChange={() => handleToggleActive(banner.id)} />
                </td>
                <td className="px-6 py-4 text-xs text-[var(--theme-text-muted)] opacity-60">
                  {formatDate(banner.start)} → {formatDate(banner.end)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditTarget(banner); setModalOpen(true); }}
                      className="p-1.5 rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/10 transition-all"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(banner.id)}
                      className="p-1.5 rounded-lg text-[var(--theme-text-muted)] hover:text-rose-400 hover:bg-rose-400/10 transition-all"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <BannerModal
          banner={editTarget}
          onClose={() => { setModalOpen(false); setEditTarget(null); }}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <p className="text-[var(--theme-text)] font-semibold mb-2">Delete this banner?</p>
            <p className="text-sm text-[var(--theme-text-muted)] opacity-60 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button className="admin-btn--danger flex-1" onClick={() => handleDelete(deleteId)}>Delete</button>
              <button className="admin-btn--secondary flex-1" onClick={() => setDeleteId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
