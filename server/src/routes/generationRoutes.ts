import { Router } from 'express';
import { generationController } from '../controllers/generationController';
import { validateGenerationRequest } from '../validators/generationValidator';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, validateGenerationRequest, generationController.generate);
router.post('/enhance', requireAuth, generationController.enhancePrompt);
router.get('/', requireAuth, generationController.list);
router.get('/:id', requireAuth, generationController.getById);
router.patch('/:id', requireAuth, generationController.update);
router.delete('/:id', requireAuth, generationController.delete);

export default router;

