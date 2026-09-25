import { Router } from 'express';
import { shareProject, getProjectShares, removeShare } from '../controllers/share.controller';
import { optionalAuthenticateToken } from '../middleware/auth';

const router = Router();

router.use(optionalAuthenticateToken);

router.post('/', shareProject);
router.get('/project/:projectId', getProjectShares);
router.delete('/:id', removeShare);

export default router;
