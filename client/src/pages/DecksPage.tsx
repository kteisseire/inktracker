import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listDecks, createDeck, updateDeck, deleteDeck, setDefaultDeck, extractDeckColors } from '../api/deck.api.js';
import { DeckBadges, HollowLozenge } from '../components/ui/InkBadge.js';
import { InkColorPicker } from '../components/ui/InkColorPicker.js';
import { HelpButton } from '../components/ui/HelpButton.js';
import { SkeletonRows } from '../components/ui/Skeleton.js';
import { ErrorAlert } from '../components/ui/ErrorAlert.js';
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
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fetchIdRef = useRef(0);

  const fetchColors = useCallback(async (url: string) => {
    const fetchId = ++fetchIdRef.current;
    setLinkLoading(true); setLinkSuccess(false);
    try {
      const detected = await extractDeckColors(url);
      if (fetchId === fetchIdRef.current) { setColors(detected); setLinkSuccess(detected.length > 0); }
    } catch { /* ignore */ } finally {
      if (fetchId === fetchIdRef.current) setLinkLoading(false);
    }
  }, []);

  const handleLinkPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted && isDeckUrl(pasted)) { e.preventDefault(); setLink(pasted); fetchColors(pasted); }
  };

  const handleLinkChange = (value: string) => {
    setLink(value); setLinkSuccess(false);
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
      {error && <ErrorAlert message={error} />}
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
          {linkLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-400">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" /></svg>
            </span>
          )}
          {!linkLoading && linkSuccess && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lorcana-emerald">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </span>
          )}
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
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  const { data: decks = [], isLoading: loading } = useQuery({
    queryKey: ['decks'],
    queryFn: listDecks,
  });

  const reloadDecks = () => queryClient.invalidateQueries({ queryKey: ['decks'] });

  const handleCreate = async (data: DeckFormData) => {
    const isFirst = decks.length === 0;
    await createDeck({ name: data.name, colors: data.colors, link: data.link || undefined, isDefault: isFirst });
    setShowForm(false); reloadDecks();
  };

  const handleUpdate = async (data: DeckFormData) => {
    if (!editingDeck) return;
    await updateDeck(editingDeck.id, { name: data.name, colors: data.colors, link: data.link || undefined });
    setEditingDeck(null); reloadDecks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce deck ?')) return;
    await deleteDeck(id); reloadDecks();
  };

  const handleSetDefault = async (id: string) => { await setDefaultDeck(id); reloadDecks(); };
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl text-ink-50 tracking-[0.03em]">Mes decks</h1>
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

      {loading ? (
        <SkeletonRows count={4} />
      ) : decks.length === 0 && !showForm ? (
        <div className="section-wash flex flex-col items-center text-center py-12 gap-3">
          <HollowLozenge size={26} />
          <p className="font-display text-lg text-ink-50 tracking-[0.02em]">Aucun deck enregistré</p>
          <p className="text-sm text-ink-500 max-w-sm">Créez votre premier deck pour le sélectionner rapidement dans vos tournois.</p>
          <button onClick={() => setShowForm(true)} className="ink-btn-primary text-sm px-4 py-2 mt-1">Créer un deck</button>
        </div>
      ) : decks.length > 0 ? (
        <div className="ink-card divide-y divide-rule overflow-hidden">
          {decks.map(deck => (
            <div
              key={deck.id}
              onClick={() => navigate(`/decks/${deck.id}/stats`)}
              data-active={deck.isDefault ? 'true' : undefined}
              className="status-rail row-tappable flex items-start gap-3 pl-4 pr-3 py-3.5 cursor-pointer hover:bg-ink-800/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-display text-[0.95rem] tracking-[0.02em] text-ink-100 truncate">{deck.name}</span>
                  {deck.isDefault && (
                    <span className="text-[10px] bg-gold-500/15 text-gold-400 px-2 py-0.5 rounded-full uppercase tracking-[0.08em] shrink-0">Défaut</span>
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
          ))}
        </div>
      ) : null}

      {/* Compatible deckbuilders */}
      <div className="mt-10">
        <h2 className="rubric-label mb-3">Sites compatibles</h2>
        <p className="text-xs text-ink-500 mb-3 -mt-1">Collez un lien pour importer les couleurs automatiquement.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {DECKBUILDER_LINKS.map(site => (
            <a
              key={site.url}
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-ink-haze border border-rule rounded-md p-3 sm:p-4 hover:border-rule-gold transition-colors group text-center"
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
