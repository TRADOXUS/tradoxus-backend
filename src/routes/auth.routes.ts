import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateDto } from '../middleware/validation';
import { RegisterDto, LoginDto } from '../dto/Auth.dto';

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();

  router.post('/register', validateDto(RegisterDto), controller.register.bind(controller));
  router.post('/login', validateDto(LoginDto), controller.login.bind(controller));

  return router;
} 