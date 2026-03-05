import { toast } from '../components/common/Toast/Toast';
import useUIStore from '../stores/uiStore';

// Fallback for local dev; VITE_API_URL must be set in production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/v1';

function getAuthHeaders() {
  const token = localStorage.getItem('supabase_token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const FRIENDLY_ERRORS = {
  401: "You've been logged out. Please sign in again.",
  403: "You don't have access to this. Please sign in.",
  404: "We couldn't find what you're looking for.",
  429: "You're doing that too fast. Wait a moment and try again.",
  500: 'Something went wrong on our end. Please try again.',
  502: 'Our servers are taking a break. Try again in a moment.',
  503: "We're temporarily unavailable. Please try again shortly.",
  network: "Couldn't connect. Check your internet and try again.",
  timeout: 'That took too long. Please try again.',
  default: 'Something went wrong. Please try again.',
};

function getFriendlyMessage(status, context) {
  if (context === 'generate' && status >= 500) {
    return 'We hit a snag planning your trip. Tap retry to try again.';
  }
  if (context === 'chat') {
    return "Couldn't process that message. Try again?";
  }
  if (context === 'save') {
    return "Couldn't save your trip. Please try again.";
  }
  if (context === 'share') {
    return "Couldn't create share link. Please try again.";
  }
  if (context === 'rebuild') {
    return "Couldn't rebuild your itinerary. Please try again.";
  }
  return FRIENDLY_ERRORS[status] || FRIENDLY_ERRORS.default;
}

export async function apiGet(path, { context = '', silent = false } = {}) {
  try {
    const resp = await fetch(`${API_URL}${path}`, {
      headers: getAuthHeaders(),
    });

    if (!resp.ok) {
      const msg = getFriendlyMessage(resp.status, context);
      // eslint-disable-next-line no-console
      console.error(`API Error [${context}]: ${resp.status} ${resp.statusText} — ${path}`);
      if (!silent) toast.error(msg);
      return { error: true, status: resp.status, message: msg };
    }

    return await resp.json();
  } catch (err) {
    const msg =
      err?.name === 'TypeError' ? FRIENDLY_ERRORS.network : FRIENDLY_ERRORS.default;
    // eslint-disable-next-line no-console
    console.error(`API Error [${context}]:`, err);
    if (!silent) toast.error(msg);
    return { error: true, status: 0, message: msg };
  }
}

export async function apiPost(path, body, { context = '', silent = false } = {}) {
  try {
    const resp = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const msg = getFriendlyMessage(resp.status, context);
      // eslint-disable-next-line no-console
      console.error(`API Error [${context}]: ${resp.status} — ${path}`);
      if (!silent) toast.error(msg);
      return { error: true, status: resp.status, message: msg };
    }

    return await resp.json();
  } catch (err) {
    const msg =
      err?.name === 'TypeError' ? FRIENDLY_ERRORS.network : FRIENDLY_ERRORS.default;
    // eslint-disable-next-line no-console
    console.error(`API Error [${context}]:`, err);
    if (!silent) toast.error(msg);
    return { error: true, status: 0, message: msg };
  }
}

export async function apiSSE(path, body, onEvent, { context = '' } = {}) {
  try {
    const resp = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (resp.status === 402) {
      // Credits exhausted — show email CTA instead of paywall.
      let detail;
      try {
        const data = await resp.json();
        detail = data?.detail || data;
      } catch {
        detail = {};
      }
      const message =
        (detail && (detail.message || detail.detail)) ||
        "You've used all your free trips! Email us to request more credits.";
      // Show a gentle toast and open the credits exhausted overlay.
      toast.error(message);
      try {
        useUIStore.getState().setShowCreditsExhausted(true);
      } catch {
        // ignore if store not ready
      }
      onEvent?.('error', { type: detail?.type || 'credits_exhausted', message });
      return;
    }

    if (!resp.ok) {
      const msg = getFriendlyMessage(resp.status, context);
      // eslint-disable-next-line no-console
      console.error(`SSE Error [${context}]: ${resp.status} — ${path}`);
      toast.error(msg);
      onEvent?.('error', { message: msg });
      return;
    }

    const reader = resp.body?.getReader();
    if (!reader) {
      const msg = FRIENDLY_ERRORS.default;
      toast.error(msg);
      onEvent?.('error', { message: msg });
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ') && currentEvent) {
          try {
            const data = JSON.parse(line.slice(6));
            if (currentEvent === 'error') {
              const msg = getFriendlyMessage('default', context);
              toast.error(msg);
              // eslint-disable-next-line no-console
              console.error(`SSE stream error [${context}]:`, data);
            }
            onEvent?.(currentEvent, data);
          } catch {
            // swallow malformed chunks
          }
          currentEvent = '';
        }
      }
    }
  } catch (err) {
    const msg =
      err?.name === 'TypeError' ? FRIENDLY_ERRORS.network : FRIENDLY_ERRORS.default;
    // eslint-disable-next-line no-console
    console.error(`SSE Error [${context}]:`, err);
    toast.error(msg);
    onEvent?.('error', { message: msg });
  }
}

