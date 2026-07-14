import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../common/database/entities/user.entity';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
