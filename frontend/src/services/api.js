const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/v1';

function getAuthHeaders() {
  const token = localStorage.getItem('supabase_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseSSE(response, onEvent) {
  const reader = response.body?.getReader();
  if (!reader) return;

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
    // Each event is "event: X" then "data: {...}"
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith('data: ') && currentEvent) {
        try {
          const data = JSON.parse(line.slice(6));
          onEvent(currentEvent, data);
        } catch {
          // swallow JSON parse errors for partial lines
        }
        currentEvent = '';
      }
    }
  }
}

export async function generateTrip(params, onEvent) {
  const response = await fetch(`${API_URL}/generate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  await parseSSE(response, onEvent);
}

export async function sendChatMessage(tripId, message, onEvent) {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ trip_id: tripId, message }),
  });

  await parseSSE(response, onEvent);
}

export async function fetchPlans() {
  const resp = await fetch(`${API_URL}/plans`, {
    headers: getAuthHeaders(),
  });
  return resp.json();
}

export async function fetchPlan(tripId, shareCode = null) {
  const url = shareCode
    ? `${API_URL}/plans/${tripId}?shared=${encodeURIComponent(shareCode)}`
    : `${API_URL}/plans/${tripId}`;

  const resp = await fetch(url, {
    headers: getAuthHeaders(),
  });
  return resp.json();
}

export async function sharePlan(tripId) {
  const resp = await fetch(`${API_URL}/plans/${tripId}/share`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return resp.json();
}

export async function savePlan(tripId) {
  const resp = await fetch(`${API_URL}/plans/${tripId}/save`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return resp.json();
}

export async function getNearby(lat, lng, categories) {
  const resp = await fetch(`${API_URL}/nearby`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ lat, lng, categories }),
  });
  return resp.json();
}

export async function fetchProfile() {
  const resp = await fetch(`${API_URL}/user/profile`, {
    headers: getAuthHeaders(),
  });
  return resp.json();
}

export async function updateProfile(payload) {
  const resp = await fetch(`${API_URL}/user/profile`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return resp.json();
}

