import { Router } from 'express';
import { authenticate, authorizeRoles } from '@event-os/config';
import { UserRole } from '@event-os/types';
import { authController } from '../controllers/auth.controller';

const router = Router();

// Public routes
router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));

// Protected profile & password routes
router.get('/me', authenticate, (req, res, next) => authController.getMe(req, res, next));
router.put('/profile', authenticate, (req, res, next) => authController.updateProfile(req, res, next));
router.put('/me', authenticate, (req, res, next) => authController.updateProfile(req, res, next));
router.put('/change-password', authenticate, (req, res, next) => authController.changePassword(req, res, next));
router.post('/change-password', authenticate, (req, res, next) => authController.changePassword(req, res, next));

// Protected user lookup route
router.get('/users/:id', authenticate, (req, res, next) => authController.getUserById(req, res, next));

// Admin & Super Admin routes
router.get(
  '/users',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  (req, res, next) => authController.listUsers(req, res, next)
);

// Super Admin only routes
router.patch(
  '/users/:id/role',
  authenticate,
  authorizeRoles(UserRole.SUPER_ADMIN),
  (req, res, next) => authController.updateRole(req, res, next)
);

export default router;
