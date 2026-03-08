/**
 * Tour Registry — all onboarding steps for every page.
 *
 * Each page has features, each feature has ordered steps.
 * `priority` controls display order in full tours.
 * `position` = where text appears relative to element: 'below' | 'above'
 *   (auto-detected if omitted — element in top half -> text below, else above)
 */

const TOUR_REGISTRY = {
  home: {
    label: 'Home Page',
    features: {
      'home-hero': {
        label: 'Getting Started',
        priority: 100,
        steps: [
          {
            element: null,
            text: 'Plan your next trip in under a minute. Pick a place, set your vibe, and we do the rest.',
          },
        ],
      },
      'home-features': {
        label: 'Features',
        priority: 200,
        steps: [
          {
            element: '[data-tour="how-it-works"]',
            text: 'Real places, real flights, real ratings. No made-up recommendations.',
            position: 'below',
          },
        ],
      },
    },
  },

  form: {
    label: 'Trip Form',
    features: {
      'form-progress': {
        label: 'Step Progress',
        priority: 100,
        steps: [
          {
            element: '[data-tour="form-progress"]',
            text: '10 quick questions. Each one shapes your perfect trip.',
            position: 'below',
          },
        ],
      },
      'form-group': {
        label: "Who's Coming",
        priority: 200,
        steps: [
          {
            element: '[data-tour="form-card"]',
            text: 'Solo, couple, friends, family — this changes everything about your trip.',
            position: 'below',
            formStep: 3,
          },
        ],
      },
      'form-budget': {
        label: 'Budget Vibes',
        priority: 300,
        steps: [
          {
            element: '[data-tour="form-card"]',
            text: 'Not a dollar amount — just how fancy you want to go.',
            position: 'above',
            formStep: 5,
          },
        ],
      },
      'form-prompt': {
        label: 'Trip Preview',
        priority: 400,
        steps: [
          {
            element: '[data-tour="form-prompt"]',
            text: 'Everything you pick shows up here. You can edit it before sending.',
            position: 'above',
          },
        ],
      },
    },
  },

  plan: {
    label: 'Plan View',
    features: {
      'plan-tabs': {
        label: 'Tab Bar',
        priority: 100,
        steps: [
          {
            element: '[data-tour="tab-bar"]',
            text: 'Your whole trip, organized. Restaurants, hotels, places, flights — swipe through.',
            position: 'below',
          },
        ],
      },
      'plan-places': {
        label: 'Place Cards',
        priority: 200,
        steps: [
          {
            clickBefore: '[data-tour="tab-bar"] button:nth-child(1)',
            element: '[data-tour="place-card"]',
            elementIndex: 2,
            text: 'Real places with real ratings. Tap for details, directions, or booking.',
            position: 'below',
          },
        ],
      },
      'plan-flight': {
        label: 'Flights',
        priority: 300,
        steps: [
          {
            clickBefore: '[data-tour="tab-bar"] button:nth-child(5)',
            element: '[data-tour="flight-section"]',
            text: 'Compare flights, pick your dates, and book right from here.',
            position: 'below',
          },
        ],
      },
      'plan-chat': {
        label: 'Chat',
        priority: 400,
        steps: [
          {
            element: '[data-tour="chat-input"]',
            text: 'Want changes? Just ask. Swap a restaurant, add a day trip, extend your stay.',
            position: 'above',
          },
          {
            clickBefore: '[data-tour="chat-input"]',
            element: '[data-tour="chat-drawer"]',
            text: 'This is your trip chat. Ask anything and the AI tweaks your plan in real-time.',
            cleanupClick: '[data-tour="chat-close"]',
          },
        ],
      },
      'plan-pick': {
        label: "Let's Pick",
        priority: 500,
        steps: [
          {
            element: '[data-tour="lets-pick"]',
            text: 'Handpick which places stay and which ones go. Your trip, your call.',
            position: 'above',
          },
        ],
      },
      'plan-share': {
        label: 'Share',
        priority: 600,
        steps: [
          {
            element: '[data-tour="share-button"]',
            text: 'Send it to friends. They can suggest edits or fork their own version.',
            position: 'below',
          },
        ],
      },
    },
  },
};

/** Final step — only shown at end of full flow */
export const FINAL_STEP = {
  clickBefore: '[data-tour="profile-menu"] > button',
  element: '[data-tour="replay-tour"]',
  text: 'Come back here anytime to replay this walkthrough.',
  position: 'below',
};

/** Page order for full walkthrough flow */
export const FULL_FLOW_PAGES = ['home', 'form', 'plan'];
export const PAGE_ROUTES = { home: '/', form: '/new', plan: '/plan/demo' };

/**
 * Get all steps for a page sorted by priority.
 * Optionally filter to only unseen features.
 */
export function getPageSteps(page, unseenOnly = null) {
  const pageConfig = TOUR_REGISTRY[page];
  if (!pageConfig) return [];

  const features = Object.entries(pageConfig.features)
    .sort(([, a], [, b]) => a.priority - b.priority);

  const steps = [];
  for (const [featureId, feature] of features) {
    if (unseenOnly && unseenOnly.has(featureId)) continue;
    for (const step of feature.steps) {
      steps.push({ ...step, featureId });
    }
  }
  return steps;
}

/**
 * Get features for the tour menu on a specific page.
 */
export function getPageFeatures(page) {
  const pageConfig = TOUR_REGISTRY[page];
  if (!pageConfig) return [];

  return Object.entries(pageConfig.features)
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([id, f]) => ({ id, label: f.label, priority: f.priority }));
}

export default TOUR_REGISTRY;
