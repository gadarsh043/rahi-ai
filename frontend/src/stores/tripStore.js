import { create } from 'zustand';
import { MOCK_TRIP } from '../utils/mockTripData';

const useTripStore = create((set, get) => ({
  // Trip data
  trip: null,
  activeSectionId: 'eat',
  mode: 'editing', // 'editing' | 'shared' | 'saved'
  isDemo: false,

  // Map state
  mapCenter: null,
  mapZoom: null,
  selectedMarkerId: null,
  showMap: false, // mobile map toggle

  // Chat state
  chatOpen: false,
  chatMessages: [],
  isChatThinking: false,

  // Streaming message (shown while bot is typing)
  streamingMessage: null,

  // Pending changes (for rebuild banner)
  pendingChanges: [],

  // Map message (shown when geocode fails — temporary info card)
  mapMessage: null,

  // Global rebuilding state (e.g. Let's Pick)
  isRebuilding: false,
  rebuildStatus: '',

  // Let's Pick state
  letsPickOpen: false,

  // Actions
  setTrip: (trip) =>
    set((s) => {
      const existingMessages =
        s.chatMessages && s.chatMessages.length > 0
          ? s.chatMessages
          : trip.chatMessages || trip.chat_messages || [];

      const destLat = trip.destinationLat ?? trip.destination_lat;
      const destLng = trip.destinationLng ?? trip.destination_lng;

      return {
        trip,
        mapCenter:
          destLat != null && destLng != null
            ? { lat: destLat, lng: destLng }
            : s.mapCenter,
        chatMessages: existingMessages,
      };
    }),
  setIsDemo: (value) => set({ isDemo: Boolean(value) }),
  setActiveSectionId: (id) => set({ activeSectionId: id, mapZoom: null, selectedMarkerId: null }),
  setMode: (mode) => set({ mode }),
  setSelectedMarker: (id) => set({ selectedMarkerId: id }),
  focusPlace: (place) =>
    set({
      selectedMarkerId: place.id,
      mapCenter: { lat: place.lat, lng: place.lng },
      mapZoom: 16,
      showMap: true,
      mapMessage: null,
    }),
  setMapMessage: (msg) => set({
    mapMessage: msg,
    selectedMarkerId: null,
    showMap: true,
    ...(msg?.lat != null && msg?.lng != null ? { mapCenter: { lat: msg.lat, lng: msg.lng }, mapZoom: 16 } : {}),
  }),
  clearMapMessage: () => {
    const { mapMessage } = get();
    if (mapMessage?._intervalId) clearInterval(mapMessage._intervalId);
    set({ mapMessage: null });
  },
  toggleMap: () => set((s) => ({ showMap: !s.showMap })),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  toggleLetsPick: () => set((s) => ({ letsPickOpen: !s.letsPickOpen })),
  setChatOpen: (open) => set({ chatOpen: open }),
  openChat: () => set({ chatOpen: true }),
  closeChat: () => set({ chatOpen: false }),
  setChatThinking: (value) => set({ isChatThinking: value }),

  addChatMessage: (msg) =>
    set((s) => {
      // Avoid duplicating assistant messages while streaming is active
      if (s.streamingMessage && msg?.role === 'assistant') return s;
      return {
        chatMessages: [...s.chatMessages, msg],
      };
    }),

  updateStreamingMessage: (text) => set({ streamingMessage: text }),
  finalizeStreamingMessage: (text) =>
    set((s) => ({
      streamingMessage: null,
      chatMessages: [
        ...s.chatMessages,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: text,
        },
      ],
    })),

  addPendingChange: (change) =>
    set((s) => ({
      pendingChanges: [...s.pendingChanges, change],
    })),
  clearPendingChanges: () => set({ pendingChanges: [] }),

  setRebuilding: (value, status) =>
    set((s) => ({
      isRebuilding: value,
      rebuildStatus: typeof status === 'string' ? status : s.rebuildStatus,
    })),
  setRebuildStatus: (status) => set({ rebuildStatus: status }),

  // Load mock data
  loadMockTrip: () => {
    set({
      trip: MOCK_TRIP,
      mapCenter: { lat: MOCK_TRIP.destinationLat, lng: MOCK_TRIP.destinationLng },
      chatMessages: MOCK_TRIP.chatMessages,
      mode: 'editing',
      activeSectionId: 'eat',
      isDemo: false,
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

  // Mutations used by chat / Let's Pick flows
  removePlace: (placeId) =>
    set((s) => {
      if (!s.trip || !Array.isArray(s.trip.places)) return s;
      const places = s.trip.places.map((p) => {
        const matches =
          p.id === placeId ||
          p.googlePlaceId === placeId ||
          p.google_place_id === placeId;
        if (!matches) return p;
        return {
          ...p,
          isInItinerary: false,
          dayNumber: null,
          timeSlot: null,
        };
      });
      return { trip: { ...s.trip, places } };
    }),

  addPlaceToItinerary: (placeId, dayNumber, timeSlot) =>
    set((s) => {
      if (!s.trip || !Array.isArray(s.trip.places)) return s;
      const places = s.trip.places.map((p) => {
        const matches =
          p.id === placeId ||
          p.googlePlaceId === placeId ||
          p.google_place_id === placeId;
        if (!matches) return p;
        return {
          ...p,
          isInItinerary: true,
          dayNumber: dayNumber ?? p.dayNumber ?? null,
          timeSlot: timeSlot ?? p.timeSlot ?? null,
        };
      });
      return { trip: { ...s.trip, places } };
    }),

  selectFlight: (flightId) =>
    set((s) => {
      if (!s.trip || !Array.isArray(s.trip.flights)) return s;
      const flights = s.trip.flights.map((f) => ({
        ...f,
        isSelected: f.id === flightId,
      }));
      return { trip: { ...s.trip, flights } };
    }),

  setCurrency: (code) =>
    set((s) => {
      if (!s.trip) return s;
      return { trip: { ...s.trip, currency: code } };
    }),
}));

export default useTripStore;

