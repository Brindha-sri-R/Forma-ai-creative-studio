import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validateRegister, validateLogin, validateResetPassword } from '../validators/authValidator';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', validateRegister, authController.register);
router.post('/signup', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/signin', validateLogin, authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getMe);
router.patch('/profile', requireAuth, authController.updateProfile);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);
router.post('/oauth-mock', authController.oauthMock);

export default router;

