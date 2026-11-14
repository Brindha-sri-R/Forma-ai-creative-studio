import { Router } from 'express';
import { creditsController } from '../controllers/creditsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/history', requireAuth, creditsController.getHistory);
router.post('/plan', requireAuth, creditsController.selectPlan);
router.post('/topup', requireAuth, creditsController.topup);

export default router;

