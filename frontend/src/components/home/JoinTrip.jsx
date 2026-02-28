import { useState } from 'react';

export default function JoinTrip() {
  const [showInput, setShowInput] = useState(false);
  const [code, setCode] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    // UI only — no backend
    setShowInput(false);
    setCode('');
  };

  return (
    <div className="text-center mt-3">
      {!showInput ? (
        <>
          <span className="text-xs text-[var(--text-muted)]">Have an invite code? </span>
          <button
            type="button"
            onClick={() => setShowInput(true)}
            className="text-xs text-brand-500 font-semibold cursor-pointer hover:underline"
          >
            Join a trip →
          </button>
        </>
      ) : (
        <form onSubmit={handleJoin} className="inline-flex items-center gap-2 mt-1">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.slice(0, 6).toUpperCase())}
            maxLength={6}
            placeholder="ABC123"
            className="glass dark:glass-dark rounded-xl px-3 py-2 w-24 text-center text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none border border-transparent focus:border-brand-500/50"
          />
          <button
            type="submit"
            className="rounded-xl px-3 py-2 text-xs font-semibold bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            Join
          </button>
        </form>
      )}
    </div>
  );
}
