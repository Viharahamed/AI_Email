import { Router } from 'express';
import { getInbox, getSent, getEmail, searchEmails, sendEmail } from '../controllers/mailController';

const router = Router();

router.get('/inbox', getInbox);
router.get('/sent', getSent);
router.get('/search', searchEmails);
router.get('/email/:id', getEmail);
router.post('/send', sendEmail);

export default router;
