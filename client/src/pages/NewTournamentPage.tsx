import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createTournament, updateTournament, getTournament } from '../api/tournaments.api.js';
import { listDecks, extractDeckColors } from '../api/deck.api.js';
import { fetchEventInfo, extractEventId } from '../api/ravensburger.api.js';
import { InkColorPicker } from '../components/ui/InkColorPicker.js';
import { DeckBadges } from '../components/ui/InkBadge.js';
import { getRecommendedSwissRounds, getRecommendedTopCut } from '@lorcana/shared';
import type { InkColor, Deck } from '@lorcana/shared';

const SUPPORTED_SITES = ['dreamborn.ink', 'lorcanito.com', 'db.lorcanito.com', 'duels.ink', 'inkdecks.com'];

function isDeckUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname;
    return SUPPORTED_SITES.some(d => hostname === d || hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

function isEventUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.hostname === 'tcg.ravensburgerplay.com' && url.pathname.startsWith('/events/');
  } catch {
    return false;
  }
}

export function NewTournamentPage() {
  const { id: editId } = useParams<{ id: string }>();
  const isEdit = !!editId;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  // Saved decks
  const [savedDecks, setSavedDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [playerCount, setPlayerCount] = useState('');
  const [swissRounds, setSwissRounds] = useState('4');
  const [topCut, setTopCut] = useState<string>('NONE');
  const [format, setFormat] = useState<string>('BO3');
  const [myDeckColors, setMyDeckColors] = useState<InkColor[]>([]);
  const [myDeckLink, setMyDeckLink] = useState('');
  const [deckLinkLoading, setDeckLinkLoading] = useState(false);
  const [deckLinkStatus, setDeckLinkStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [deckLinkError, setDeckLinkError] = useState('');
  const [eventLink, setEventLink] = useState('');
  const [eventFetching, setEventFetching] = useState(false);
  const [eventFetchStatus, setEventFetchStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [placement, setPlacement] = useState('');
  const [notes, setNotes] = useState('');

  const fetchIdRef = useRef(0);

  // Load saved decks + existing tournament data if editing
  useEffect(() => {
    const init = async () => {
      const decks = await listDecks();
      setSavedDecks(decks);

      if (isEdit) {
        const t = await getTournament(editId);
        setName(t.name);
        setLocation(t.location || '');
        setDate(t.date.split('T')[0]);
        setPlayerCount(t.playerCount ? String(t.playerCount) : '');
        setSwissRounds(String(t.swissRounds));
        setTopCut(t.topCut);
        setFormat(t.format);
        setMyDeckColors(t.myDeckColors as InkColor[]);
        setMyDeckLink(t.myDeckLink || '');
        setEventLink(t.eventLink || '');
        setPlacement(t.placement ? String(t.placement) : '');
        setNotes(t.notes || '');
        if (t.deckId) {
          setSelectedDeckId(t.deckId);
        }
      } else {
        const defaultDeck = decks.find(d => d.isDefault);
        if (defaultDeck) {
          setSelectedDeckId(defaultDeck.id);
          setMyDeckColors(defaultDeck.colors as InkColor[]);
          setMyDeckLink(defaultDeck.link ?? '');
        }
      }
      setInitialLoading(false);
    };
    init();
  }, [editId, isEdit]);

  const handleDeckSelect = (deckId: string) => {
    setSelectedDeckId(deckId);
    if (deckId) {
      const deck = savedDecks.find(d => d.id === deckId);
      if (deck) {
        setMyDeckColors(deck.colors as InkColor[]);
        setMyDeckLink(deck.link ?? '');
        setDeckLinkStatus('idle');
        setDeckLinkError('');
      }
    } else {
      setMyDeckColors([]);
      setMyDeckLink('');
    }
  };

  const handlePlayerCountChange = (value: string) => {
    setPlayerCount(value);
    const count = parseInt(value);
    if (count && count >= 2) {
      setSwissRounds(String(getRecommendedSwissRounds(count)));
      setTopCut(getRecommendedTopCut(count));
    }
  };

  const eventFetchRef = useRef(0);

  const fetchEventData = useCallback(async (url: string) => {
    const eventId = extractEventId(url);
    if (!eventId) return;

    const fetchId = ++eventFetchRef.current;
    setEventFetching(true);
    setEventFetchStatus('idle');
    try {
      const info = await fetchEventInfo(eventId);
      if (fetchId !== eventFetchRef.current) return;

      if (info.name && !name) setName(info.name);
      if (info.location && !location) setLocation(info.location);
      if (info.date) {
        const d = info.date.split('T')[0];
        if (!date || date === new Date().toISOString().split('T')[0]) setDate(d);
      }
      if (info.playerCount) {
        setPlayerCount(String(info.playerCount));
        setSwissRounds(String(getRecommendedSwissRounds(info.playerCount)));
        setTopCut(getRecommendedTopCut(info.playerCount));
      }
      if (info.swissRounds) {
        setSwissRounds(String(info.swissRounds));
      }
      if (info.format && format === 'BO3') {
        setFormat(info.format);
      }
      setEventFetchStatus('success');
    } catch {
      if (fetchId === eventFetchRef.current) setEventFetchStatus('error');
    } finally {
      if (fetchId === eventFetchRef.current) setEventFetching(false);
    }
  }, [name, location, date, format]);

  /** Re-fetch only player count and rounds (for refreshing during tournament) */
  const refreshEventData = useCallback(async () => {
    const eventId = extractEventId(eventLink);
    if (!eventId) return;

    setEventFetching(true);
    try {
      const info = await fetchEventInfo(eventId);
      if (info.playerCount) {
        setPlayerCount(String(info.playerCount));
        setSwissRounds(String(getRecommendedSwissRounds(info.playerCount)));
        setTopCut(getRecommendedTopCut(info.playerCount));
      }
      if (info.swissRounds) {
        setSwissRounds(String(info.swissRounds));
      }
      setEventFetchStatus('success');
    } catch {
      setEventFetchStatus('error');
    } finally {
      setEventFetching(false);
    }
  }, [eventLink]);

  const handleEventLinkChange = (value: string) => {
    setEventLink(value);
    setEventFetchStatus('idle');
    if (value && extractEventId(value)) {
      fetchEventData(value);
    }
  };

  const fetchColors = useCallback(async (url: string) => {
    const fetchId = ++fetchIdRef.current;
    setDeckLinkLoading(true);
    setDeckLinkStatus('idle');
    setDeckLinkError('');
    try {
      const colors = await extractDeckColors(url);
      if (fetchId !== fetchIdRef.current) return;
      setMyDeckColors(colors);
      setDeckLinkStatus('success');
    } catch (err: any) {
      if (fetchId !== fetchIdRef.current) return;
      setDeckLinkError(err.response?.data?.error || 'Erreur de détection');
      setDeckLinkStatus('error');
    } finally {
      if (fetchId === fetchIdRef.current) setDeckLinkLoading(false);
    }
  }, []);

  const handleDeckLinkChange = (value: string) => {
    setMyDeckLink(value);
    setDeckLinkStatus('idle');
    setDeckLinkError('');
    if (value && isDeckUrl(value)) {
      setSelectedDeckId('');
      fetchColors(value);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (myDeckColors.length === 0) {
      setError('Sélectionnez au moins une couleur de deck');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const payload = {
        name,
        location: location || undefined,
        date,
        playerCount: playerCount ? parseInt(playerCount) : undefined,
        swissRounds: parseInt(swissRounds),
        topCut: topCut as any,
        format: format as any,
        myDeckColors,
        myDeckLink: myDeckLink && isDeckUrl(myDeckLink) ? myDeckLink : undefined,
        deckId: selectedDeckId || undefined,
        eventLink: eventLink && isEventUrl(eventLink) ? eventLink : undefined,
        placement: placement ? parseInt(placement) : undefined,
        notes: notes || undefined,
      };

      if (isEdit) {
        await updateTournament(editId, payload);
        navigate(`/tournaments/${editId}`);
      } else {
        const tournament = await createTournament(payload);
        navigate(`/tournaments/${tournament.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || (isEdit ? 'Erreur lors de la modification' : 'Erreur lors de la création'));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400"></div></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {isEdit && (
        <Link to={`/tournaments/${editId}`} className="text-sm text-ink-500 hover:text-gold-400 transition-colors">&larr; Retour au tournoi</Link>
      )}
      <h1 className="font-display text-2xl font-bold text-ink-100 tracking-wide mb-6 mt-1">
        {isEdit ? 'Modifier le tournoi' : 'Nouveau tournoi'}
      </h1>

      <form onSubmit={handleSubmit} className="ink-card p-4 sm:p-6 space-y-5">
        {error && (
          <div className="ink-error">{error}</div>
        )}

        <div>
          <label className="ink-label">Nom du tournoi *</label>
          <input
            type="text" required value={name} onChange={e => setName(e.target.value)}
            placeholder="Ex: Challenge Lorcana Paris"
            className="ink-input"
          />
        </div>

        <div>
          <label className="ink-label">Lien du tournoi</label>
          <div className="relative">
            <input
              type="url" value={eventLink}
              onChange={e => handleEventLinkChange(e.target.value)}
              onPaste={e => {
                const pasted = e.clipboardData.getData('text');
                if (pasted && extractEventId(pasted)) {
                  e.preventDefault();
                  setEventLink(pasted);
                  fetchEventData(pasted);
                }
              }}
              placeholder="https://tcg.ravensburgerplay.com/events/..."
              className="ink-input text-sm pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {eventFetching && <span className="text-gold-400 text-sm animate-spin">&#9696;</span>}
              {eventFetchStatus === 'success' && <span className="text-green-400 text-lg">&#10003;</span>}
              {eventFetchStatus === 'error' && <span className="text-red-400 text-lg">&#10007;</span>}
              {extractEventId(eventLink) && !eventFetching && (
                <button
                  type="button"
                  onClick={refreshEventData}
                  className="text-xs text-ink-400 hover:text-gold-400 transition-colors p-1"
                  title="Rafraîchir les infos"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-ink-500 mt-1">
            Colle le lien Ravensburger Play Hub pour remplir automatiquement les infos
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="ink-label">Date *</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)}
              className="ink-input" />
          </div>
          <div>
            <label className="ink-label">Lieu</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Paris"
              className="ink-input" />
          </div>
        </div>

        <div>
          <label className="ink-label">Nombre de joueurs</label>
          <input type="number" min="2" value={playerCount} onChange={e => handlePlayerCountChange(e.target.value)}
            className="ink-input" />
          {playerCount && parseInt(playerCount) >= 2 && (
            <p className="text-xs text-ink-500 mt-1">
              Recommandation : {getRecommendedSwissRounds(parseInt(playerCount))} rondes
              {getRecommendedTopCut(parseInt(playerCount)) !== 'NONE' && (
                <>, {getRecommendedTopCut(parseInt(playerCount)).replace('TOP', 'Top ')}</>
              )}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="ink-label">Rondes *</label>
            <input type="number" required min="1" value={swissRounds} onChange={e => setSwissRounds(e.target.value)}
              className="ink-input" />
          </div>
          <div>
            <label className="ink-label">Top Cut</label>
            <select value={topCut} onChange={e => setTopCut(e.target.value)}
              className="ink-input">
              <option value="NONE">Aucun</option>
              <option value="TOP4">Top 4</option>
              <option value="TOP8">Top 8</option>
              <option value="TOP16">Top 16</option>
              <option value="TOP32">Top 32</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="ink-label">Classement</label>
            <input type="number" min="1" value={placement} onChange={e => setPlacement(e.target.value)} placeholder="#"
              className="ink-input" />
          </div>
        </div>

        <div>
          <label className="ink-label">Format</label>
          <select value={format} onChange={e => setFormat(e.target.value)}
            className="ink-input">
            <option value="BO1">Best of 1</option>
            <option value="BO3">Best of 3</option>
            <option value="BO5">Best of 5</option>
          </select>
        </div>

        {/* Deck selection */}
        <div className="space-y-3">
          <label className="ink-label">Mon deck *</label>

          {savedDecks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {savedDecks.map(deck => (
                <button
                  key={deck.id} type="button"
                  onClick={() => handleDeckSelect(deck.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    selectedDeckId === deck.id
                      ? 'border-gold-500 bg-gold-500/10 ring-2 ring-gold-500/30'
                      : 'border-ink-700/50 bg-ink-900/50 hover:border-ink-600/50'
                  }`}
                >
                  <DeckBadges colors={deck.colors as any} />
                  <span className="text-ink-200 font-medium text-sm">{deck.name}</span>
                  {deck.isDefault && <span className="text-xs text-gold-400 font-medium hidden sm:inline">(défaut)</span>}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleDeckSelect('')}
                className={`px-3 py-2.5 rounded-xl border text-sm transition-all ${
                  selectedDeckId === ''
                    ? 'border-gold-500 bg-gold-500/10 ring-2 ring-gold-500/30'
                    : 'border-ink-700/50 bg-ink-900/50 hover:border-ink-600/50'
                } text-ink-400`}
              >
                Autre...
              </button>
            </div>
          )}

          {/* Manual deck link + colors */}
          {(!selectedDeckId || savedDecks.length === 0) && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-ink-500 mb-1">Lien du deck</label>
                <div className="relative">
                  <input
                    type="url" value={myDeckLink}
                    onChange={e => handleDeckLinkChange(e.target.value)}
                    onPaste={e => {
                      const pasted = e.clipboardData.getData('text');
                      if (pasted && isDeckUrl(pasted)) { e.preventDefault(); setMyDeckLink(pasted); fetchColors(pasted); }
                    }}
                    placeholder="dreamborn.ink, lorcanito.com..."
                    className="ink-input pr-10 text-sm"
                  />
                  {deckLinkLoading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-400 text-sm animate-spin">&#9696;</span>}
                  {deckLinkStatus === 'success' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-lg">&#10003;</span>}
                  {deckLinkStatus === 'error' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-lg">&#10007;</span>}
                </div>
                {deckLinkStatus === 'error' && deckLinkError && (
                  <p className="text-xs text-red-400 mt-1">{deckLinkError}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-ink-500 mb-2">Couleurs</label>
                <InkColorPicker selected={myDeckColors} onChange={setMyDeckColors} />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="ink-label">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Notes sur le tournoi..."
            className="ink-input resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 ink-btn-primary"
          >{loading ? (isEdit ? 'Modification...' : 'Création...') : (isEdit ? 'Enregistrer' : 'Créer le tournoi')}</button>
          <button type="button" onClick={() => navigate(isEdit ? `/tournaments/${editId}` : '/tournaments')}
            className="ink-btn-secondary"
          >Annuler</button>
        </div>
      </form>
    </div>
  );
}
