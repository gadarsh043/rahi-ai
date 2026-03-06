import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import useAuthStore from '../../stores/authStore';

function getHighlightSegments(text, formData) {
  const highlights = [
    formData?.origin?.city,
    formData?.destination?.city,
    formData?.pace,
    formData?.budgetVibe,
    formData?.numDays && `${formData.numDays} days`,
    formData?.accommodationType && `${formData.accommodationType}s`,
  ].filter(Boolean);

  const segments = [];
  let pos = 0;
  const hay = String(text || '');

  while (pos < hay.length) {
    let best = -1;
    let bestLen = 0;
    for (const phrase of highlights) {
      const idx = hay.indexOf(phrase, pos);
      if (idx !== -1 && (best === -1 || idx < best)) {
        best = idx;
        bestLen = phrase.length;
      }
    }
    if (best === -1) {
      segments.push({ type: 'text', value: hay.slice(pos) });
      break;
    }
    if (best > pos) segments.push({ type: 'text', value: hay.slice(pos, best) });
    segments.push({ type: 'highlight', value: hay.slice(best, best + bestLen) });
    pos = best + bestLen;
  }
  return segments;
}

export default function PromptBox({ promptText = '', promptBase = '', instructions = '', isComplete, formData, onGenerate }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [editInstructions, setEditInstructions] = useState(instructions);

  const canGenerate = isComplete;

  useEffect(() => {
    if (!expanded) return;
    setEditInstructions(instructions);
  }, [expanded, instructions]);

  useEffect(() => {
    if (!expanded) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expanded]);

  const handleExpand = () => {
    setEditInstructions(instructions);
    setExpanded(true);
  };

  const handleGenerate = () => {
    if (!canGenerate || typeof onGenerate !== 'function') return;

    // Not logged in — redirect to login, come back after auth
    if (!user) {
      navigate('/login?redirect=/');
      return;
    }

    const instructionsTrimmed = (expanded ? editInstructions : instructions)?.trim() || '';
    const promptToUse = promptBase.trim()
      ? (promptBase.trim() + (instructionsTrimmed ? ' ' + instructionsTrimmed : '')).trim()
      : instructionsTrimmed || promptText;
    onGenerate(formData, promptToUse);
  };

  return (
    <div data-tour="prompt-box" className="sticky bottom-14 lg:bottom-0 left-0 right-0 z-[var(--z-sticky)] pt-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-3 shadow-lg">
        <AnimatePresence mode="wait">
          {!expanded ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-row items-center gap-2"
            >
              <button
                type="button"
                onClick={handleExpand}
                className="flex flex-1 min-w-0 items-center gap-2 text-left"
                title={promptText || 'Your trip summary will appear here...'}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-500 shrink-0">
                  Request:
                </span>
                <span className="text-sm text-[var(--text-secondary)] line-clamp-2 flex-1 text-left break-words">
                  {promptText
                    ? getHighlightSegments(promptText, formData).map((seg, i) =>
                        seg.type === 'highlight' ? (
                          <span key={i} className="text-brand-600 dark:text-brand-400 font-semibold">
                            {seg.value}
                          </span>
                        ) : (
                          seg.value
                        )
                      )
                    : 'Your trip summary will appear here...'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`
                  bg-brand-500 hover:bg-brand-600 text-white w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors
                  ${!canGenerate ? 'opacity-40 cursor-not-allowed' : ''}
                `}
                aria-label="Generate trip"
              >
                ➤
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="space-y-3"
            >
              {promptBase.trim() ? (
                <>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-500 block mb-1">
                    Request:
                  </span>
                  <div
                    className="w-full text-sm text-[var(--text-secondary)] select-none rounded-xl bg-[var(--surface)] border border-[var(--border)] px-3 py-2.5"
                    aria-readonly
                  >
                    {promptBase.trim()}
                  </div>
                </>
              ) : null}
              <textarea
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                placeholder="Add any extra instructions for your trip (e.g. vegetarian, honeymoon, avoid crowds)..."
                rows={2}
                className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none resize-none border border-[var(--border)] rounded-xl px-3 py-2.5 focus:border-brand-500/50"
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`
                  w-full py-3 rounded-xl font-semibold bg-brand-500 hover:bg-brand-600 text-white transition-colors
                  ${!canGenerate ? 'opacity-40 cursor-not-allowed' : ''}
                `}
              >
                Generate ✨
              </button>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline"
              >
                Collapse
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
