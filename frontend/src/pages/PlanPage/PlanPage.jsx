import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useTripStore from '../../stores/tripStore';
import PlanView from '../../components/plan/PlanView/PlanView';

export default function PlanPage() {
  const { id } = useParams();
  const loadMockTrip = useTripStore((s) => s.loadMockTrip);
  const trip = useTripStore((s) => s.trip);

  useEffect(() => {
    // TODO: Replace with real API call using `id`
    loadMockTrip();
  }, [id, loadMockTrip]);

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading your trip...</p>
        </div>
      </div>
    );
  }

  return <PlanView />;
}

