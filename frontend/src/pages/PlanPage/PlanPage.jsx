import { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useTripStore from '../../stores/tripStore';
import PlanView from '../../components/plan/PlanView/PlanView';
import { generateTrip, fetchPlan } from '../../services/api';
import PlanTour from '../../components/onboarding/PlanTour';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { ONBOARDING_DEMO_TRIP, ONBOARDING_DEMO_PLACES } from '../../utils/mockTripData';

function normalizeTrip(apiTrip, places = [], chatMessages = []) {
  if (!apiTrip) return null;

  const normalizedPlaces = (places || []).map((p) => ({
    id: p.id,
    googlePlaceId: p.google_place_id,
    name: p.name,
    category: p.category,
    lat: p.lat,
    lng: p.lng,
    rating: p.rating,
    priceLevel: p.price_level,
    address: p.address,
    photoUrl: p.photo_url,
    googleMapsUrl: p.google_maps_url,
    isInItinerary: p.is_in_itinerary,
    dayNumber: p.day_number,
    timeSlot: p.time_slot,
    isCustom: p.is_custom ?? false,
    visit_duration_minutes: p.visit_duration_minutes ?? null,
  }));

  const itinerary = apiTrip.itinerary && apiTrip.itinerary.itinerary
    ? apiTrip.itinerary.itinerary
    : apiTrip.itinerary || [];

  return {
    id: apiTrip.id,
    userId: apiTrip.user_id,
    originCity: apiTrip.origin_city,
    originCountry: apiTrip.origin_country,
    originLat: apiTrip.origin_lat,
    originLng: apiTrip.origin_lng,
    destinationCity: apiTrip.destination_city,
    destinationCountry: apiTrip.destination_country,
    destinationLat: apiTrip.destination_lat,
    destinationLng: apiTrip.destination_lng,
    startDate: apiTrip.start_date,
    endDate: apiTrip.end_date,
    numDays: apiTrip.num_days,
    pace: apiTrip.pace,
    budgetVibe: apiTrip.budget_vibe,
    accommodationType: apiTrip.accommodation_type,
    preferences: apiTrip.travel_preferences || [],
    instructions: apiTrip.instructions || '',
    numTravelers: apiTrip.num_travelers || 1,
    passportCountry: apiTrip.passport_country || '',
    currency: apiTrip.currency || 'USD',
    status: apiTrip.status,
    shareCode: apiTrip.share_code,
    createdAt: apiTrip.created_at,
    itinerary,
    narrative: apiTrip.itinerary?.narrative || '',
    costEstimate: apiTrip.cost_estimate || null,
    visaInfo: apiTrip.visa_info || null,
    travelEssentials: apiTrip.travel_essentials || null,
    places: normalizedPlaces,
    chatMessages,
  };
}

export default function PlanPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const loadMockTrip = useTripStore((s) => s.loadMockTrip);
  const setTrip = useTripStore((s) => s.setTrip);
  const setMode = useTripStore((s) => s.setMode);
  const setIsDemo = useTripStore((s) => s.setIsDemo);
  const trip = useTripStore((s) => s.trip);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading your trip...');
  const [genError, setGenError] = useState(false);
  const [lastGenerateParams, setLastGenerateParams] = useState(null);

  const planTourDone = useOnboardingStore((s) => s.planTourDone);

  const loadExistingTrip = useCallback(
    async (tripId, shareCode) => {
      try {
        setLoading(true);
        setLoadingMessage('Loading your trip...');
        setIsDemo(false);
        const data = await fetchPlan(tripId, shareCode);
        if (data?.error) {
          setLoading(false);
          return;
        }
        const normalized = normalizeTrip(
          data.trip,
          data.places,
          data.chat_messages || data.chatMessages || []
        );
        if (normalized) {
          setTrip(normalized);
          if (shareCode) {
            setMode('shared');
          } else if (normalized.status === 'saved') {
            setMode('saved');
          } else {
            setMode('editing');
          }
        }
        setLoading(false);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load trip', err);
        setLoadingMessage('Failed to load trip');
        setLoading(false);
      }
    },
    [fetchPlan, setMode, setTrip, setIsDemo]
  );

  const startGeneration = useCallback(
    async (params) => {
      setLoading(true);
      setLoadingMessage('Finding the best places for your trip...');
       setGenError(false);
       setLastGenerateParams(params);
      setIsDemo(false);
      try {
        await generateTrip(params, (event, data) => {
          if (event === 'status' && data?.message) {
            setLoadingMessage(data.message);
          }
          if (event === 'error') {
            setGenError(true);
            setLoading(false);
          }
          if (event === 'done' && data?.trip_id) {
            // After generation completes, load the full trip from API and update URL
            loadExistingTrip(data.trip_id);
            navigate(`/plan/${data.trip_id}`, { replace: true });
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error during trip generation', err);
        setLoadingMessage('Something went wrong while generating your trip.');
        setLoading(false);
      }
    },
    [loadExistingTrip, navigate]
  );

  useEffect(() => {
    const generateParams = location.state?.generateParams;
    const searchParams = new URLSearchParams(location.search);
    const shared = searchParams.get('shared') || null;

    if (location.pathname === '/plan/demo') {
      const normalizedPlaces = (ONBOARDING_DEMO_PLACES || []).map((p) => ({
        id: p.google_place_id || p.googlePlaceId || p.id,
        googlePlaceId: p.google_place_id || p.googlePlaceId || p.id,
        name: p.name,
        category:
          p.category === 'tourist_attraction' || p.category === 'lodging'
            ? p.category === 'lodging'
              ? 'hotel'
              : 'attraction'
            : p.category,
        lat: p.lat,
        lng: p.lng,
        rating: p.rating,
        address: p.address,
        photoUrl: null,
        googleMapsUrl: null,
        isInItinerary: Boolean(p.is_in_itinerary),
      }));

      const demoTrip = normalizeTrip(
        {
          ...ONBOARDING_DEMO_TRIP,
          user_id: 'demo',
          share_code: null,
          created_at: new Date().toISOString(),
          transport_mode: 'flight',
          itinerary: { ...ONBOARDING_DEMO_TRIP.itinerary, narrative: ONBOARDING_DEMO_TRIP.narrative },
          cost_estimate: ONBOARDING_DEMO_TRIP.cost_estimate,
          visa_info: null,
          travel_essentials: null,
        },
        normalizedPlaces,
        []
      );

      setIsDemo(true);
      setMode('editing');
      setTrip(demoTrip);
      setLoading(false);
      return;
    }

    if (generateParams) {
      startGeneration(generateParams);
      return;
    }

    if (id === 'mock') {
      loadMockTrip();
      setIsDemo(false);
      setLoading(false);
      return;
    }

    if (id) {
      loadExistingTrip(id, shared);
    }
  }, [
    id,
    location.pathname,
    location.search,
    location.state,
    loadExistingTrip,
    loadMockTrip,
    setIsDemo,
    setMode,
    setTrip,
    startGeneration,
  ]);

  const shouldShowPlanTour = useMemo(() => {
    if (!trip) return false;
    if (location.pathname === '/plan/demo') return true;
    if (planTourDone) return false;
    if (!Array.isArray(trip.places) || trip.places.length === 0) return false;
    return true;
  }, [trip, planTourDone, location.pathname]);

  if (genError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🌧️</div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Trip planning hit a snag
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            This happens sometimes. Your selections are saved — just retry.
          </p>
          <button
            type="button"
            onClick={() => {
              if (lastGenerateParams) {
                setGenError(false);
                startGeneration(lastGenerateParams);
              }
            }}
            className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  if (!trip || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {shouldShowPlanTour && (
        <PlanTour isDemo={location.pathname === '/plan/demo'} />
      )}
      <PlanView />
    </>
  );
}

