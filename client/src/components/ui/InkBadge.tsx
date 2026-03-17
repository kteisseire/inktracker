import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { INK_COLORS, type InkColor, type ScoutReport, type PotentialDeck, type Team } from '@lorcana/shared';
import { INK_COLORS_CONFIG } from '../../lib/colors.js';

/* ── Full-size badge (used in deck pages, modals, etc.) ── */
export function InkBadge({ color }: { color: InkColor }) {
  const config = INK_COLORS_CONFIG[color];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow-sm"
      style={{
        backgroundColor: config.hex,
        color: color === 'AMBER' ? '#78350f' : '#fff',
        textShadow: color === 'AMBER' ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
      }}
    >
      {config.label}
    </span>
  );
}

/* ── Tiny colored dot ── */
function InkDot({ color }: { color: InkColor }) {
  const config = INK_COLORS_CONFIG[color];
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full ring-1 ring-white/10"
      style={{ backgroundColor: config.hex }}
      title={config.label}
    />
  );
}

/* ── Full-size badge list (deck pages) ── */
export function DeckBadges({ colors }: { colors: InkColor[] }) {
  const valid = (colors || []).filter(c => c && INK_COLORS_CONFIG[c]);
  if (valid.length === 0) return <span className="text-xs text-ink-500">—</span>;
  return (
    <span className="inline-flex gap-1.5">
      {valid.map(c => <InkBadge key={c} color={c} />)}
    </span>
  );
}

