import api from './client.js';
import type { ScoutReport, CreateScoutReportRequest, BulkScoutReportRequest } from '@lorcana/shared';

export async function getEventScoutReports(eventId: string, teamId?: string): Promise<ScoutReport[]> {
  const res = await api.get(`/scouting/events/${eventId}`, {
    params: teamId ? { teamId } : undefined,
  });
  return res.data.reports;
}

export async function upsertScoutReport(data: CreateScoutReportRequest): Promise<ScoutReport> {
  const res = await api.post('/scouting', data);
  return res.data.report;
}

export async function bulkUpsertScoutReports(data: BulkScoutReportRequest): Promise<ScoutReport[]> {
  const res = await api.post('/scouting/bulk', data);
  return res.data.reports;
}

export async function deleteScoutReport(reportId: string): Promise<void> {
  await api.delete(`/scouting/${reportId}`);
}
