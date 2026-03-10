import { apiGet, apiPost, apiSSE } from './apiClient';

// Re-export low-level helpers so feature pages (like Roadmap) can call
// lightweight endpoints without importing apiClient directly.
export { apiGet, apiPost } from './apiClient';

export async function generateTrip(params, onEvent) {
  await apiSSE('/generate', params, onEvent, { context: 'generate' });
}

export async function sendChatMessage(tripId, message, onEvent) {
  await apiSSE(
    '/chat',
    { trip_id: tripId, message },
    onEvent,
    { context: 'chat' },
  );
}

export async function fetchPlans() {
  return apiGet('/plans', { context: 'plans' });
}

export async function fetchPlan(tripId, shareCode = null) {
  const path = shareCode
    ? `/plans/${tripId}?shared=${encodeURIComponent(shareCode)}`
    : `/plans/${tripId}`;
  return apiGet(path, { context: 'plan' });
}

export async function sharePlan(tripId) {
  return apiPost(`/plans/${tripId}/share`, {}, { context: 'share' });
}

export async function savePlan(tripId) {
  return apiPost(`/plans/${tripId}/save`, {}, { context: 'save' });
}

export async function getNearby(lat, lng, categories) {
  return apiPost(
    '/nearby',
    { lat, lng, categories },
    { context: 'nearby', silent: false },
  );
}

export async function fetchProfile() {
  return apiGet('/user/profile', { context: 'profile', silent: true });
}

export async function updateProfile(payload) {
  return apiPost('/user/profile', payload, { context: 'profile' });
}

export async function fetchDestinationFacts(city) {
  return apiPost('/destination-facts', { city }, { context: 'facts', silent: true });
}

