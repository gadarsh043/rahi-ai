import { useNavigate } from 'react-router-dom';
import LandingSection from '../components/home/LandingSection';
import WelcomeTour from '../components/onboarding/WelcomeTour';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0">
      <WelcomeTour />
      <LandingSection onStart={() => navigate('/new')} />
    </div>
  );
}