/* ── Shared modal backdrop ── */
function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-sm bg-ink-900 border border-ink-700/50 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-lg text-ink-500 hover:text-ink-300 hover:bg-ink-800/50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${date} à ${time}`;
}

/* ── Scout deck dots: shows colored dots, tap to see details ── */
export function ScoutDeckBadges({ scout, possibleDecks }: { scout?: ScoutReport; possibleDecks?: PotentialDeck[] }) {
  const [open, setOpen] = useState(false);

  const certainColors = (scout?.deckColors || []).filter(c => c && INK_COLORS_CONFIG[c as InkColor]) as InkColor[];
  const hasCertain = certainColors.length > 0;
  const hasPotentials = possibleDecks && possibleDecks.length > 0;

  if (!hasCertain && !hasPotentials) return null;

  return (
    <>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(true); }}
        className={`inline-flex items-center gap-1 p-0.5 rounded hover:bg-ink-800/50 transition-colors ${!hasCertain && hasPotentials ? 'opacity-50' : ''}`}
        title={!hasCertain && hasPotentials ? 'Decks potentiels' : undefined}
      >
        {hasCertain ? (
          certainColors.map(c => <InkDot key={c} color={c} />)
        ) : (
          <>
            <span className="text-amber-400 text-[10px]">?</span>
            {possibleDecks!.map((deck, i) => (
              <span key={deck.id || i} className="inline-flex items-center gap-0.5">
                {i > 0 && <span className="text-ink-600 text-[10px] mx-0.5">/</span>}
                {(deck.deckColors as InkColor[]).filter(c => INK_COLORS_CONFIG[c]).map(c => <InkDot key={c} color={c} />)}
              </span>
            ))}
          </>
        )}
      </button>

      {open && (
        <ModalBackdrop onClose={() => setOpen(false)}>
          <div className="space-y-4">
            {hasCertain ? (
              <>
                <h3 className="text-base font-semibold text-ink-100">Deck qualifié</h3>
                <div className="flex items-center gap-1.5">
                  {certainColors.map(c => <InkBadge key={c} color={c} />)}
                </div>
                <div className="space-y-1 text-[11px] text-ink-500">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Par <span className="text-ink-300">{scout!.reportedBy.username}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formatDateTime(scout!.updatedAt)}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-ink-100">Decks potentiels</h3>
                <p className="text-xs text-amber-400/80 italic">
                  Attribution incertaine — ce joueur joue l'un de ces decks
                </p>
                <div className="space-y-3">
                  {possibleDecks!.map((deck, i) => (
                    <div key={deck.id || i} className="rounded-lg bg-ink-800/40 p-3 space-y-2">
                      <p className="text-xs font-semibold text-ink-300">Deck {String.fromCharCode(65 + i)}</p>
                      <div className="flex items-center gap-1.5">
                        {(deck.deckColors as InkColor[]).filter(c => INK_COLORS_CONFIG[c]).map(c => <InkBadge key={c} color={c} />)}
                      </div>
                      <div className="space-y-1 text-[11px] text-ink-500">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Match entre <span className="text-ink-300">{deck.player1Name}</span> et <span className="text-ink-300">{deck.player2Name}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Par <span className="text-ink-300">{deck.reportedBy.username}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                          <span>Ronde {deck.roundNumber} — Table {deck.tableNumber}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatDateTime(deck.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </ModalBackdrop>
      )}
    </>
  );
}

/* ── Scout picker: button to qualify a player's deck ── */
export function ScoutPicker({ playerName, teams, eventId, existingColors, onSaved }: {
  playerName: string;
  teams: Team[];
  eventId: string;
  existingColors?: InkColor[];
  onSaved: (playerName: string, colors: InkColor[], teamId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [colors, setColors] = useState<InkColor[]>(existingColors || []);
  const [teamId, setTeamId] = useState(teams[0]?.id || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setColors(existingColors || []); }, [existingColors]);

  if (teams.length === 0) return null;

  const hasExisting = existingColors && existingColors.length > 0;

  const toggle = (color: InkColor) => {
    if (colors.includes(color)) setColors(colors.filter(c => c !== color));
    else if (colors.length < 2) setColors([...colors, color]);
  };

  const handleSave = async () => {
    if (colors.length === 0 || !teamId) return;
    setSaving(true);
    try {
      await onSaved(playerName, colors, teamId);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setColors(existingColors || []);
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full transition-colors shrink-0 ${
          hasExisting
            ? 'text-ink-400 bg-ink-800/60 hover:bg-ink-700/60 hover:text-ink-200'
            : 'text-gold-400 bg-gold-500/15 hover:bg-gold-500/25'
        }`}
        title={hasExisting ? `Modifier le deck de ${playerName}` : `Qualifier le deck de ${playerName}`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          {hasExisting ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          )}
        </svg>
      </button>

      {open && (
        <ModalBackdrop onClose={() => setOpen(false)}>
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-ink-100">Qualifier le deck</h3>
              <p className="text-sm text-ink-400 mt-1 truncate">{playerName}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-ink-500 font-medium uppercase tracking-wide">Couleurs (2 max)</p>
              <div className="grid grid-cols-3 gap-2">
                {INK_COLORS.map(color => {
                  const config = INK_COLORS_CONFIG[color];
                  const isSelected = colors.includes(color);
                  const isDisabled = !isSelected && colors.length >= 2;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggle(color)}
                      disabled={isDisabled}
                      className={`flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isSelected
                          ? 'ring-2 ring-gold-400 scale-[1.02] shadow-lg'
                          : isDisabled
                          ? 'opacity-20 cursor-not-allowed'
                          : 'opacity-50 hover:opacity-75'
                      }`}
                      style={{
                        backgroundColor: config.hex,
                        color: color === 'AMBER' ? '#78350f' : '#fff',
                        textShadow: color === 'AMBER' ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
                      }}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {teams.length > 1 && (
              <div className="space-y-2">
                <p className="text-xs text-ink-500 font-medium uppercase tracking-wide">Équipe</p>
                <select
                  value={teamId}
                  onChange={e => setTeamId(e.target.value)}
                  className="w-full bg-ink-800/50 border border-ink-700/50 rounded-xl text-sm text-ink-200 px-3 py-2.5 focus:outline-none focus:border-gold-500/40"
                >
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl border border-ink-700 text-ink-300 hover:bg-ink-800/50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={colors.length === 0 || saving}
                className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Envoi...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </>
  );
}
