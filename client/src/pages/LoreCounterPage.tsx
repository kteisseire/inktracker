import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoreCounter } from '../components/LoreCounter.js';
import { RoundTimer } from '../components/RoundTimer.js';
import { Seo } from '../components/Seo.js';

export function LoreCounterPage() {
  const navigate = useNavigate();
  const [timer, setTimer] = useState<{ seconds: number; running: boolean }>({ seconds: 50 * 60, running: false });
  const [showRoundTimer, setShowRoundTimer] = useState(false);

  return (
    <>
      <Seo
        title="Compteur de lore"
        description="Comptez les points de lore en temps réel pendant vos parties Disney Lorcana, avec timer de ronde intégré."
        path="/lore-counter"
      />
      <LoreCounter
        onClose={() => navigate(-1)}
        timerState={timer}
        onTimerChange={setTimer}
      />

      {/* Standalone round timer — optional overlay, independent from the lore counter's built-in timer */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] w-[calc(100%-2rem)] max-w-sm">
        {showRoundTimer ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoundTimer(false)}
              className="absolute -top-2 -right-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-ink-800 border border-rule text-ink-400 hover:text-ink-100 transition-colors"
              aria-label="Masquer le timer de ronde"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <RoundTimer />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowRoundTimer(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 border-gold-500/25 bg-ink-900/90 text-gold-400 hover:bg-gold-500/10 hover:border-gold-500/40 active:scale-[0.98] shadow-card"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Timer de ronde
          </button>
        )}
      </div>
    </>
  );
}
