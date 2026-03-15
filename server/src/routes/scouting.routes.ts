import { Router } from 'express';
import {
  getEventScoutReports, upsertScoutReport, bulkUpsertScoutReports, deleteScoutReport,
} from '../controllers/scouting.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validate.js';
import { createScoutReportSchema, bulkScoutReportSchema } from '../validators/scouting.schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/events/:eventId', asyncHandler(getEventScoutReports));
router.post('/', validate(createScoutReportSchema), asyncHandler(upsertScoutReport));
router.post('/bulk', validate(bulkScoutReportSchema), asyncHandler(bulkUpsertScoutReports));
router.delete('/:reportId', asyncHandler(deleteScoutReport));

export default router;
