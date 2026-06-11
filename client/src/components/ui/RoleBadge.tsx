/* Team role badge — one source of truth, mapped to the palette. */
const ROLE: Record<string, { label: string; cls: string }> = {
  OWNER: { label: 'Propriétaire', cls: 'bg-gold-500/15 text-gold-400' },
  ADMIN: { label: 'Admin', cls: 'bg-lorcana-sapphire/15 text-sky-300' },
  MEMBER: { label: 'Membre', cls: 'bg-lorcana-steel/15 text-ink-200' },
};

export function RoleBadge({ role }: { role?: string }) {
  const r = ROLE[role || 'MEMBER'] ?? ROLE.MEMBER;
  return (
    <span className={`text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-full ${r.cls}`}>
      {r.label}
    </span>
  );
}
