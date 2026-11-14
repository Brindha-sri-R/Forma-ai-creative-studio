import { Router } from 'express';
import { collectionsController } from '../controllers/collectionsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, collectionsController.list);
router.post('/', requireAuth, collectionsController.create);
router.delete('/:name', requireAuth, collectionsController.delete);

export default router;

