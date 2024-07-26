import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.debug('WsJwtGuard.canActivate called');
    try {
      const client = context.switchToWs().getClient();
      const authToken = client.handshake.headers.authorization?.split(' ')[1];

      this.logger.debug(
        `Extracted token: ${authToken ? 'exists' : 'not found'}`,
      );

      if (!authToken) {
        this.logger.warn('No token provided');
        return false;
      }

      this.logger.debug('Calling authService.validateToken');
      const user = await this.authService.validateToken(authToken);
      this.logger.debug(`User validated: ${JSON.stringify(user)}`);

      client.user = user;
      return true;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      return false;
    }
  }
}
