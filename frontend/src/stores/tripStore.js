import { create } from 'zustand';
import { MOCK_TRIP } from '../utils/mockTripData';

const useTripStore = create((set, get) => ({
  // Trip data
  trip: null,
  activeSectionId: 'eat',
  mode: 'editing', // 'editing' | 'shared' | 'saved'

  // Map state
  mapCenter: null,
  selectedMarkerId: null,
  showMap: false, // mobile map toggle

  // Chat state
  chatOpen: false,
  chatMessages: [],
  isChatThinking: false,

  // Let's Pick state
  letsPickOpen: false,

  // Actions
  setTrip: (trip) =>
    set({
      trip,
      mapCenter: { lat: trip.destinationLat, lng: trip.destinationLng },
      chatMessages: trip.chatMessages || [],
    }),
  setActiveSectionId: (id) => set({ activeSectionId: id }),
  setMode: (mode) => set({ mode }),
  setSelectedMarker: (id) => set({ selectedMarkerId: id }),
  toggleMap: () => set((s) => ({ showMap: !s.showMap })),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  toggleLetsPick: () => set((s) => ({ letsPickOpen: !s.letsPickOpen })),
  setChatOpen: (open) => set({ chatOpen: open }),
  openChat: () => set({ chatOpen: true }),
  closeChat: () => set({ chatOpen: false }),
  setChatThinking: (value) => set({ isChatThinking: value }),

  addChatMessage: (msg) =>
    set((s) => ({
      chatMessages: [...s.chatMessages, msg],
    })),

  // Load mock data
  loadMockTrip: () => {
    set({
      trip: MOCK_TRIP,
      mapCenter: { lat: MOCK_TRIP.destinationLat, lng: MOCK_TRIP.destinationLng },
      chatMessages: MOCK_TRIP.chatMessages,
      mode: 'editing',
      activeSectionId: 'eat',
    });
  },

  // Place helpers
  getPlacesByCategory: (category) => {
    const { trip } = get();
    if (!trip) return [];
    return trip.places.filter((p) => p.category === category);
  },
  getItineraryPlaces: () => {
    const { trip } = get();
    if (!trip) return [];
    return trip.places.filter((p) => p.isInItinerary);
  },
}));

export default useTripStore;

