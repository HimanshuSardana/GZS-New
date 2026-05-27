import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FiRefreshCw } from 'react-icons/fi';
import profileService from '@/services/features/profileService';
import core from '@/services/api/core';
import { useToast } from '@/shared/components/Toast';

const AVAILABILITY_CONFIG = [
  { key: 'hiring',        label: 'Hiring interest',       description: 'Open to roles' },
  { key: 'collaboration', label: 'Collaboration interest', description: 'Open to collabs' },
  { key: 'events',        label: 'Open to events',         description: 'Tournament invites' },
];

const DEFAULT_FLAGS = { hiring: false, collaboration: false, events: false };

export default function GlobalAvailabilitySwitches() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ['profile', 'me'], queryFn: profileService.getMasterProfile });

  const [localFlags, setLocalFlags] = useState(DEFAULT_FLAGS);
  const [initialized, setInitialized] = useState(false);
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => {
    if (!initialized && profile?.availability_flags) {
      setLocalFlags(profile.availability_flags);
      setInitialized(true);
    }
  }, [profile, initialized]);

  const handleToggle = async (key) => {
    const prev = localFlags;
    const newFlags = { ...localFlags, [key]: !localFlags[key] };
    setLocalFlags(newFlags);
    setSavingKey(key);
    try {
      await core.patch('/profiles/me', { availability_flags: newFlags });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    } catch {
      setLocalFlags(prev);
      showToast({ type: 'error', message: 'Could not save. Check your connection and try again.' });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>
        Global Availability
      </p>
      <div className="space-y-3">
        {AVAILABILITY_CONFIG.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{item.label}</p>
              <p className="text-xs" style={{ color: '#94A3B8' }}>{item.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {savingKey === item.key && (
                <FiRefreshCw size={12} className="animate-spin" style={{ color: '#94A3B8' }} />
              )}
              <button
                type="button"
                onClick={() => handleToggle(item.key)}
                disabled={savingKey !== null}
                aria-pressed={localFlags[item.key]}
                className="relative rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-60"
                style={{
                  width: 44, height: 24,
                  background: localFlags[item.key] ? '#1D6ADB' : '#CBD5E1',
                }}
              >
                <span className="sr-only">Toggle {item.label}</span>
                <span
                  className="pointer-events-none absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-300"
                  style={{ left: localFlags[item.key] ? 24 : 4 }}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
