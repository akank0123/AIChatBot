import { Router } from 'express';
import { createSession, getSession, patchSession, deleteSession } from '../controllers/session.js';

const router = Router();

router.post('/api/sessions',              createSession);
router.get('/api/sessions/:sessionId',    getSession);
router.patch('/api/sessions/:sessionId',  patchSession);
router.delete('/api/sessions/:sessionId', deleteSession);

export default router;
