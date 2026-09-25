import { Router } from 'express';
import {
  getProjectReportHtml,
  getProjectJson,
  exportDirectReport,
} from '../controllers/export.controller';

const router = Router();

// Lab report printable HTML view
router.get('/project/:id/report', getProjectReportHtml);

// Netlist JSON export
router.get('/project/:id/json', getProjectJson);

// Direct on-the-fly report export from active canvas (supports GET and POST)
router.all('/direct-report', exportDirectReport);

export default router;
