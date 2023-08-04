/* src/routers/profile.ts */

import { Router } from 'express';
import { HealthController } from '../controllers';
const router: Router = Router();
router.get('/health', HealthController.getHealth);

export const HealthRouter: Router = router;
