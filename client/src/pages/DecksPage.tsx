import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listDecks, createDeck, updateDeck, deleteDeck, setDefaultDeck, extractDeckColors } from '../api/deck.api.js';
import { DeckBadges } from '../components/ui/InkBadge.js';
import { InkColorPicker } from '../components/ui/InkColorPicker.js';
import { HelpButton } from '../components/ui/HelpButton.js';
import type { Deck, InkColor } from '@lorcana/shared';

const SUPPORTED_SITES = ['dreamborn.ink', 'lorcanito.com', 'db.lorcanito.com', 'duels.ink', 'inkdecks.com'];

const DECKBUILDER_LINKS = [
  { name: 'Dreamborn', url: 'https://dreamborn.ink', description: 'Deckbuilder populaire avec import/export' },
  { name: 'Lorcanito', url: 'https://lorcanito.com', description: 'Simulateur et deckbuilder en ligne' },
  { name: 'Inkdecks', url: 'https://inkdecks.com', description: 'Base de decks communautaire' },
  { name: 'Duels.ink', url: 'https://duels.ink', description: 'Deckbuilder avec statistiques' },
];

function isDeckUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname;
    return SUPPORTED_SITES.some(d => hostname === d || hostname.endsWith('.' + d));
  } catch { return false; }
}

interface DeckFormData { name: string; colors: InkColor[]; link: string; }

