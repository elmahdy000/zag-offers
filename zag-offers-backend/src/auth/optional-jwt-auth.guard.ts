import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest so it doesn't throw an error if the user is not authenticated
  handleRequest<TUser = any>(err: any, user: TUser): TUser | null {
    return user || null;
  }
}
