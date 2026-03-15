import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createRound, updateRound } from '../api/matches.api.js';
import { getTournament } from '../api/tournaments.api.js';
import { InkColorPicker } from '../components/ui/InkColorPicker.js';
import { LoreCounter } from '../components/LoreCounter.js';
import type { LoreResult, LoreState } from '../components/LoreCounter.js';
import type { InkColor, MatchResult, Format, Round } from '@lorcana/shared';

interface GameInput {
  gameNumber: number;
  result: MatchResult | null;
  loserScore: string;
  wentFirstOverride: boolean | null;
}

function maxGames(format: Format): number {
  if (format === 'BO5') return 5;
  if (format === 'BO3') return 3;
  return 1;
}

function winsNeeded(format: Format): number {
  if (format === 'BO5') return 3;
  if (format === 'BO3') return 2;
  return 1;
}

function roundToGameInputs(round: Round, format: Format): GameInput[] {
  const max = maxGames(format);
  const games = round.games || [];
  return Array.from({ length: max }, (_, i) => {
    const existing = games.find(g => g.gameNumber === i + 1);
    if (existing) {
      const loserScore = existing.result === 'WIN' ? existing.opponentScore : existing.myScore;
      return {
        gameNumber: i + 1,
        result: existing.result as MatchResult,
        loserScore: String(loserScore),
        wentFirstOverride: existing.wentFirst,
      };
    }
    return { gameNumber: i + 1, result: null, loserScore: '', wentFirstOverride: null };
  });
}

