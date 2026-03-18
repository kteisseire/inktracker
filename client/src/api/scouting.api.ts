import api from './client.js';
import type { ScoutReport, CreateScoutReportRequest, BulkScoutReportRequest, PotentialDeck, CreatePotentialDecksRequest } from '@lorcana/shared';

export async function getEventScoutReports(eventId: string, teamId?: string): Promise<{ reports: ScoutReport[]; potentialDecks: PotentialDeck[] }> {
  const res = await api.get(`/scouting/events/${eventId}`, {
    params: teamId ? { teamId } : undefined,
  });
  return { reports: res.data.reports || [], potentialDecks: res.data.potentialDecks || [] };
}

export async function upsertScoutReport(data: CreateScoutReportRequest): Promise<{ report: ScoutReport; deduced: ScoutReport[] }> {
  const res = await api.post('/scouting', data);
  return { report: res.data.report, deduced: res.data.deduced || [] };
}

export async function bulkUpsertScoutReports(data: BulkScoutReportRequest): Promise<ScoutReport[]> {
  const res = await api.post('/scouting/bulk', data);
  return res.data.reports;
}

export async function createPotentialDecks(data: CreatePotentialDecksRequest): Promise<PotentialDeck[]> {
  const res = await api.post('/scouting/potential-decks', data);
  return res.data.potentialDecks;
}

export async function deleteScoutReport(reportId: string): Promise<void> {
  await api.delete(`/scouting/${reportId}`);
}
