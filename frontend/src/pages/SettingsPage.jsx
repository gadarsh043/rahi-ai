import { useEffect, useState } from 'react';
import CountryAutocomplete from '../components/home/CountryAutocomplete';
import { fetchProfile, updateProfile } from '../services/api';

export default function SettingsPage() {
  const [passportCountry, setPassportCountry] = useState(null);
  const [visaStatus, setVisaStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProfile();
        const p = data?.profile || {};
        if (p.passport_country) {
          setPassportCountry({
            name: p.passport_country,
            flag: '🌍',
            code: String(p.passport_country).slice(0, 2).toUpperCase(),
          });
        }
        setVisaStatus(p.visa_status || '');
      } catch {
        // ignore
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus('');
    try {
      await updateProfile({
        passport_country: passportCountry?.name || '',
        visa_status: visaStatus || null,
      });
      setStatus('Saved');
      setTimeout(() => setStatus(''), 1200);
    } catch {
      setStatus('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-1 min-h-0 p-4 md:p-6">
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Settings</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            These preferences help Rahi personalize your trips.
          </p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
                Passport & Visa
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Optional — improves visa guidance during trip generation.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl px-4 py-2 text-sm font-semibold shadow-brand hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 transition-all"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Passport Country
              <span className="text-[var(--text-muted)] font-normal ml-1">
                (used for visa checks)
              </span>
            </label>
            <CountryAutocomplete
              placeholder="e.g. India, United States"
              value={passportCountry}
              onChange={setPassportCountry}
            />

            {passportCountry && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Current Visa/Residency Status
                  <span className="text-[var(--text-muted)] font-normal ml-1">
                    (optional)
                  </span>
                </label>
                <select
                  value={visaStatus}
                  onChange={(e) => setVisaStatus(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-brand-500/50 text-base"
                >
                  <option value="">Tourist / No special visa</option>
                  <option value="F-1">Student Visa (F-1 / M-1)</option>
                  <option value="H-1B">Work Visa (H-1B / L-1)</option>
                  <option value="green_card">Permanent Resident / Green Card</option>
                  <option value="citizen">Citizen of destination country</option>
                  <option value="other">Other visa type</option>
                </select>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Helps us give accurate visa advice for your trips
                </p>
              </div>
            )}

            {status && (
              <p className="text-xs text-[var(--text-muted)] mt-3">{status}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
