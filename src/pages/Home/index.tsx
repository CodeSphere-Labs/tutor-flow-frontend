import { createLazyRouteView } from '@argon-router/react';

import { routes } from '@/shared/routing';
import { LoadingPage } from '@/shared/ui/LoadingPage/LoadingPage';

export const HomeScreen = createLazyRouteView({
  route: routes.home,
  view: () => import('./ui/Home'),
  fallback: () => <LoadingPage />
});
