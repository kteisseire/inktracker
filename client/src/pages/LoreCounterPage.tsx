import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoreCounter } from '../components/LoreCounter.js';
import { Seo } from '../components/Seo.js';

export function LoreCounterPage() {
  const navigate = useNavigate();
  const [timer, setTimer] = useState<{ seconds: number; running: boolean }>({ seconds: 50 * 60, running: false });

  return (
    <>
      <Seo
        title="Compteur de lore"
        description="Comptez les points de lore en temps réel pendant vos parties Disney Lorcana, avec timer de ronde intégré."
        path="/lore-counter"
      />
      {/* Le compteur a son propre timer de ronde intégré (au centre) — pas d'overlay séparé. */}
      <LoreCounter
        onClose={() => navigate(-1)}
        timerState={timer}
        onTimerChange={setTimer}
      />
    </>
  );
}
