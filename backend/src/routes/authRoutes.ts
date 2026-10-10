import { Router } from 'express';
import { getAuthUrl, handleGoogleCallback, getAuthStatus, logout } from '../controllers/authController';

const router = Router();

router.get('/google/url', getAuthUrl);
router.get('/google/callback', handleGoogleCallback);
router.get('/status', getAuthStatus);
router.post('/logout', logout);

export default router;
