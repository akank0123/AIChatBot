import { Router } from 'express';
import multer from 'multer';
import { MAX_FILE_SIZE_MB } from '../config/index.js';
import { uploadDocument, addUrl, addText, clearDocuments } from '../controllers/documents.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});

router.post('/api/documents/upload', upload.single('file'), uploadDocument);
router.post('/api/documents/url',    addUrl);
router.post('/api/documents/text',   addText);
router.delete('/api/documents',      clearDocuments);

export default router;
