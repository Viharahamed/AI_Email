import { Router } from 'express';
import { processPrompt } from '../controllers/aiController';

const router = Router();

// POST /api/ai/process
router.post('/process', processPrompt);

export default router;
