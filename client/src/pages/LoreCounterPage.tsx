import { useNavigate } from 'react-router-dom';
import { LoreCounter } from '../components/LoreCounter.js';

export function LoreCounterPage() {
  const navigate = useNavigate();

  return (
    <LoreCounter
      onClose={() => navigate(-1)}
    />
  );
}
