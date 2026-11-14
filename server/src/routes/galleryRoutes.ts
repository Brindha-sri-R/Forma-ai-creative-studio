import { Router } from 'express';
import { galleryController } from '../controllers/galleryController';
import { generationController } from '../controllers/generationController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, generationController.list);
router.patch('/:id', requireAuth, galleryController.update);
router.delete('/:id', requireAuth, galleryController.delete);
router.post('/:id/duplicate', requireAuth, galleryController.duplicate);

export default router;

