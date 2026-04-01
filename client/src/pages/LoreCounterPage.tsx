import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoreCounter } from '../components/LoreCounter.js';

export function LoreCounterPage() {
  const navigate = useNavigate();
  const [timer, setTimer] = useState<{ seconds: number; running: boolean }>({ seconds: 50 * 60, running: false });

  return (
    <LoreCounter
      onClose={() => navigate(-1)}
      timerState={timer}
      onTimerChange={setTimer}
    />
  );
}