function DeckForm({ initial, onSubmit, onCancel, submitLabel }: {
  initial?: DeckFormData;
  onSubmit: (data: DeckFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [colors, setColors] = useState<InkColor[]>(initial?.colors ?? []);
  const [link, setLink] = useState(initial?.link ?? '');
  const [linkLoading, setLinkLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fetchIdRef = useRef(0);

  const fetchColors = useCallback(async (url: string) => {
    const fetchId = ++fetchIdRef.current;
    setLinkLoading(true);
    try {
      const detected = await extractDeckColors(url);
      if (fetchId === fetchIdRef.current) setColors(detected);
    } catch { /* ignore */ } finally {
      if (fetchId === fetchIdRef.current) setLinkLoading(false);
    }
  }, []);

  const handleLinkPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted && isDeckUrl(pasted)) { e.preventDefault(); setLink(pasted); fetchColors(pasted); }
  };

  const handleLinkChange = (value: string) => {
    setLink(value);
    if (isDeckUrl(value)) fetchColors(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (colors.length === 0) { setError('Sélectionnez au moins une couleur'); return; }
    setError(''); setSaving(true);
    try { await onSubmit({ name, colors, link }); }
    catch (err: any) { setError(err.response?.data?.error || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="ink-card p-4 sm:p-5 space-y-4">
      {error && <div className="ink-error">{error}</div>}
      <div>
        <label className="ink-label">Nom du deck *</label>
        <input type="text" required value={name} onChange={e => setName(e.target.value)}
          placeholder="Ex: Amber/Steel Aggro" className="ink-input" />
      </div>
      <div>
        <label className="ink-label">Lien du deck</label>
        <div className="relative">
          <input type="url" value={link} onChange={e => handleLinkChange(e.target.value)} onPaste={handleLinkPaste}
            placeholder="dreamborn.ink, lorcanito.com..."
            className="ink-input pr-10" />
          {linkLoading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-400 text-sm animate-spin">&#9696;</span>}
        </div>
        <p className="text-xs text-ink-500 mt-1">Les couleurs seront détectées automatiquement</p>
      </div>
      <div>
        <label className="ink-label">Couleurs *</label>
        <InkColorPicker selected={colors} onChange={setColors} />
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving} className="flex-1 ink-btn-primary">
          {saving ? 'Enregistrement...' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="ink-btn-secondary">Annuler</button>
      </div>
    </form>
  );
}

export function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  const loadDecks = () => { listDecks().then(setDecks).finally(() => setLoading(false)); };
  useEffect(() => { loadDecks(); }, []);

  const handleCreate = async (data: DeckFormData) => {
    const isFirst = decks.length === 0;
    await createDeck({ name: data.name, colors: data.colors, link: data.link || undefined, isDefault: isFirst });
    setShowForm(false); loadDecks();
  };

  const handleUpdate = async (data: DeckFormData) => {
    if (!editingDeck) return;
    await updateDeck(editingDeck.id, { name: data.name, colors: data.colors, link: data.link || undefined });
    setEditingDeck(null); loadDecks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce deck ?')) return;
    await deleteDeck(id); loadDecks();
  };

  const handleSetDefault = async (id: string) => { await setDefaultDeck(id); loadDecks(); };
  const navigate = useNavigate();

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400"></div></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-ink-100 tracking-wide">Mes decks</h1>
          <HelpButton sections={['Decks']} />
        </div>
        {!showForm && !editingDeck && (
          <button onClick={() => setShowForm(true)} className="ink-btn-primary text-sm px-4 py-2">+ Nouveau</button>
        )}
      </div>

      {showForm && (
        <div className="mb-6">
          <DeckForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} submitLabel="Créer le deck" />
        </div>
      )}

      {editingDeck && (
        <div className="mb-6">
          <DeckForm
            initial={{ name: editingDeck.name, colors: editingDeck.colors as InkColor[], link: editingDeck.link ?? '' }}
            onSubmit={handleUpdate} onCancel={() => setEditingDeck(null)} submitLabel="Enregistrer"
          />
        </div>
      )}

      {decks.length === 0 && !showForm ? (
        <div className="text-center py-12 text-ink-400">
          <p className="text-lg mb-2">Aucun deck enregistré</p>
          <p className="text-sm text-ink-500">Créez votre premier deck pour le sélectionner rapidement dans vos tournois</p>
        </div>
      ) : (
        <div className="space-y-3">
          {decks.map(deck => (
            <div
              key={deck.id}
              onClick={() => navigate(`/decks/${deck.id}/stats`)}
              className={`ink-card-hover p-3 sm:p-4 cursor-pointer ${deck.isDefault ? 'ring-1 ring-gold-500/30' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-semibold text-ink-100 truncate">{deck.name}</span>
                    {deck.isDefault && (
                      <span className="text-[10px] bg-gold-500/15 text-gold-400 px-2 py-0.5 rounded-full font-semibold tracking-wide shrink-0">DÉFAUT</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <DeckBadges colors={deck.colors as any} />
                    {deck.link && (
                      <a href={deck.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-ink-500 hover:text-ink-300 transition-colors shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 shrink-0" onClick={e => e.stopPropagation()}>
                  {!deck.isDefault && (
                    <button onClick={() => handleSetDefault(deck.id)} className="text-xs text-gold-500 hover:text-gold-300 transition-colors font-medium">Défaut</button>
                  )}
                  <button onClick={() => { setEditingDeck(deck); setShowForm(false); }} className="text-xs text-ink-400 hover:text-ink-200 transition-colors">Modifier</button>
                  <button onClick={() => handleDelete(deck.id)} className="text-xs text-lorcana-ruby/70 hover:text-lorcana-ruby transition-colors">Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deckbuilders compatibles */}
      <div className="mt-10">
        <h2 className="text-sm font-medium text-ink-500 mb-3">Sites compatibles — collez un lien pour importer les couleurs automatiquement</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {DECKBUILDER_LINKS.map(site => (
            <a
              key={site.url}
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ink-card p-3 sm:p-4 hover:border-gold-500/25 transition-colors group text-center"
            >
              <p className="text-sm font-semibold text-ink-100 group-hover:text-gold-400 transition-colors">{site.name}</p>
              <p className="text-[11px] text-ink-500 mt-1 leading-snug">{site.description}</p>
              <span className="inline-flex items-center gap-1 text-[11px] text-gold-500/60 group-hover:text-gold-400 mt-2 transition-colors">
                Ouvrir
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
