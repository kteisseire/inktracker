import api from './client.js';
import type { DateFilter } from './stats.api.js';
import type { MetagameOverview } from '@lorcana/shared';

function dateParams(filter?: DateFilter) {
  if (!filter) return {};
  const params: Record<string, string> = {};
  if (filter.from) params.from = filter.from;
  if (filter.to) params.to = filter.to;
  return { params };
}

/** Anonymized, community-wide metagame snapshot (color combinations, meta share, win rates). */
export async function getMetagameOverview(filter?: DateFilter): Promise<MetagameOverview> {
  const res = await api.get('/metagame/overview', dateParams(filter));
  return res.data;
}
