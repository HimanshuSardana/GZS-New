import { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import profileService from '@/services/features/profileService';
import { PROFILE_TYPE_FIELDS } from '../../config/subProfileFields';

export default function EditSubProfile() {
  usePageTheme('profile');

  const navigate = useNavigate();
  const { type } = useParams();
  
  const [form, setForm] = useState({
    display_name: '',
    primary_role: '',
    experience_level: 'advanced',
    about: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fields = useMemo(() => PROFILE_TYPE_FIELDS[type] || [], [type]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await profileService.getSubProfile(type);
        const data = response.data || response;
        setForm(prev => ({
          ...prev,
          ...data
        }));
      } catch (err) {
        console.error("Failed to fetch sub-profile:", err);
        setError("Could not load profile data. Using defaults.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [type]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await profileService.updateSubProfile(type, form);
      navigate(`/profile/${type}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field) => {
    const commonProps = {
      name: field.name,
      required: field.required,
      className: "pr-input",
      value: form[field.name] || '',
      onChange: (e) => updateField(field.name, field.type === 'checkbox' ? e.target.checked : e.target.value)
    };

    let inputElement;

    if (field.type === 'select') {
      inputElement = (
        <select {...commonProps}>
          <option value="">Select {field.label}...</option>
          {field.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    } else if (field.type === 'textarea') {
      inputElement = <textarea {...commonProps} rows={3} placeholder={field.placeholder} />;
    } else if (field.type === 'checkbox') {
      inputElement = (
        <label className="flex items-center gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            name={field.name}
            checked={!!form[field.name]}
            onChange={(e) => updateField(field.name, e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-violet-500 focus:ring-violet-500"
          />
          <span className="text-sm text-slate-600">Yes, I am {field.label.toLowerCase()}</span>
        </label>
      );
    } else {
      inputElement = <input type={field.type} {...commonProps} min={field.min} max={field.max} placeholder={field.placeholder} />;
    }

    return (
      <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <label className="pr-label">{field.label}{field.required && ' *'}</label>
        {inputElement}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--theme-bg)]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Edit {type} Profile | GzoneSphere</title>
      </Helmet>

      <div className="min-h-screen bg-[var(--theme-bg)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <Link to={`/profile/${type}`} className="text-sm font-medium text-violet-700">
              {'<-'} Back to sub-profile
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="gzs-profile-card">
              <h1 className="text-3xl font-semibold text-slate-900 capitalize">Edit {type} identity</h1>
              <p className="mt-2 text-sm text-slate-500">Refresh the identity signals people see when they open this domain profile.</p>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
                  {error}
                </div>
              )}
            </section>

            <section className="gzs-profile-card">
              <h2 className="mb-6 text-lg font-semibold text-slate-900">Core identity</h2>
              <div className="grid gap-5 md:grid-cols-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label className="pr-label">Display name *</label>
                  <input
                    required
                    value={form.display_name}
                    onChange={(event) => updateField('display_name', event.target.value)}
                    className="pr-input"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label className="pr-label">Experience level</label>
                  <select
                    value={form.experience_level}
                    onChange={(event) => updateField('experience_level', event.target.value)}
                    className="pr-input"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              <div className="mt-5" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label className="pr-label">Biographic log</label>
                <textarea
                  value={form.about}
                  onChange={(event) => updateField('about', event.target.value)}
                  rows={4}
                  className="pr-input"
                />
              </div>
            </section>

            <section className="gzs-profile-card">
              <h2 className="mb-6 text-lg font-semibold text-slate-900 capitalize">{type} domain specifics</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {fields.map(renderField)}
              </div>
            </section>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate(`/profile/${type}`)}
                className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-violet-500 px-8 py-2.5 text-sm font-medium text-white transition hover:bg-violet-600 disabled:bg-slate-300"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
