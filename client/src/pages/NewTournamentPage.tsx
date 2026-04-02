import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const fromShared = searchParams.get('from') === 'shared';
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
      } else if (fromShared) {
        // Pre-fill from shared tournament query params
        const sp = searchParams;
        if (sp.get('name')) setName(sp.get('name')!);
        if (sp.get('date')) setDate(sp.get('date')!);
        if (sp.get('location')) setLocation(sp.get('location')!);
        if (sp.get('playerCount')) {
          setPlayerCount(sp.get('playerCount')!);
          const count = parseInt(sp.get('playerCount')!);
          if (count >= 2) setSwissRounds(String(getRecommendedSwissRounds(count)));
        }
        if (sp.get('swissRounds')) setSwissRounds(sp.get('swissRounds')!);
        if (sp.get('topCut')) setTopCut(sp.get('topCut')!);
        if (sp.get('format')) setFormat(sp.get('format')!);
        if (sp.get('eventLink')) setEventLink(sp.get('eventLink')!);
        // Still apply default deck
        const defaultDeck = decks.find(d => d.isDefault);
        if (defaultDeck) {
          setSelectedDeckId(defaultDeck.id);
          setMyDeckColors(defaultDeck.colors as InkColor[]);
          setMyDeckLink(defaultDeck.link ?? '');
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
      if (info.topCut) {
        setTopCut(info.topCut as any);
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
      if (info.topCut) {
        setTopCut(info.topCut as any);
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

  const [showAdvanced, setShowAdvanced] = useState(false);

  if (initialLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400"></div></div>;
  }

  const FORMAT_LABELS: Record<string, string> = { BO1: 'Bo1', BO3: 'Bo3', BO5: 'Bo5' };
  const TOPCUT_LABELS: Record<string, string> = { NONE: 'Aucun top cut', TOP4: 'Top 4', TOP8: 'Top 8', TOP16: 'Top 16', TOP32: 'Top 32' };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="font-display text-2xl font-bold text-ink-100 tracking-wide mt-1">
        {isEdit ? 'Modifier le tournoi' : 'Nouveau tournoi'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="ink-error">{error}</div>}

        {/* ── Lien Ravensburger ── */}
        <div className="ink-card p-4 space-y-1">
          <label className="ink-label">Lien Ravensburger Play Hub</label>
          <div className="relative">
            <input
              type="url" value={eventLink}
              onChange={e => handleEventLinkChange(e.target.value)}
              onPaste={e => {
                const pasted = e.clipboardData.getData('text');
                if (pasted && extractEventId(pasted)) { e.preventDefault(); setEventLink(pasted); fetchEventData(pasted); }
              }}
              placeholder="https://tcg.ravensburgerplay.com/events/..."
              className="ink-input text-sm pr-10"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {eventFetching && <span className="text-gold-400 animate-spin text-sm">&#9696;</span>}
              {eventFetchStatus === 'success' && <span className="text-green-400 text-lg">&#10003;</span>}
              {eventFetchStatus === 'error' && <span className="text-red-400 text-lg">&#10007;</span>}
              {extractEventId(eventLink) && !eventFetching && (
                <button type="button" onClick={refreshEventData} className="p-1 text-ink-500 hover:text-gold-400 transition-colors" title="Rafraîchir">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-ink-600">Les infos du tournoi sont remplies automatiquement</p>
        </div>

        {/* ── Mon deck ── */}
        <div className="ink-card p-4 space-y-3">
          <label className="ink-label">Mon deck *</label>
          {savedDecks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {savedDecks.map(deck => (
                <button key={deck.id} type="button" onClick={() => handleDeckSelect(deck.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                    selectedDeckId === deck.id ? 'border-gold-500 bg-gold-500/10 ring-2 ring-gold-500/30' : 'border-ink-700/50 bg-ink-900/50 hover:border-ink-600/50'
                  }`}
                >
                  <DeckBadges colors={deck.colors as any} />
                  <span className="text-ink-200 font-medium text-sm">{deck.name}</span>
                  {deck.isDefault && <span className="text-xs text-gold-400 hidden sm:inline">(défaut)</span>}
                </button>
              ))}
              <button type="button" onClick={() => handleDeckSelect('')}
                className={`px-3 py-2 rounded-xl border text-sm transition-all text-ink-400 ${selectedDeckId === '' ? 'border-gold-500 bg-gold-500/10 ring-2 ring-gold-500/30' : 'border-ink-700/50 bg-ink-900/50 hover:border-ink-600/50'}`}
              >Autre…</button>
            </div>
          )}
          {(!selectedDeckId || savedDecks.length === 0) && (
            <div className="space-y-3">
              <div className="relative">
                <input type="url" value={myDeckLink}
                  onChange={e => handleDeckLinkChange(e.target.value)}
                  onPaste={e => { const p = e.clipboardData.getData('text'); if (p && isDeckUrl(p)) { e.preventDefault(); setMyDeckLink(p); fetchColors(p); } }}
                  placeholder="dreamborn.ink, lorcanito.com…"
                  className="ink-input pr-10 text-sm"
                />
                {deckLinkLoading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-400 animate-spin text-sm">&#9696;</span>}
                {deckLinkStatus === 'success' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-lg">&#10003;</span>}
                {deckLinkStatus === 'error' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-lg">&#10007;</span>}
              </div>
              {deckLinkStatus === 'error' && deckLinkError && <p className="text-xs text-red-400">{deckLinkError}</p>}
              <InkColorPicker selected={myDeckColors} onChange={setMyDeckColors} />
            </div>
          )}
        </div>

        {/* ── Preview des infos calculées ── */}
        {(name || date || playerCount || swissRounds) && (
          <div className="ink-card overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <span className="text-xs text-ink-500 uppercase tracking-wider">Aperçu</span>
            </div>
            <div className="px-4 pb-1">
              {name && <p className="font-semibold text-ink-100 truncate">{name}</p>}
              <p className="text-ink-500 text-xs mt-0.5">
                {new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {location && <span className="text-ink-600"> · {location}</span>}
              </p>
            </div>
            <div className="h-px bg-ink-800/60 mx-4 my-2" />
            <div className="grid grid-cols-4 divide-x divide-ink-800/60 pb-3">
              <div className="flex flex-col items-center py-1 px-2 gap-0.5">
                <span className="text-xs text-ink-600 uppercase tracking-wider">Rondes</span>
                <span className="text-sm font-semibold text-ink-200">{swissRounds}</span>
              </div>
              <div className="flex flex-col items-center py-1 px-2 gap-0.5">
                <span className="text-xs text-ink-600 uppercase tracking-wider">Format</span>
                <span className="text-sm font-semibold text-ink-200">{FORMAT_LABELS[format]}</span>
              </div>
              <div className="flex flex-col items-center py-1 px-2 gap-0.5">
                <span className="text-xs text-ink-600 uppercase tracking-wider">Joueurs</span>
                <span className="text-sm font-semibold text-ink-200">{playerCount || '—'}</span>
              </div>
              <div className="flex flex-col items-center py-1 px-2 gap-0.5">
                <span className="text-xs text-ink-600 uppercase tracking-wider">Top</span>
                <span className="text-sm font-semibold text-ink-200">{topCut === 'NONE' ? '—' : TOPCUT_LABELS[topCut]}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Paramètres avancés ── */}
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-ink-700/50 bg-ink-900/30 text-sm text-ink-400 hover:text-ink-200 hover:border-ink-600/50 transition-all"
        >
          <span>Paramètres avancés</span>
          <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="ink-card p-4 space-y-4">
            <div>
              <label className="ink-label">Nom du tournoi *</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Challenge Lorcana Paris" className="ink-input" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="ink-label">Date *</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="ink-input" />
              </div>
              <div>
                <label className="ink-label">Lieu</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Paris" className="ink-input" />
              </div>
            </div>
            <div>
              <label className="ink-label">Nombre de joueurs</label>
              <input type="number" min="2" value={playerCount} onChange={e => handlePlayerCountChange(e.target.value)} className="ink-input" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="ink-label">Rondes *</label>
                <input type="number" required min="1" value={swissRounds} onChange={e => setSwissRounds(e.target.value)} className="ink-input" />
              </div>
              <div>
                <label className="ink-label">Top Cut</label>
                <select value={topCut} onChange={e => setTopCut(e.target.value)} className="ink-input">
                  <option value="NONE">Aucun</option>
                  <option value="TOP4">Top 4</option>
                  <option value="TOP8">Top 8</option>
                  <option value="TOP16">Top 16</option>
                  <option value="TOP32">Top 32</option>
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="ink-label">Classement</label>
                <input type="number" min="1" value={placement} onChange={e => setPlacement(e.target.value)} placeholder="#" className="ink-input" />
              </div>
            </div>
            <div>
              <label className="ink-label">Format</label>
              <select value={format} onChange={e => setFormat(e.target.value)} className="ink-input">
                <option value="BO1">Best of 1</option>
                <option value="BO3">Best of 3</option>
                <option value="BO5">Best of 5</option>
              </select>
            </div>
            <div>
              <label className="ink-label">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Notes sur le tournoi…" className="ink-input resize-none" />
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={loading} className="flex-1 ink-btn-primary">
            {loading ? (isEdit ? 'Modification…' : 'Création…') : (isEdit ? 'Enregistrer' : 'Créer le tournoi')}
          </button>
          <button type="button" onClick={() => navigate(isEdit ? `/tournaments/${editId}` : '/tournaments')} className="ink-btn-secondary">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
