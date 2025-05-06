import { createQuery } from '@farfetched/core';

import { createCommonRequestFx } from '@/shared/api/requests';
import { ResponseUserDto } from '@/shared/api/types';

export const sessionQuery = createQuery({
  effect: createCommonRequestFx<void, ResponseUserDto>({
    url: '/profile'
  })
});

export const logoutQuery = createQuery({
  effect: createCommonRequestFx<string, void>((id) => ({
    url: '/auth/sign-out',
    query: {
      id
    }
  }))
});
