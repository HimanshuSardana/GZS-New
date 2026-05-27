import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { PROFILE_TYPE_FIELDS } from '../../config/subProfileFields';
import profileService from '@/services/features/profileService';

const DOMAIN_OPTIONS = [
  { id: 'developer', label: 'Game Development', color: 'var(--domain-dev)', description: 'Engineering, systems, gameplay, and technical design.' },
  { id: 'esports', label: 'Esports', color: 'var(--domain-esports)', description: 'Competitive roles, coaching, strategy, and team play.' },
  { id: 'content', label: 'Content', color: 'var(--domain-content)', description: 'Streaming, journalism, education, and creator work.' },
  { id: 'business', label: 'Business', color: 'var(--domain-business)', description: 'Product, publishing, partnerships, and operations.' },
  { id: 'artist', label: 'Art', color: 'var(--domain-art)', description: 'Concept art, animation, VFX, and visual craft.' },
  { id: 'writer', label: 'Writing', color: 'var(--domain-writing)', description: 'Narrative, worldbuilding, and editorial storytelling.' },
  { id: 'audio', label: 'Audio', color: 'var(--domain-audio)', description: 'Music, sound design, mixing, and implementation.' },
];

export default function CreateSubProfile() {
  usePageTheme('profile');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDomain = searchParams.get('domain');
  
  const [selected, setSelected] = useState(initialDomain || '');
  const [step, setStep] = useState(1);
  const [formValues, setFormValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeDomain = useMemo(
    () => DOMAIN_OPTIONS.find((option) => option.id === selected),
    [selected],
  );

  const fields = useMemo(() => PROFILE_TYPE_FIELDS[selected] || [], [selected]);

  const handleInputChange = (name, value) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await profileService.createSubProfile({
        type: selected,
        ...formValues
      });
      navigate(`/profile/${selected}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create sub-profile. Please check your data.');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const commonProps = {
      name: field.name,
      required: field.required,
      className: "pr-input",
      value: formValues[field.name] || '',
      onChange: (e) => handleInputChange(field.name, field.type === 'checkbox' ? e.target.checked : e.target.value)
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
            checked={!!formValues[field.name]}
            onChange={(e) => handleInputChange(field.name, e.target.checked)}
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

  return (
    <>
      <Helmet>
        <title>Create Sub-Profile | GzoneSphere</title>
      </Helmet>

      <div className="min-h-screen bg-[var(--theme-bg)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <Link to="/profile" className="text-sm font-medium text-violet-700">
              {'<-'} Back to profile
            </Link>
          </div>

          <div className="gzs-profile-card">
            <h1 className="text-3xl font-semibold text-slate-900">Create a new sub-profile</h1>
            <p className="mt-2 text-sm text-slate-500">
              {step === 1 
                ? 'Pick the domain identity you want to build next.' 
                : `Complete your ${activeDomain?.label} identity to finalize this persona.`}
            </p>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {step === 1 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {DOMAIN_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelected(option.id)}
                    className={`rounded-3xl border p-5 text-left transition ${
                      selected === option.id ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span
                        className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ backgroundColor: `${option.color}18`, color: option.color }}
                      >
                        {option.label}
                      </span>
                      <span className={`h-4 w-4 rounded-full border ${selected === option.id ? 'border-violet-500 bg-violet-500' : 'border-slate-300'}`} />
                    </div>
                    <p className="mt-4 text-sm text-slate-600">{option.description}</p>
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid gap-6 md:grid-cols-2">
                  {fields.map(renderField)}
                </div>

                <div className="pt-4 flex justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
                  >
                    Back to selection
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-violet-500 px-8 py-2.5 text-sm font-medium text-white transition hover:bg-violet-600 disabled:bg-slate-300"
                  >
                    {loading ? 'Processing...' : 'Finalize Profile'}
                  </button>
                </div>
              </form>
            )}

            {step === 1 && (
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => selected && setStep(2)}
                  disabled={!selected}
                  className="rounded-xl bg-violet-500 px-8 py-2.5 text-sm font-medium text-white transition hover:bg-violet-600 disabled:bg-slate-300"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
