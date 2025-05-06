import { createRoutesView } from '@argon-router/react';

import { HomeScreen } from './Home';

export const Pages = createRoutesView({
  routes: [HomeScreen],
  otherwise: () => <div>Not found</div>
});
