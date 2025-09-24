import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetMerchant = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const merchant = request.merchant;

    return data ? merchant?.[data] : merchant;
  },
);
