import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useTripStore from '../../stores/tripStore';
import PlanView from '../../components/plan/PlanView/PlanView';
import { generateTrip, fetchPlan } from '../../services/api';

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
  const trip = useTripStore((s) => s.trip);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading your trip...');

  const loadExistingTrip = useCallback(
    async (tripId) => {
      try {
        setLoading(true);
        setLoadingMessage('Loading your trip...');
        const data = await fetchPlan(tripId);
        const normalized = normalizeTrip(
          data.trip,
          data.places,
          data.chat_messages || data.chatMessages || []
        );
        if (normalized) {
          setTrip(normalized);
        }
        setLoading(false);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load trip', err);
        setLoadingMessage('Failed to load trip');
        setLoading(false);
      }
    },
    [setTrip]
  );

  const startGeneration = useCallback(
    async (params) => {
      setLoading(true);
      setLoadingMessage('Finding the best places for your trip...');
      try {
        await generateTrip(params, (event, data) => {
          if (event === 'status' && data?.message) {
            setLoadingMessage(data.message);
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

    if (generateParams) {
      startGeneration(generateParams);
      return;
    }

    if (id === 'mock') {
      loadMockTrip();
      setLoading(false);
      return;
    }

    if (id) {
      loadExistingTrip(id);
    }
  }, [id, location.state, loadExistingTrip, loadMockTrip, startGeneration]);

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

  return <PlanView />;
}

