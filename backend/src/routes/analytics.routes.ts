import { Router } from 'express';
import { logSimulation, getTeacherAnalytics } from '../controllers/analytics.controller';
import { optionalAuthenticateToken } from '../middleware/auth';

const router = Router();

router.use(optionalAuthenticateToken);

router.post('/log', logSimulation);
router.get('/teacher', getTeacherAnalytics);

export default router;
