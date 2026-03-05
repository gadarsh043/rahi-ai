import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          MVP placeholder. Update this before launch.
        </p>
      </div>

      <div className="space-y-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <p className="text-sm text-[var(--text-secondary)]">
          Rahify uses Supabase for authentication (Google OAuth) and stores your trips in
          a database so you can reopen them later.
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          Before launch, replace this page with your full privacy policy covering data
          collection, retention, deletion, and third‑party APIs (Google Places, etc.).
        </p>
        <div className="pt-2">
          <Link to="/" className="text-sm font-semibold text-brand-500 hover:underline">
            ← Back to app
          </Link>
        </div>
      </div>
    </div>
  );
}

