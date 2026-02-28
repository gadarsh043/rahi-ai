import { useParams } from 'react-router-dom';

export default function PlanPage() {
  const { id } = useParams();
  return (
    <div className="flex flex-1 min-h-0 p-4">
      <p className="text-[var(--text-secondary)]">Plan placeholder — id: {id}</p>
    </div>
  );
}
