import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function PromptBox({ promptText = '', promptBase = '', instructions = '', isComplete, formData, onGenerate }) {
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
    if (canGenerate && typeof onGenerate === 'function') {
      const instructionsTrimmed = (expanded ? editInstructions : instructions)?.trim() || '';
      const promptToUse = promptBase.trim()
        ? (promptBase.trim() + (instructionsTrimmed ? ' ' + instructionsTrimmed : '')).trim()
        : instructionsTrimmed || promptText;
      onGenerate(formData, promptToUse);
    }
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 z-10 pt-4">
      <div className="glass-strong dark:glass-strong-dark rounded-2xl p-3 shadow-lg">
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
                <span className="text-base shrink-0" aria-hidden>✨</span>
                <span className="text-xs text-[var(--text-muted)] line-clamp-2 flex-1 text-left break-words">
                  {promptText || 'Your trip summary will appear here...'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`
                  bg-gradient-to-r from-brand-400 to-brand-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                  hover:from-brand-500 hover:to-brand-700 transition-all
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
                <div
                  className="w-full text-sm text-[var(--text-secondary)] select-none rounded-xl bg-[var(--surface)] dark:bg-[var(--surface)] border border-[var(--border)] px-3 py-2.5"
                  aria-readonly
                >
                  {promptBase.trim()}
                </div>
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
                  w-full py-3 rounded-xl font-semibold
                  bg-gradient-to-r from-brand-400 to-brand-600 text-white
                  hover:from-brand-500 hover:to-brand-700 transition-all
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
