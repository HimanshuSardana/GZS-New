import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/shared/components/Toast';

export function useSettingsForm(fetchFn, saveFn) {
  const [values, setValues] = useState({});
  const [original, setOriginal] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchFn().then(data => {
      setValues(data || {});
      setOriginal(data || {});
      setIsLoading(false);
    }).catch((err) => {
      console.error('Failed to fetch settings:', err);
      setIsLoading(false);
    });
  }, [fetchFn]);

  const isDirty = JSON.stringify(values) !== JSON.stringify(original);

  const handleChange = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveFn(values);
      setOriginal(values);
      showToast('Settings saved', 'success');
    } catch (err) {
      console.error('Failed to save settings:', err);
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [values, saveFn, showToast]);

  return { values, setValues, setOriginal, isLoading, isSaving, isDirty, handleChange, handleSave };
}
