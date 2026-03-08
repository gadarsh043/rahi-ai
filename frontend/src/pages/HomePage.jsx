import { useNavigate } from 'react-router-dom';
import LandingSection from '../components/home/LandingSection';
import useTourCheck from '../hooks/useTourCheck';

export default function HomePage() {
  const navigate = useNavigate();

  useTourCheck('home', true, 1500);

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0">
      <LandingSection onStart={() => navigate('/new')} />
    </div>
  );
}
