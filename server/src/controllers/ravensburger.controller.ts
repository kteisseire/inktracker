import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const RPH_API = 'https://api.ravensburgerplay.com/api/v2';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const rphFetch = (path: string) =>
  fetch(`${RPH_API}${path}`, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'InkTracker/1.0' },
  });

export async function getEventInfo(req: Request, res: Response) {
  const { eventId } = req.params;

  if (!/^\d+$/.test(eventId)) {
    return res.status(400).json({ error: 'ID événement invalide' });
  }

  try {
    const response = await rphFetch(`/events/${eventId}/`);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Événement non trouvé' });
    }

    const data = await response.json() as any;

    const result: Record<string, any> = {
      name: data.name || null,
      date: data.start_datetime || null,
      location: null,
      playerCount: data.starting_player_count || data.registered_user_count || null,
      format: null,
      eventType: data.event_type || null,
      status: data.display_status || data.event_status || null,
    };

    if (data.store?.name) {
      result.location = data.store.name;
      if (data.full_address) {
        const parts = data.full_address.split(',').map((s: string) => s.trim());
        if (parts.length >= 2) {
          result.location += ` — ${parts[1]}`;
        }
      }
    } else if (data.full_address) {
      result.location = data.full_address;
    }

    const gfName = data.gameplay_format?.name;
    if (typeof gfName === 'string') {
      const gf = gfName.toLowerCase();
      if (gf.includes('constructed') || gf.includes('core') || gf.includes('sealed') || gf.includes('draft')) {
        result.format = 'BO3';
      }
    }

    if (data.tournament_phases && Array.isArray(data.tournament_phases)) {
      for (const phase of data.tournament_phases) {
        if (phase.round_type === 'SWISS' && Array.isArray(phase.rounds)) {
          result.swissRounds = phase.rounds.length;
        }
      }
    }

    return res.json(result);
  } catch (err: any) {
    console.error('Ravensburger API error:', err);
    return res.status(502).json({ error: 'Erreur de communication avec Ravensburger' });
  }
}

/** Fetch all pages from a paginated RPH endpoint */
async function fetchAllPages(path: string): Promise<any[]> {
  const results: any[] = [];
  let page = 1;
  while (true) {
    const sep = path.includes('?') ? '&' : '?';
    const r = await rphFetch(`${path}${sep}page=${page}&page_size=100`);
    if (!r.ok) break;
    const data = await r.json() as any;
    results.push(...(data.results || []));
    if (!data.next_page_number) break;
    page = data.next_page_number;
  }
  return results;
}

export async function getEventRounds(req: Request, res: Response) {
  const { eventId } = req.params;
  const forceRefresh = req.query.refresh === '1';

  if (!/^\d+$/.test(eventId)) {
    return res.status(400).json({ error: 'ID événement invalide' });
  }

  try {
    // Check cache
    if (!forceRefresh) {
      const cached = await prisma.eventCache.findUnique({ where: { eventId } });
      if (cached && Date.now() - cached.updatedAt.getTime() < CACHE_TTL_MS) {
        return res.json(cached.data);
      }
    }

    // Fetch event to get round IDs
    const eventRes = await rphFetch(`/events/${eventId}/`);
    if (!eventRes.ok) {
      return res.status(eventRes.status).json({ error: 'Événement non trouvé' });
    }
    const event = await eventRes.json() as any;

    const phases = event.tournament_phases || [];
    const roundsData: any[] = [];

    for (const phase of phases) {
      if (!Array.isArray(phase.rounds)) continue;
      for (const round of phase.rounds) {
        const roundId = round.id;
        const roundNumber = round.round_number;
        const roundType = phase.round_type; // SWISS, SINGLE_ELIMINATION, etc.
        const status = round.status;

        // Fetch standings and matches in parallel
        const [standings, matches] = await Promise.all([
          fetchAllPages(`/tournament-rounds/${roundId}/standings/paginated/`),
          fetchAllPages(`/tournament-rounds/${roundId}/matches/paginated/`),
        ]);

        roundsData.push({
          roundId,
          roundNumber,
          roundType,
          status,
          phaseName: phase.phase_name,
          standings: standings.map((s: any) => ({
            rank: s.rank,
            playerName: s.user_event_status?.best_identifier || s.player?.best_identifier || 'Inconnu',
            record: s.record,
            matchRecord: s.match_record,
            matchPoints: s.match_points,
            totalPoints: s.user_event_status?.total_match_points ?? s.points ?? 0,
            omw: s.opponent_match_win_percentage,
            gw: s.game_win_percentage,
            ogw: s.opponent_game_win_percentage,
          })),
          matches: matches.map((m: any) => {
            const players = (m.player_match_relationships || []).map((pmr: any) => ({
              playerName: pmr.user_event_status?.best_identifier || pmr.player?.best_identifier || 'Inconnu',
              playerId: pmr.player?.id,
            }));
            return {
              matchId: m.id,
              table: m.table_number,
              isBye: m.match_is_bye,
              isDraw: m.match_is_intentional_draw || m.match_is_unintentional_draw,
              winnerId: m.winning_player,
              gamesWonByWinner: m.games_won_by_winner,
              gamesWonByLoser: m.games_won_by_loser,
              players,
            };
          }),
        });
      }
    }

    const payload = { eventId, rounds: roundsData };

    // Save to cache
    await prisma.eventCache.upsert({
      where: { eventId },
      update: { data: payload as any, updatedAt: new Date() },
      create: { eventId, data: payload as any },
    });

    return res.json(payload);
  } catch (err: any) {
    console.error('Ravensburger rounds error:', err);
    return res.status(502).json({ error: 'Erreur de communication avec Ravensburger' });
  }
}
