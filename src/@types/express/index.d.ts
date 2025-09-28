import { AuthUser } from 'src/auth/types/auth-user.type';

declare global {
  namespace Express {
    export interface Request {
      user?: AuthUser;
    }
  }
}
