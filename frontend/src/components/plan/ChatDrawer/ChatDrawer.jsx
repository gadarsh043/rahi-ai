import { useState, useRef, useEffect, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useTripStore from '../../../stores/tripStore';
import { sendChatMessage } from '../../../services/api';
import { renderChatMarkdown } from '../../../utils/formatChat';
import { toast } from '../../common/Toast/Toast';

const ChatMessage = memo(function ChatMessage({ message }) {
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
        {message.role === 'user' ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <div className="text-sm leading-relaxed text-[var(--text-primary)]">
            {renderChatMarkdown(message.content)}
          </div>
        )}
      </div>
    </div>
  );
});

export default function ChatDrawer() {
  const chatOpen = useTripStore((s) => s.chatOpen);
  const closeChat = useTripStore((s) => s.closeChat);
  const chatMessages = useTripStore((s) => s.chatMessages);
  const addChatMessage = useTripStore((s) => s.addChatMessage);
  const isChatThinking = useTripStore((s) => s.isChatThinking);
  const setChatThinking = useTripStore((s) => s.setChatThinking);
  const trip = useTripStore((s) => s.trip);
  const removePlace = useTripStore((s) => s.removePlace);
  const addPlaceToItinerary = useTripStore((s) => s.addPlaceToItinerary);
  const selectFlight = useTripStore((s) => s.selectFlight);
  const streamingMessage = useTripStore((s) => s.streamingMessage);
  const updateStreamingMessage = useTripStore((s) => s.updateStreamingMessage);
  const finalizeStreamingMessage = useTripStore((s) => s.finalizeStreamingMessage);
  const addPendingChange = useTripStore((s) => s.addPendingChange);
  const isDemo = useTripStore((s) => s.isDemo);

  const [input, setInput] = useState('');
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatThinking, streamingMessage]);

  useEffect(() => {
    if (chatOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [chatOpen]);

  const handleSend = async () => {
    if (!input.trim() || !trip) return;
    if (isDemo) {
      toast.info('Demo mode: chat is disabled. Generate a real trip to chat.');
      return;
    }
    const text = input.trim();

    addChatMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    });
    setInput('');
    setChatThinking(true);
    updateStreamingMessage('');

    let fullMessage = '';
    try {
      await sendChatMessage(trip.id, text, (event, data) => {
        if (event === 'message_chunk') {
          fullMessage += data.text;
          updateStreamingMessage(fullMessage);
        }
        if (event === 'itinerary_update') {
          const changes = data.changes || [];
          changes.forEach((change) => {
            if (change.action === 'remove') {
              removePlace?.(change.place_id);
              addPendingChange?.(change);
            } else if (change.action === 'add') {
              addPlaceToItinerary?.(
                change.place_id,
                change.day_number,
                change.time_slot
              );
              addPendingChange?.(change);
            } else if (change.action === 'select_flight') {
              selectFlight?.(change.flight_id);
              addPendingChange?.(change);
            }
          });
        }
        if (event === 'done') {
          setChatThinking(false);
          if (fullMessage.trim()) {
            finalizeStreamingMessage(fullMessage);
          } else {
            updateStreamingMessage(null);
          }
        }
        if (event === 'error') {
          setChatThinking(false);
          updateStreamingMessage(null);
        }
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Chat error', err);
      setChatThinking(false);
      updateStreamingMessage(null);
    }
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
            className="fixed inset-0 bg-black/40 z-[var(--z-overlay-backdrop)] lg:hidden"
          />

          {/* Mobile bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[var(--z-drawer)] lg:hidden bg-[var(--bg)] rounded-t-2xl shadow-2xl border-t border-[var(--border)] flex flex-col h-[85dvh] max-h-[85dvh]"
          >
            {/* Drag handle */}
            <div className="w-9 h-1 bg-[var(--text-muted)] rounded-full mx-auto mt-3 opacity-40" />

            {/* Header */}
            <div className="px-4 py-2 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <h2 className="font-semibold text-sm text-[var(--text-primary)]">
                  Chat with Rahify
                </h2>
              </div>
              <button
                type="button"
                onClick={closeChat}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
              >
                <span className="text-[var(--text-muted)] text-lg">✕</span>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto momentum-scroll px-4 py-3 space-y-4" aria-live="polite">
              {isDemo && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                  Demo mode: chat is disabled. Generate a real trip to start chatting.
                </div>
              )}
              {chatMessages.map((msg) => (
                <ChatMessage key={msg.id ?? `${msg.role}-${Math.random()}`} message={msg} />
              ))}
              {streamingMessage && (
                <ChatMessage
                  message={{
                    id: 'assistant-streaming',
                    role: 'assistant',
                    content: streamingMessage,
                  }}
                />
              )}
              {isChatThinking && !streamingMessage && (
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
            <div className="sticky bottom-0 px-3 py-2 bg-[var(--bg)] border-t border-[var(--border)] flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
              <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 focus-within:border-brand-500/50 transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={
                    isDemo
                      ? 'Demo mode: chat disabled'
                      : "Remove Terry Black's, add vegan spots..."
                  }
                  disabled={isDemo}
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isDemo || !input.trim()}
                  className="w-11 h-11 rounded-xl bg-brand-500 text-white flex items-center justify-center disabled:opacity-30 transition-colors"
                >
                  ➤
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1.5 text-center">
                Rahify may adjust your itinerary as you chat (e.g. swap places, change flights).
              </p>
            </div>
          </motion.div>

          {/* Desktop side drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="hidden lg:flex fixed right-0 top-[var(--topbar-height)] bottom-0 z-[var(--z-drawer)] w-[400px] bg-[var(--bg)] border-l border-[var(--border)] flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <h2 className="font-semibold text-[var(--text-primary)]">
                  Chat with Rahify
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
            <div className="flex-1 overflow-y-auto momentum-scroll p-4 space-y-4" aria-live="polite">
              {isDemo && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                  Demo mode: chat is disabled. Generate a real trip to start chatting.
                </div>
              )}
              {chatMessages.map((msg) => (
                <ChatMessage key={msg.id ?? `${msg.role}-${Math.random()}`} message={msg} />
              ))}
              {streamingMessage && (
                <ChatMessage
                  message={{
                    id: 'assistant-streaming',
                    role: 'assistant',
                    content: streamingMessage,
                  }}
                />
              )}
              {isChatThinking && !streamingMessage && (
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
                  placeholder={
                    isDemo
                      ? 'Demo mode: chat disabled'
                      : "Remove Terry Black's, add vegan spots..."
                  }
                  disabled={isDemo}
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isDemo || !input.trim()}
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

