// roles.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/common/enums/role.enum';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private reflector: Reflector,
    private jwtService: JwtService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.user_token;

    if (!token) {
      this.logger.error('No token found in cookies');
      throw new ForbiddenException('Authentication required');
    }

    try {
      const decoded = this.jwtService.verify(token);
      this.logger.debug('Decoded token:', decoded);

      if (!decoded || !decoded.role) {
        this.logger.error('No role found in token');
        throw new ForbiddenException('User role not found');
      }

      if (!requiredRoles.includes(decoded.role)) {
        this.logger.error(
          `User does not have required role. Required: ${requiredRoles}, Found: ${decoded.role}`
        );
        throw new ForbiddenException(
          'You do not have permission to access this resource'
        );
      }

      // Attach decoded user to request for later use
      request.user = decoded;
      return true;
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      throw new ForbiddenException('Invalid authentication token');
    }
  }
}
