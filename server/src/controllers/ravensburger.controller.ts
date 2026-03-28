import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const RPH_API = 'https://api.ravensburgerplay.com/api/v2';

const rphFetch = (path: string) =>
  fetch(`${RPH_API}${path}`, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'GlimmerLog/1.0' },
    signal: AbortSignal.timeout(15000),
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
      let totalSwissRounds = 0;
      let totalElimRounds = 0;
      for (const phase of data.tournament_phases) {
        const rt = (phase.round_type || '').toUpperCase();
        if (rt === 'SWISS' && Array.isArray(phase.rounds)) {
          totalSwissRounds += phase.rounds.length;
        }
        if (rt.includes('ELIMINATION') && Array.isArray(phase.rounds)) {
          totalElimRounds += phase.rounds.length;
        }
      }
      if (totalSwissRounds > 0) {
        result.swissRounds = totalSwissRounds;
      }
      if (totalElimRounds > 0) {
        // Total elimination rounds = log2(topCut), so topCut = 2^elimRounds
        const topCutSize = Math.pow(2, totalElimRounds);
        if (topCutSize === 4) result.topCut = 'TOP4';
        else if (topCutSize === 8) result.topCut = 'TOP8';
        else if (topCutSize === 16) result.topCut = 'TOP16';
        else if (topCutSize === 32) result.topCut = 'TOP32';
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
  const MAX_PAGES = 50;
  const results: any[] = [];
  let page = 1;
  while (page <= MAX_PAGES) {
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
    // Serve from cache unless user explicitly refreshes
    if (!forceRefresh) {
      try {
        const cached = await prisma.eventCache.findUnique({ where: { eventId } });
        if (cached) {
          const cachedData = cached.data as any;
          // Don't serve empty cache — re-fetch if rounds were not yet available when cached
          if (Array.isArray(cachedData?.rounds) && cachedData.rounds.length > 0) {
            return res.json(cached.data);
          }
        }
      } catch (cacheErr) {
        console.warn('Cache read failed (table may not exist):', (cacheErr as any).message);
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

    // Save to cache only if we got actual data (graceful — skip if table doesn't exist)
    if (roundsData.length > 0) try {
      await prisma.eventCache.upsert({
        where: { eventId },
        update: { data: payload as any, updatedAt: new Date() },
        create: { eventId, data: payload as any },
      });
    } catch (cacheErr) {
      console.warn('Cache write failed (table may not exist):', (cacheErr as any).message);
    }

    return res.json(payload);
  } catch (err: any) {
    console.error('Ravensburger rounds error:', err);
    return res.status(502).json({ error: 'Erreur de communication avec Ravensburger' });
  }
}
