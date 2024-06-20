/* src/routers/profile.ts */

import { Router } from 'express';
import { UserController } from '../_controllers';
const router: Router = Router();

router.post(
  '/create',
  UserController.validate('signup'),
  UserController.signup,
);
router.post(
  '/userLogin',
  UserController.validate('login'),
  UserController.login,
);
export const ProfileRouter: Router = router;
