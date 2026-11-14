import { Router } from 'express';
import { uploadController } from '../controllers/uploadController';
import { uploadMiddleware } from '../middleware/upload';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, uploadMiddleware.single('file'), uploadController.upload);

export default router;