export function NewMatchPage() {
  const { tournamentId, roundId } = useParams<{ tournamentId: string; roundId?: string }>();
  const isEdit = !!roundId;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [format, setFormat] = useState<Format>('BO1');

  const [roundNumber, setRoundNumber] = useState('1');
  const [isTopCut, setIsTopCut] = useState(false);
  const [opponentName, setOpponentName] = useState('');
  const [opponentDeckColors, setOpponentDeckColors] = useState<InkColor[]>([]);
  const [notes, setNotes] = useState('');
  const [tossWinner, setTossWinner] = useState<boolean | null>(null);
  const [games, setGames] = useState<GameInput[]>([]);
  const [loreCounterGameIndex, setLoreCounterGameIndex] = useState<number | null>(null);
  const [loreStates, setLoreStates] = useState<Record<number, LoreState>>({});

  useEffect(() => {
    getTournament(tournamentId!).then(t => {
      const fmt = t.format as Format;
      setFormat(fmt);

      if (isEdit) {
        const round = (t.rounds || []).find(r => r.id === roundId);
        if (round) {
          setRoundNumber(String(round.roundNumber));
          setIsTopCut(round.isTopCut);
          setOpponentName(round.opponentName || '');
          setOpponentDeckColors(round.opponentDeckColors as InkColor[]);
          setNotes(round.notes || '');
          setGames(roundToGameInputs(round, fmt));
          // Try to detect toss from first game
          const firstGame = (round.games || []).find(g => g.gameNumber === 1);
          if (firstGame?.wentFirst !== null && firstGame?.wentFirst !== undefined) {
            setTossWinner(firstGame.wentFirst);
          }
        }
      } else {
        const max = maxGames(fmt);
        setGames(Array.from({ length: max }, (_, i) => ({ gameNumber: i + 1, result: null, loserScore: '', wentFirstOverride: null })));
        const existingRounds = t.rounds || [];
        const maxRound = existingRounds.reduce((m, r) => Math.max(m, r.roundNumber), 0);
        setRoundNumber(String(maxRound + 1));
      }
      setInitialLoading(false);
    });
  }, [tournamentId, roundId, isEdit]);

  function getAutoWentFirst(gameIndex: number): boolean | null {
    if (tossWinner === null) return null;
    if (gameIndex === 0) return tossWinner;
    const prevResult = games[gameIndex - 1]?.result;
    if (!prevResult) return null;
    return prevResult === 'LOSS';
  }

  function getWentFirst(gameIndex: number): boolean | null {
    const override = games[gameIndex]?.wentFirstOverride;
    if (override !== null && override !== undefined) return override;
    return getAutoWentFirst(gameIndex);
  }

  function isRoundDecided(upToIndex: number): boolean {
    const needed = winsNeeded(format);
    let myWins = 0;
    let oppWins = 0;
    for (let i = 0; i < upToIndex; i++) {
      if (games[i]?.result === 'WIN') myWins++;
      if (games[i]?.result === 'LOSS') oppWins++;
    }
    return myWins >= needed || oppWins >= needed;
  }

  function computeRoundResult(): MatchResult {
    const wins = games.filter(g => g.result === 'WIN').length;
    const losses = games.filter(g => g.result === 'LOSS').length;
    if (wins > losses) return 'WIN';
    if (losses > wins) return 'LOSS';
    return 'DRAW';
  }

  const setGameResult = (index: number, result: MatchResult) => {
    setGames(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], result };
      const needed = winsNeeded(format);
      let myWins = 0;
      let oppWins = 0;
      for (let i = 0; i <= index; i++) {
        if (updated[i].result === 'WIN') myWins++;
        if (updated[i].result === 'LOSS') oppWins++;
      }
      if (myWins >= needed || oppWins >= needed) {
        for (let i = index + 1; i < updated.length; i++) {
          updated[i] = { ...updated[i], result: null, loserScore: '', wentFirstOverride: null };
        }
      }
      return updated;
    });
  };

  const setLoserScore = (index: number, score: string) => {
    setGames(prev => prev.map((g, i) => i === index ? { ...g, loserScore: score } : g));
  };

  const handleLoreResult = (result: LoreResult) => {
    if (loreCounterGameIndex === null) return;
    const index = loreCounterGameIndex;
    setLoreCounterGameIndex(null);

    // Persist lore state for this game
    setLoreStates(prev => ({ ...prev, [index]: result.state }));

    if (result.winner) {
      const matchResult: MatchResult = result.winner === 'me' ? 'WIN' : 'LOSS';
      const loserScore = result.winner === 'me' ? result.opponentScore : result.myScore;
      setGameResult(index, matchResult);
      setLoserScore(index, String(loserScore));
    }
  };

  const buildPayload = () => {
    const playedGames = games.filter(g => g.result !== null);
    return {
      roundNumber: parseInt(roundNumber),
      isTopCut,
      opponentName: opponentName || undefined,
      opponentDeckColors: opponentDeckColors.length > 0 ? opponentDeckColors : undefined,
      result: playedGames.length > 0 ? computeRoundResult() : 'DRAW' as MatchResult,
      notes: notes || undefined,
      games: playedGames.length > 0 ? playedGames.map((g) => {
        const actualIndex = games.indexOf(g);
        const wentFirst = getWentFirst(actualIndex);
        const loserScore = parseInt(g.loserScore) || 0;
        return {
          gameNumber: g.gameNumber,
          result: g.result!,
          wentFirst: wentFirst ?? undefined,
          myScore: g.result === 'WIN' ? 20 : loserScore,
          opponentScore: g.result === 'LOSS' ? 20 : loserScore,
          notes: undefined,
        };
      }) : undefined,
    };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEdit) {
        await updateRound(tournamentId!, roundId!, buildPayload());
      } else {
        await createRound(tournamentId!, buildPayload());
      }
      navigate(`/tournaments/${tournamentId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || (isEdit ? 'Erreur lors de la modification' : 'Erreur lors de l\'ajout'));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400"></div></div>;
  }

  const max = maxGames(format);
  const isBo = max > 1;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/tournaments/${tournamentId}`} className="text-sm text-ink-500 hover:text-gold-400 transition-colors">
        &larr; Retour au tournoi
      </Link>
      <h1 className="font-display text-xl sm:text-2xl font-bold text-ink-100 tracking-wide mt-2 mb-6">
        {isEdit ? 'Modifier la ronde' : 'Ajouter une ronde'}
      </h1>

      <form onSubmit={handleSubmit} className="ink-card p-4 sm:p-6 space-y-5">
        {error && <div className="ink-error">{error}</div>}

        {/* Round info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="ink-label">N° de ronde *</label>
            <input type="number" required min="1" value={roundNumber}
              onChange={e => setRoundNumber(e.target.value)} className="ink-input" />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isTopCut} onChange={e => setIsTopCut(e.target.checked)}
                className="w-4 h-4 rounded bg-ink-800 border-ink-700 text-gold-500 focus:ring-gold-500/40" />
              <span className="text-sm text-ink-300">Top Cut</span>
            </label>
          </div>
        </div>

        <div>
          <label className="ink-label">Adversaire</label>
          <input type="text" value={opponentName} onChange={e => setOpponentName(e.target.value)}
            placeholder="Nom" className="ink-input" />
        </div>

        <div>
          <label className="ink-label mb-2">Deck adverse</label>
          <InkColorPicker selected={opponentDeckColors} onChange={setOpponentDeckColors} />
        </div>

        {/* Toss */}
        <div>
          <label className="ink-label mb-2">Toss — Qui commence ?</label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setTossWinner(true)}
              className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all border-2 ${
                tossWinner === true
                  ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                  : 'border-ink-700/50 text-ink-400 hover:border-ink-600/50'
              }`}>
              Moi
            </button>
            <button type="button" onClick={() => setTossWinner(false)}
              className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all border-2 ${
                tossWinner === false
                  ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                  : 'border-ink-700/50 text-ink-400 hover:border-ink-600/50'
              }`}>
              Adversaire
            </button>
          </div>
        </div>

        {/* Games */}
        <div>
          <label className="ink-label mb-3">Matchs ({format})</label>
          <div className="space-y-3">
            {games.map((game, index) => {
              const decided = isRoundDecided(index);
              const wentFirst = getWentFirst(index);
              const prevDone = index === 0 || games[index - 1]?.result !== null;
              if (decided || (!prevDone && index > 0)) return null;

              return (
                <div key={index} className="border border-ink-700/50 rounded-xl p-3 sm:p-4 space-y-3 bg-ink-900/50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink-400">Match {game.gameNumber}</span>
                      <button
                        type="button"
                        onClick={() => setLoreCounterGameIndex(index)}
                        className="text-xs text-gold-400/70 hover:text-gold-400 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg border border-gold-500/15 hover:border-gold-500/30 bg-gold-500/5"
                      >
                        <span>✦</span> Lore
                      </button>
                    </div>
                    <div className="flex items-center gap-1 text-right">
                      {wentFirst !== null && (
                        <button type="button"
                          onClick={() => {
                            setGames(prev => prev.map((g, i) => i === index
                              ? { ...g, wentFirstOverride: !wentFirst } : g));
                          }}
                          className="text-xs text-ink-500 hover:text-gold-400 transition-colors"
                          title="Cliquer pour inverser">
                          {wentFirst ? '1er' : '2nd'} <span className="text-[10px]">✎</span>
                        </button>
                      )}
                      {game.wentFirstOverride !== null && (
                        <button type="button"
                          onClick={() => {
                            setGames(prev => prev.map((g, i) => i === index
                              ? { ...g, wentFirstOverride: null } : g));
                          }}
                          className="text-[10px] text-ink-600 hover:text-ink-400 ml-1 transition-colors"
                          title="Auto">
                          ↺
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setGameResult(index, 'WIN')}
                      className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                        game.result === 'WIN'
                          ? 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-ink-700/50 text-ink-500 hover:border-green-500/30'
                      }`}>
                      Victoire
                    </button>
                    <button type="button" onClick={() => setGameResult(index, 'LOSS')}
                      className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                        game.result === 'LOSS'
                          ? 'border-red-500 bg-red-500/10 text-red-400'
                          : 'border-ink-700/50 text-ink-500 hover:border-red-500/30'
                      }`}>
                      Défaite
                    </button>
                  </div>

                  {game.result && (
                    <div>
                      <label className="block text-xs text-ink-500 mb-1">
                        Score du perdant (lore)
                      </label>
                      <input type="number" min="0" max="19" value={game.loserScore}
                        onChange={e => setLoserScore(index, e.target.value)}
                        placeholder="0" className="ink-input text-sm" />
                    </div>
                  )}
                </div>
              );
            })}

            {isBo && games.some(g => g.result !== null) && isRoundDecided(games.length) && (
              <div className={`rounded-xl p-3 sm:p-4 text-center font-bold border ${
                computeRoundResult() === 'WIN'
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {(() => {
                  const wins = games.filter(g => g.result === 'WIN').length;
                  const losses = games.filter(g => g.result === 'LOSS').length;
                  return `Ronde ${computeRoundResult() === 'WIN' ? 'gagnée' : 'perdue'} ${wins}–${losses}`;
                })()}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="ink-label">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Notes sur la ronde..." className="ink-input resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 ink-btn-primary">
            {loading ? (isEdit ? 'Modification...' : 'Ajout...') : 'Enregistrer'}
          </button>
          <button type="button" onClick={() => navigate(`/tournaments/${tournamentId}`)}
            className="ink-btn-secondary">
            Annuler
          </button>
        </div>
      </form>

      {loreCounterGameIndex !== null && (
        <LoreCounter
          onClose={handleLoreResult}
          initialState={loreStates[loreCounterGameIndex]}
        />
      )}
    </div>
  );
}
