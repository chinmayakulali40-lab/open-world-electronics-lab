import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectByShareCode,
} from '../controllers/project.controller';
import { optionalAuthenticateToken } from '../middleware/auth';

const router = Router();

// Public share code route
router.get('/share/:shareCode', getProjectByShareCode);

// Project routes with optional or authenticated token
router.post('/', optionalAuthenticateToken, createProject);
router.get('/', optionalAuthenticateToken, getProjects);
router.get('/:id', optionalAuthenticateToken, getProjectById);
router.put('/:id', optionalAuthenticateToken, updateProject);
router.delete('/:id', optionalAuthenticateToken, deleteProject);

export default router;
