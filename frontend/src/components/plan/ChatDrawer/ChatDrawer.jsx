import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useTripStore from '../../../stores/tripStore';

const MOCK_ACTIONS = [
  {
    response:
      "Done! I've removed Terry Black's BBQ from your itinerary and replaced it with Cosmic Café for Day 1 lunch. Scroll up to the Eat section to see the change!",
    action: (store) => {
      store.removePlace?.('place-r1');
      store.addPlaceToItinerary?.('place-r5', 1, '12:30');
    },
  },
  {
    response:
      "I've selected the Qatar Airways flight for you — great choice, 2 checked bags included! Check the Flights section.",
    action: (store) => {
      store.selectFlight?.('flight-3');
    },
  },
  {
    response:
      'Added Reunion Tower to Day 3 evening! Perfect for sunset views after the Perot Museum.',
    action: (store) => {
      store.addPlaceToItinerary?.('place-a5', 3, '17:30');
    },
  },
  {
    response:
      "Added Pepe's & Mito's to your itinerary for Day 2 breakfast — they have amazing breakfast tacos!",
    action: (store) => {
      store.addPlaceToItinerary?.('place-r4', 2, '08:30');
    },
  },
];

let mockIdx = 0;

function ChatMessage({ message }) {
  return (
    <div
      className={`flex gap-2.5 ${
        message.role === 'user' ? 'flex-row-reverse' : ''
      }`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium
        ${
          message.role === 'user'
            ? 'bg-brand-500 text-white'
            : 'bg-[var(--surface-hover)] text-[var(--text-secondary)]'
        }`}
      >
        {message.role === 'user' ? '👤' : '✨'}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
        ${
          message.role === 'user'
            ? 'bg-brand-500 text-white rounded-br-sm'
            : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-sm'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

export default function ChatDrawer() {
  const chatOpen = useTripStore((s) => s.chatOpen);
  const closeChat = useTripStore((s) => s.closeChat);
  const chatMessages = useTripStore((s) => s.chatMessages);
  const addChatMessage = useTripStore((s) => s.addChatMessage);
  const isChatThinking = useTripStore((s) => s.isChatThinking);
  const setChatThinking = useTripStore((s) => s.setChatThinking);

  const [input, setInput] = useState('');
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatThinking]);

  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [chatOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    addChatMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    });
    setInput('');
    setChatThinking(true);

    setTimeout(() => {
      const action = MOCK_ACTIONS[mockIdx % MOCK_ACTIONS.length];
      mockIdx += 1;
      setChatThinking(false);
      addChatMessage({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: action.response,
      });
      action.action(useTripStore.getState());
    }, 1800);
  };

  return (
    <AnimatePresence>
      {chatOpen && (
        <>
          {/* Backdrop (mobile) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeChat}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[400px] bg-[var(--bg)] border-l border-[var(--border)] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <h2 className="font-semibold text-[var(--text-primary)]">
                  Chat with Rahi
                </h2>
              </div>
              <button
                type="button"
                onClick={closeChat}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
              >
                <svg
                  className="w-5 h-5 text-[var(--text-secondary)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg) => (
                <ChatMessage key={msg.id ?? `${msg.role}-${Math.random()}`} message={msg} />
              ))}
              {isChatThinking && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-xs">
                    ✨
                  </div>
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[var(--border)] flex-shrink-0">
              <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 focus-within:border-brand-500/50 transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Remove Terry Black's, add vegan spots..."
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="text-brand-500 hover:text-brand-600 disabled:opacity-30 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1.5 text-center">
                AI will modify your itinerary based on your request
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

