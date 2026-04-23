import { Router } from 'express';
import { sendChat, getProviders, getStatus } from '../controllers/chat.js';

const router = Router();

router.post('/api/chat',             sendChat);
router.get('/api/chat/providers',    getProviders);
router.get('/api/chat/status',       getStatus);

export default router;
