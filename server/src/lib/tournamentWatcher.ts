import prisma from './prisma.js';
import { getEventRoundsData } from '../controllers/ravensburger.controller.js';
import { sendToUser, pushEnabled } from './push.js';

function extractEventId(link: string | null): string | null {
  const m = link?.match(/events\/(\d+)/);
  return m ? m[1] : null;
}

// Surveille les tournois "du jour" (fenêtre ±18 h, robuste au fuseau/horaire stocké)
// liés au Play Hub, et pousse une notification au propriétaire à chaque nouvelle
// ronde publiée / résultats publiés. Idempotent via notifyLastPublished/Completed.
export async function pollLiveTournaments(): Promise<void> {
  if (!pushEnabled) return;
  const now = Date.now();
  const start = new Date(now - 18 * 3600 * 1000);
  const end = new Date(now + 18 * 3600 * 1000);

  const tournaments = await prisma.tournament.findMany({
    where: { eventLink: { not: null }, date: { gte: start, lte: end } },
    include: { user: { select: { id: true, notifyTournaments: true } } },
  });

  for (const t of tournaments) {
    const eventId = extractEventId(t.eventLink);
    if (!eventId) continue;
    try {
      const data = await getEventRoundsData(eventId);
      const real = data.rounds.filter((r: any) => r.roundNumber > 0);
      const maxPublished = real.length ? Math.max(...real.map((r: any) => r.roundNumber)) : 0;
      const completed = real.filter((r: any) => r.status === 'COMPLETE').map((r: any) => r.roundNumber);
      const maxCompleted = completed.length ? Math.max(...completed) : 0;

      const updates: { notifyLastPublished?: number; notifyLastCompleted?: number } = {};

      if (maxPublished > t.notifyLastPublished) {
        if (t.user.notifyTournaments) {
          const launch = t.notifyLastPublished === 0;
          await sendToUser(t.userId, {
            title: launch ? 'Tournoi lancé 🎉' : 'Nouvelle ronde',
            body: launch ? `${t.name} — ronde 1 disponible` : `${t.name} — ronde ${maxPublished} publiée`,
            tag: `t-${t.id}`,
            url: `/tournaments/${t.id}`,
          });
        }
        updates.notifyLastPublished = maxPublished;
      }

      if (maxCompleted > t.notifyLastCompleted) {
        if (t.user.notifyTournaments && maxCompleted > 0) {
          await sendToUser(t.userId, {
            title: 'Résultats publiés',
            body: `${t.name} — résultats de la ronde ${maxCompleted}`,
            tag: `t-${t.id}-r${maxCompleted}`,
            url: `/tournaments/${t.id}`,
          });
        }
        updates.notifyLastCompleted = maxCompleted;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.tournament.update({ where: { id: t.id }, data: updates });
      }
    } catch {
      // On ignore ce tournoi pour ce cycle (event non trouvé / API KO).
    }
  }
}
