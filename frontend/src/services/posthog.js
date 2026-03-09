import posthog from 'posthog-js';

let initialized = false;

/**
 * Initialize PostHog. Safe to call multiple times.
 * Skips if VITE_POSTHOG_KEY is missing or in local dev (Vite DEV).
 */
export function initPosthog() {
  if (initialized) return;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST;
  if (!key || import.meta.env.DEV) return;
  posthog.init(key, {
    api_host: host || 'https://us.i.posthog.com',
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: { password: true },
    },
  });
  initialized = true;
}

/**
 * @returns {typeof posthog | null} The posthog instance or null if not initialized.
 */
export function getPosthog() {
  return initialized ? posthog : null;
}

/**
 * Track a custom event.
 * @param {string} name - Event name
 * @param {Record<string, unknown>} [props] - Optional event properties
 */
export function trackEvent(name, props = {}) {
  if (initialized) {
    posthog.capture(name, props);
  }
}

/**
 * Identify the current user for analytics. Call after login with user + profile data.
 * @param {{ id?: string; email?: string; display_name?: string; trips_remaining?: number; passport_country?: string }} user - User traits (id, email, display_name, trips_remaining, passport_country)
 */
export function identifyUser(user) {
  if (!initialized || !user?.id) return;
  posthog.identify(user.id);
  posthog.people.set({
    email: user.email,
    display_name: user.display_name,
    trips_remaining: user.trips_remaining,
    passport_country: user.passport_country,
  });
}

/**
 * Reset PostHog identity. Call on logout.
 */
export function resetUser() {
  if (initialized) {
    posthog.reset();
  }
}
