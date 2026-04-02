import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createRound, updateRound } from '../api/matches.api.js';
import { getTournament } from '../api/tournaments.api.js';
import { extractEventId } from '../api/ravensburger.api.js';
import { getEventScoutReports, upsertScoutReport } from '../api/scouting.api.js';
import { listMyTeams } from '../api/team.api.js';
import { InkColorPicker } from '../components/ui/InkColorPicker.js';
import { DeckBadges } from '../components/ui/InkBadge.js';
import { LoreCounter } from '../components/LoreCounter.js';
import type { LoreResult, LoreState } from '../components/LoreCounter.js';
import type { InkColor, MatchResult, Format, Round, ScoutReport, Team } from '@lorcana/shared';

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
  const [tournamentFormat, setTournamentFormat] = useState<Format>('BO1');
  const [format, setFormat] = useState<Format>('BO1');
  const [tournamentSwissRounds, setTournamentSwissRounds] = useState(0);

  const [roundNumber, setRoundNumber] = useState('1');
  const [isTopCut, setIsTopCut] = useState(false);
  const [opponentName, setOpponentName] = useState('');
  const [opponentDeckColors, setOpponentDeckColors] = useState<InkColor[]>([]);
  const [notes, setNotes] = useState('');
  const [tossWinner, setTossWinner] = useState<boolean | null>(null);
  const [games, setGames] = useState<GameInput[]>([]);
  const [loreCounterGameIndex, setLoreCounterGameIndex] = useState<number | null>(null);
  const [loreStates, setLoreStates] = useState<Record<number, LoreState>>({});
  const [boTimer, setBoTimer] = useState<{ seconds: number; running: boolean }>({ seconds: 50 * 60, running: false });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Scouting
  const [eventId, setEventId] = useState<string | null>(null);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [scoutReports, setScoutReports] = useState<ScoutReport[]>([]);
  const [scoutMatch, setScoutMatch] = useState<ScoutReport | null>(null);

  useEffect(() => {
    listMyTeams().then(setMyTeams).catch(() => {});
  }, []);

  // Load scout reports when eventId is known
  useEffect(() => {
    if (!eventId || myTeams.length === 0) return;
    getEventScoutReports(eventId).then(({ reports }) => setScoutReports(reports)).catch(() => {});
  }, [eventId, myTeams]);

  // Match opponent name to scout report
  useEffect(() => {
    if (!opponentName.trim() || scoutReports.length === 0) { setScoutMatch(null); return; }
    const match = scoutReports.find(r => r.playerName.toLowerCase() === opponentName.trim().toLowerCase());
    setScoutMatch(match || null);
  }, [opponentName, scoutReports]);

  useEffect(() => {
    getTournament(tournamentId!).then(t => {
      const fmt = t.format as Format;
      setTournamentFormat(fmt);
      setFormat(fmt);
      setTournamentSwissRounds(t.swissRounds || 0);

      // Extract eventId for scouting
      if (t.eventLink) {
        const eid = extractEventId(t.eventLink);
        if (eid) setEventId(eid);
      }

      if (isEdit) {
        const round = (t.rounds || []).find(r => r.id === roundId);
        if (round) {
          setRoundNumber(String(round.roundNumber));
          setIsTopCut(round.isTopCut);
          setOpponentName(round.opponentName || '');
          setOpponentDeckColors(round.opponentDeckColors as InkColor[]);
          setNotes(round.notes || '');
          // Detect format override from game count
          const gameCount = (round.games || []).length;
          const editFmt = gameCount > 3 ? 'BO5' : gameCount > 1 ? 'BO3' : fmt;
          setFormat(editFmt);
          setGames(roundToGameInputs(round, editFmt));
          const firstGame = (round.games || []).find(g => g.gameNumber === 1);
          if (firstGame?.wentFirst !== null && firstGame?.wentFirst !== undefined) {
            setTossWinner(firstGame.wentFirst);
          }
        }
      } else {
        const existingRounds = t.rounds || [];
        const maxRound = existingRounds.reduce((m, r) => Math.max(m, r.roundNumber), 0);
        const nextRound = maxRound + 1;
        setRoundNumber(String(nextRound));

        // Auto-detect top cut: if next round exceeds swiss rounds
        const swissPlayed = existingRounds.filter(r => !r.isTopCut).length;
        if (t.swissRounds > 0 && swissPlayed >= t.swissRounds) {
          setIsTopCut(true);
        }

        const max = maxGames(fmt);
        setGames(Array.from({ length: max }, (_, i) => ({ gameNumber: i + 1, result: null, loserScore: '', wentFirstOverride: null })));
      }
      setInitialLoading(false);
    });
  }, [tournamentId, roundId, isEdit]);

  const handleFormatChange = (newFormat: Format) => {
    setFormat(newFormat);
    const newMax = maxGames(newFormat);
    setGames(prev => {
      // Keep existing results, expand or shrink
      return Array.from({ length: newMax }, (_, i) => {
        if (i < prev.length) return prev[i];
        return { gameNumber: i + 1, result: null, loserScore: '', wentFirstOverride: null };
      });
    });
  };

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

  const applyLoreResult = (index: number, result: LoreResult) => {
    setLoreStates(prev => ({ ...prev, [index]: result.state }));
    if (result.winner) {
      const matchResult: MatchResult = result.winner === 'me' ? 'WIN' : 'LOSS';
      const loserScore = result.winner === 'me' ? result.opponentScore : result.myScore;
      setGameResult(index, matchResult);
      setLoserScore(index, String(loserScore));
    }
  };

  const handleLoreResult = (result: LoreResult) => {
    if (loreCounterGameIndex === null) return;
    const index = loreCounterGameIndex;
    setLoreCounterGameIndex(null);
    applyLoreResult(index, result);
  };

  const handleNextGame = (result: LoreResult) => {
    if (loreCounterGameIndex === null) return;
    const index = loreCounterGameIndex;
    const currentResult: MatchResult | undefined = result.winner ? (result.winner === 'me' ? 'WIN' : 'LOSS') : undefined;
    applyLoreResult(index, result);
    if (nextGameAvailable(currentResult)) {
      setLoreCounterGameIndex(index + 1);
    } else {
      setLoreCounterGameIndex(null);
    }
  };

  // Calcule si une partie suivante est possible en incluant le résultat de la partie courante
  function nextGameAvailable(currentResult?: MatchResult): boolean {
    if (loreCounterGameIndex === null) return false;
    const nextIndex = loreCounterGameIndex + 1;
    if (nextIndex >= maxGames(format)) return false;
    const needed = winsNeeded(format);
    let myWins = 0;
    let oppWins = 0;
    for (let i = 0; i <= loreCounterGameIndex; i++) {
      const r = i === loreCounterGameIndex ? currentResult : games[i]?.result;
      if (r === 'WIN') myWins++;
      if (r === 'LOSS') oppWins++;
    }
    return myWins < needed && oppWins < needed;
  }

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

      // Auto-report scout data if we have eventId, teams, opponent name and colors
      if (eventId && myTeams.length > 0 && opponentName.trim() && opponentDeckColors.length > 0) {
        for (const team of myTeams) {
          upsertScoutReport({
            teamId: team.id,
            eventId,
            playerName: opponentName.trim(),
            deckColors: opponentDeckColors,
          }).catch(() => {}); // Fire & forget
        }
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
  const fmtLabel = (f: Format) => f === 'BO1' ? 'Bo1' : f === 'BO3' ? 'Bo3' : 'Bo5';

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-ink-100 tracking-wide mb-6">
        {isEdit ? 'Modifier la ronde' : 'Ajouter une ronde'}
      </h1>

      <form onSubmit={handleSubmit} className="ink-card p-4 sm:p-6 space-y-5">
        {error && <div className="ink-error">{error}</div>}

        {/* Round info — lecture seule */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-ink-900/50 border border-ink-800/50">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-ink-400">Ronde <span className="text-ink-100 font-semibold">{roundNumber}</span></span>
            <span className="text-ink-700">·</span>
            <span className="text-ink-400">{isTopCut ? 'Top Cut' : 'Suisse'}</span>
            <span className="text-ink-700">·</span>
            <span className="text-ink-400">{fmtLabel(format)}</span>
          </div>
          <button type="button" onClick={() => setShowAdvanced(v => !v)}
            className="text-xs text-ink-500 hover:text-gold-400 transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-1.414a2 2 0 01.586-1.414z" />
            </svg>
            Modifier
          </button>
        </div>

        {/* Champs avancés */}
        {showAdvanced && (
          <div className="space-y-4 rounded-xl border border-ink-700/40 p-3 bg-ink-900/30">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="ink-label">N° de ronde</label>
                <input type="number" required min="1" value={roundNumber}
                  onChange={e => setRoundNumber(e.target.value)} className="ink-input" />
              </div>
              <div>
                <label className="ink-label mb-2">Type</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsTopCut(false)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                      !isTopCut ? 'border-gold-500 bg-gold-500/10 text-gold-400' : 'border-ink-700/50 text-ink-400 hover:border-ink-600/50'
                    }`}>Suisse</button>
                  <button type="button" onClick={() => setIsTopCut(true)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                      isTopCut ? 'border-gold-500 bg-gold-500/10 text-gold-400' : 'border-ink-700/50 text-ink-400 hover:border-ink-600/50'
                    }`}>Top Cut</button>
                </div>
              </div>
            </div>
            <div>
              <label className="ink-label mb-2">Format</label>
              <div className="flex gap-2">
                {(['BO1', 'BO3', 'BO5'] as Format[]).map(fmt => (
                  <button key={fmt} type="button" onClick={() => handleFormatChange(fmt)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                      format === fmt ? 'border-gold-500 bg-gold-500/10 text-gold-400' : 'border-ink-700/50 text-ink-400 hover:border-ink-600/50'
                    }`}>{fmtLabel(fmt)}</button>
                ))}
              </div>
              {format !== tournamentFormat && (
                <p className="text-xs text-ink-500 mt-1">Format du tournoi : {fmtLabel(tournamentFormat)}</p>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="ink-label">Adversaire</label>
          <input type="text" value={opponentName} onChange={e => setOpponentName(e.target.value)}
            placeholder="Nom" className="ink-input" />
        </div>

        <div>
          <label className="ink-label mb-2">Deck adverse</label>
          {scoutMatch && opponentDeckColors.length === 0 && (
            <button
              type="button"
              onClick={() => setOpponentDeckColors(scoutMatch.deckColors as InkColor[])}
              className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-lorcana-sapphire/10 border border-lorcana-sapphire/20 text-sm text-ink-200 hover:bg-lorcana-sapphire/15 transition-colors w-full"
            >
              <svg className="w-4 h-4 text-lorcana-sapphire shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="flex-1 text-left">
                Scout : <DeckBadges colors={scoutMatch.deckColors as InkColor[]} />
              </span>
              <span className="text-xs text-ink-500 shrink-0">par {scoutMatch.reportedBy.username}</span>
            </button>
          )}
          {scoutMatch && opponentDeckColors.length > 0 && (
            <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink-900/50 text-xs text-ink-500">
              <svg className="w-3.5 h-3.5 text-lorcana-sapphire shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Scout par {scoutMatch.reportedBy.username} — {new Date(scoutMatch.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
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

                  {/* Lore counter button */}
                  <button
                    type="button"
                    onClick={() => setLoreCounterGameIndex(index)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 border-gold-500/25 bg-gold-500/5 text-gold-400 hover:bg-gold-500/10 hover:border-gold-500/40 active:scale-[0.98]"
                  >
                    <span className="text-base">✦</span> Compteur de Lore
                  </button>

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

      {loreCounterGameIndex !== null && (() => {
        const myWins = games.slice(0, loreCounterGameIndex).filter(g => g.result === 'WIN').length;
        const oppWins = games.slice(0, loreCounterGameIndex).filter(g => g.result === 'LOSS').length;
        const total = maxGames(format);
        return (
          <LoreCounter
            key={loreCounterGameIndex}
            onClose={handleLoreResult}
            onNextGame={handleNextGame}
            initialState={loreStates[loreCounterGameIndex]}
            timerState={boTimer}
            onTimerChange={setBoTimer}
            matchInfo={total > 1 ? { gameNumber: loreCounterGameIndex + 1, totalGames: total, myWins, oppWins } : undefined}
          />
        );
      })()}
    </div>
  );
}
